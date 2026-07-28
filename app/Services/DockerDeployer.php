<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

class DockerDeployer
{
    private const PORT_RANGE_START = 10000;

    private const PORT_RANGE_END = 20000;

    private const NETWORK_NAME = 'hideo_network';

    public function deploy(Project $project): void
    {
        $lock = Cache::lock("project-{$project->id}-deploy", 120);
        if (! $lock->get()) {
            throw new RuntimeException('Deployment already in progress for this project');
        }

        try {
            $this->deployInternal($project);
        } finally {
            $lock->release();
        }
    }

    private function deployInternal(Project $project): void
    {
        set_time_limit(600);
        $sourcePath = $project->sourcePath();

        if (! is_dir($sourcePath)) {
            throw new RuntimeException('Project source not found. Import source first.');
        }

        $this->syncMediaToSource($project, $sourcePath);

        $this->stopContainer($project);

        if ($project->port_auto || ! $project->port) {
            $port = $this->findAvailablePort();
            $project->update(['port' => $port]);
        }
        $port = $project->port;

        $this->ensureNetwork();

        $dockerfile = $this->generateDockerfile($project);

        $imageName = 'hideo-'.$project->slug;
        $buildCmd = sprintf(
            'cd %s && docker build -t %s . 2>&1',
            escapeshellarg($sourcePath),
            escapeshellarg($imageName)
        );

        file_put_contents("{$sourcePath}/Dockerfile", $dockerfile);

        $dockerignore = "vendor\nnode_modules\n.git\n";
        file_put_contents("{$sourcePath}/.dockerignore", $dockerignore);

        exec($buildCmd, $buildOutput, $buildExitCode);
        if ($buildExitCode !== 0) {
            throw new RuntimeException('Docker build failed: '.implode("\n", array_slice($buildOutput, -10)));
        }

        $dbEnv = [];
        if ($project->database_type) {
            $dbEnv = $this->setupDatabase($project);
        }

        $containerName = 'hideo-'.$project->slug;
        $runCmd = sprintf(
            'docker run -d --name %s --network %s --restart unless-stopped -p %d:%d %s',
            escapeshellarg($containerName),
            escapeshellarg(self::NETWORK_NAME),
            $port,
            $project->internal_port ?? 80,
            escapeshellarg($imageName)
        );

        if (! empty($dbEnv)) {
            foreach ($dbEnv as $key => $value) {
                $runCmd .= ' -e '.escapeshellarg("{$key}={$value}");
            }
        }

        exec($runCmd, $runOutput, $runExitCode);
        if ($runExitCode !== 0) {
            throw new RuntimeException('Docker run failed: '.implode("\n", $runOutput));
        }

        $containerId = trim($runOutput[0] ?? '');

        $project->update([
            'container_id' => $containerId,
            'container_status' => 'running',
            'status' => 'published',
            'preview_path' => (string) $port,
        ]);

        if ($project->cloudflare_tunnel_id) {
            try {
                app(CloudflareTunnelService::class)->runTunnel($project);
            } catch (\Throwable) {
            }
        }

        $this->generateNginxConfig($project);
    }

    private function generateNginxConfig(Project $project): void
    {
        $projects = Project::whereNotNull('port')
            ->where('container_status', 'running')
            ->get();

        $configPath = storage_path('app/nginx-hideo.conf');
        $serverName = config('app.domain', 'hideo.test');

        $conf = "# Hideo Hosting - Auto-generated nginx config\n";
        $conf .= '# Generated at '.now()."\n\n";

        foreach ($projects as $p) {
            $conf .= "upstream hideo_{$p->id} {\n";
            $conf .= "    server 127.0.0.1:{$p->port};\n";
            $conf .= "}\n\n";
        }

        $conf .= "# Platform domains (subdomain-based)\n";
        $conf .= "server {\n";
        $conf .= "    listen 80;\n";
        $conf .= "    server_name ~^(?<subdomain>[^.]+)\\.{$serverName}$;\n\n";
        $conf .= "    location / {\n";
        $conf .= "        proxy_pass http://127.0.0.1:3000/p/\$subdomain;\n";
        $conf .= "        proxy_set_header Host \$host;\n";
        $conf .= "        proxy_set_header X-Real-IP \$remote_addr;\n";
        $conf .= "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n";
        $conf .= "        proxy_set_header X-Forwarded-Proto \$scheme;\n";
        $conf .= "    }\n";
        $conf .= "}\n\n";

        $customDomains = $projects->filter(fn ($p) => ! empty($p->custom_domain));
        if ($customDomains->isNotEmpty()) {
            $conf .= "# Custom domains\n";
            foreach ($customDomains as $p) {
                $names = $p->domain
                    ? ["{$p->domain}.{$p->custom_domain}"]
                    : [$p->custom_domain];
                $conf .= "server {\n";
                $conf .= "    listen 80;\n";
                $conf .= '    server_name '.implode(' ', $names).";\n\n";
                $conf .= "    location / {\n";
                $conf .= "        proxy_pass http://hideo_{$p->id};\n";
                $conf .= "        proxy_set_header Host \$host;\n";
                $conf .= "        proxy_set_header X-Real-IP \$remote_addr;\n";
                $conf .= "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n";
                $conf .= "        proxy_set_header X-Forwarded-Proto \$scheme;\n";
                $conf .= "    }\n";
                $conf .= "}\n\n";
            }
        }

        file_put_contents($configPath, $conf);

        exec('nginx -t 2>&1', $testOutput, $testCode);
        if ($testCode === 0) {
            exec('nginx -s reload 2>&1');
        }
    }

    public function stopContainer(Project $project): void
    {
        $name = 'hideo-'.$project->slug;

        exec('docker stop '.escapeshellarg($name).' 2>/dev/null');
        exec('docker rm '.escapeshellarg($name).' 2>/dev/null');

        if ($project->container_id && $project->container_id !== $name) {
            exec('docker stop '.escapeshellarg($project->container_id).' 2>/dev/null');
            exec('docker rm '.escapeshellarg($project->container_id).' 2>/dev/null');
        }

        if ($project->cloudflare_tunnel_id) {
            try {
                app(CloudflareTunnelService::class)->stopTunnelProcess($project);
            } catch (\Throwable) {
            }
        }

        $project->update([
            'container_id' => null,
            'container_status' => 'stopped',
        ]);
    }

    private function syncMediaToSource(Project $project, string $sourcePath): void
    {
        $mediaItems = $project->getMedia('project_files');
        if ($mediaItems->isEmpty()) {
            return;
        }

        foreach ($mediaItems as $media) {
            $relativePath = $media->getCustomProperty('path', $media->file_name);

            if (str_contains($relativePath, '..') || str_starts_with($relativePath, '/') || str_contains($relativePath, "\0")) {
                continue;
            }

            $destPath = "{$sourcePath}/{$relativePath}";
            $destDir = dirname($destPath);
            if (! is_dir($destDir)) {
                mkdir($destDir, 0755, true);
            }
            copy($media->getPath(), $destPath);
        }
    }

    public function getLogs(Project $project, int $lines = 50): string
    {
        $lines = max(1, min(5000, $lines));
        $name = 'hideo-'.$project->slug;

        exec("docker logs --tail {$lines} ".escapeshellarg($name).' 2>&1', $output);

        return implode("\n", $output);
    }

    private function ensureBootstrapFiles(string $sourcePath): void
    {
        if (! is_file("{$sourcePath}/bootstrap/app.php")) {
            @mkdir("{$sourcePath}/bootstrap", 0755, true);
            file_put_contents("{$sourcePath}/bootstrap/app.php", <<<'PHP'
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
PHP
            );
        }

        if (! is_file("{$sourcePath}/bootstrap/providers.php")) {
            file_put_contents("{$sourcePath}/bootstrap/providers.php", <<<'PHP'
<?php

return [
    //
];
PHP
            );
        }

        if (! is_file("{$sourcePath}/routes/web.php")) {
            @mkdir("{$sourcePath}/routes", 0755, true);
            file_put_contents("{$sourcePath}/routes/web.php", <<<'PHP'
<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response('Hello from Hideo Hosting!');
})->name('home');
PHP
            );
        }

        if (! is_file("{$sourcePath}/routes/console.php")) {
            file_put_contents("{$sourcePath}/routes/console.php", <<<'PHP'
<?php

use Illuminate\Support\Facades\Schedule;
PHP
            );
        }

        if (! is_file("{$sourcePath}/public/index.php")) {
            file_put_contents("{$sourcePath}/public/index.php", <<<'PHP'
<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
PHP
            );
        }
    }

    private function generateDockerfile(Project $project): string
    {
        $scanner = app(FrameworkScanner::class);
        $info = $scanner->scan($project->sourcePath());
        $sourcePath = $project->sourcePath();

        if ($info['language'] === 'php') {
            $this->ensureBootstrapFiles($sourcePath);
        }

        $baseImage = $info['docker_base_image'];
        $installCmd = $info['install_command'];
        $buildCmd = $info['build_command'];
        $startCmd = $info['start_command'];
        $outputDir = $info['output_dir'];
        $port = $project->internal_port ?? $info['internal_port'];

        switch ($info['language']) {
            case 'javascript':
                return $this->nodeDockerfile($baseImage, $installCmd, $buildCmd, $startCmd, $outputDir, $port);

            case 'php':
                return $this->phpDockerfile($baseImage, $installCmd, $startCmd, $outputDir, $port);

            case 'python':
                return $this->pythonDockerfile($baseImage, $installCmd, $startCmd, $port);

            case 'ruby':
                return $this->rubyDockerfile($baseImage, $installCmd, $startCmd, $port);

            case 'go':
                return $this->goDockerfile($baseImage, $installCmd, $buildCmd, $startCmd, $port);

            default:
                return $this->staticDockerfile($port);
        }
    }

    private function nodeDockerfile(string $base, ?string $install, ?string $build, ?string $start, ?string $output, int $port): string
    {
        $df = "FROM {$base} AS builder\nWORKDIR /app\nCOPY package*.json ./\n";
        $df .= "COPY . .\n";

        if ($install) {
            $df .= "RUN {$install}\n";
        }
        if ($build) {
            $df .= "RUN {$build}\n";
        }

        if ($output && $build) {
            $df .= "\nFROM nginx:alpine\nCOPY --from=builder /app/{$output} /usr/share/nginx/html\n";
            $df .= "EXPOSE 80\nCMD [\"nginx\", \"-g\", \"daemon off;\"]\n";
        } else {
            $df .= "EXPOSE {$port}\n";
            if ($start) {
                $df .= 'CMD '.json_encode(['sh', '-c', $start])."\n";
            } else {
                $df .= "CMD [\"node\", \"index.js\"]\n";
            }
        }

        return $df;
    }

    private function phpDockerfile(string $base, ?string $install, ?string $start, ?string $output, int $port): string
    {
        $df = "FROM {$base}\n";
        $df .= "RUN apt-get update && apt-get install -y --no-install-recommends \\\n";
        $df .= "        unzip curl git libzip-dev libonig-dev \\\n";
        $df .= "    && docker-php-ext-install -j\$(nproc) pdo_mysql mbstring bcmath zip \\\n";
        $df .= "    && apt-get clean && rm -rf /var/lib/apt/lists/*\n";
        $df .= "RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer\n";
        $df .= "WORKDIR /var/www/html\n";
        $df .= "COPY . .\n";

        if ($install) {
            $df .= "RUN {$install}\n";
        }

        if ($start) {
            $start = str_replace('{port}', (string) $port, $start);
            $df .= 'CMD '.json_encode(['sh', '-c', $start])."\n";
        }

        $df .= "EXPOSE {$port}\n";

        return $df;
    }

    private function pythonDockerfile(string $base, ?string $install, ?string $start, int $port): string
    {
        $df = "FROM {$base}\nWORKDIR /app\n";

        if ($install) {
            $df .= "RUN {$install}\n";
        }

        $df .= "COPY . .\n";
        $df .= "EXPOSE {$port}\n";
        if ($start) {
            $df .= 'CMD '.json_encode(['sh', '-c', $start])."\n";
        }

        return $df;
    }

    private function rubyDockerfile(string $base, ?string $install, ?string $start, int $port): string
    {
        $df = "FROM {$base}\nWORKDIR /app\n";
        $df .= "COPY . .\n";

        if ($install) {
            $df .= "RUN {$install}\n";
        }

        $df .= "EXPOSE {$port}\n";
        if ($start) {
            $df .= 'CMD '.json_encode(['sh', '-c', $start])."\n";
        }

        return $df;
    }

    private function goDockerfile(string $base, ?string $install, ?string $start, int $port): string
    {
        $df = "FROM {$base} AS builder\nWORKDIR /app\nCOPY go.mod go.sum ./\n";
        $df .= "RUN go mod download\nCOPY . .\nRUN go build -o app .\n\n";
        $df .= "FROM alpine:latest\nWORKDIR /root/\n";
        $df .= "COPY --from=builder /app/app .\n";
        $df .= "EXPOSE {$port}\nCMD [\"./app\"]\n";

        return $df;
    }

    private function staticDockerfile(int $port): string
    {
        return "FROM nginx:alpine\nCOPY . /usr/share/nginx/html\nEXPOSE 80\nCMD [\"nginx\", \"-g\", \"daemon off;\"]\n";
    }

    private function findAvailablePort(): int
    {
        $lock = Cache::lock('port-allocation', 10);

        if (! $lock->get()) {
            throw new RuntimeException('Could not acquire port allocation lock. Try again.');
        }

        try {
            for ($port = self::PORT_RANGE_START; $port <= self::PORT_RANGE_END; $port++) {
                $existing = Project::where('port', $port)->where('container_status', 'running')->exists();
                if ($existing) {
                    continue;
                }
                $conn = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.3);
                if (! is_resource($conn)) {
                    return $port;
                }
                fclose($conn);
            }
        } finally {
            $lock->release();
        }

        throw new RuntimeException('No available ports found');
    }

    private function ensureNetwork(): void
    {
        exec('docker network ls --filter name='.escapeshellarg(self::NETWORK_NAME).' -q 2>&1', $output);
        if (empty($output[0])) {
            exec('docker network create '.escapeshellarg(self::NETWORK_NAME).' 2>&1');
        }
    }

    private function setupDatabase(Project $project): array
    {
        $dbName = $project->database_name ?? ('hideo_'.$project->slug);
        $dbUser = 'hideo_user';
        $dbSecret = config('app.key');
        $dbPass = hash_hmac('sha256', (string) $project->id, $dbSecret);
        $containerName = 'hideo-db-'.$project->slug;

        switch ($project->database_type) {
            case 'mysql':
                $dbContainer = 'mysql:8.4';
                $env = [
                    'MYSQL_ROOT_PASSWORD' => hash_hmac('sha256', (string) $project->id.'-root', $dbSecret),
                    'MYSQL_DATABASE' => $dbName,
                    'MYSQL_USER' => $dbUser,
                    'MYSQL_PASSWORD' => $dbPass,
                ];
                $dbPort = $this->findAvailablePort();
                $runCmd = 'docker run -d --name '.escapeshellarg($containerName)
                    .' --network '.escapeshellarg(self::NETWORK_NAME)
                    .' -p '.$dbPort.':3306';
                foreach ($env as $k => $v) {
                    $runCmd .= ' -e '.escapeshellarg("{$k}={$v}");
                }
                $runCmd .= ' '.$dbContainer;
                exec($runCmd);

                return [
                    'DB_CONNECTION' => 'mysql',
                    'DB_HOST' => $containerName,
                    'DB_PORT' => '3306',
                    'DB_DATABASE' => $dbName,
                    'DB_USERNAME' => $dbUser,
                    'DB_PASSWORD' => $dbPass,
                ];

            case 'postgresql':
                $env = [
                    'POSTGRES_DB' => $dbName,
                    'POSTGRES_USER' => $dbUser,
                    'POSTGRES_PASSWORD' => $dbPass,
                ];
                $dbPort = $this->findAvailablePort();
                $runCmd = 'docker run -d --name '.escapeshellarg($containerName)
                    .' --network '.escapeshellarg(self::NETWORK_NAME)
                    .' -p '.$dbPort.':5432';
                foreach ($env as $k => $v) {
                    $runCmd .= ' -e '.escapeshellarg("{$k}={$v}");
                }
                $runCmd .= ' postgres:16-alpine';
                exec($runCmd);

                return [
                    'DB_CONNECTION' => 'pgsql',
                    'DB_HOST' => $containerName,
                    'DB_PORT' => '5432',
                    'DB_DATABASE' => $dbName,
                    'DB_USERNAME' => $dbUser,
                    'DB_PASSWORD' => $dbPass,
                ];

            case 'sqlite':
                return [
                    'DB_CONNECTION' => 'sqlite',
                    'DB_DATABASE' => '/app/database/database.sqlite',
                ];

            default:
                return [];
        }
    }
}
