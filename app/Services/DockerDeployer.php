<?php

namespace App\Services;

use App\Models\Project;
use RuntimeException;

class DockerDeployer
{
    private const PORT_RANGE_START = 10000;

    private const PORT_RANGE_END = 20000;

    private const NETWORK_NAME = 'hideo_network';

    public function deploy(Project $project): void
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
        if ($project->database_type && $project->database_type !== 'sqlite') {
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
            'preview_path' => "http://localhost:{$port}",
        ]);

        $this->generateNginxConfig($project);
    }

    private function generateNginxConfig(Project $project): void
    {
        $projects = Project::whereNotNull('port')
            ->where('container_status', 'running')
            ->get();

        $configPath = storage_path('app/nginx-hideo.conf');
        $serverName = config('app.domain', env('APP_DOMAIN', 'hideo.test'));

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
    }

    public function stopContainer(Project $project): void
    {
        $name = 'hideo-'.$project->slug;

        exec("docker stop {$name} 2>/dev/null");
        exec("docker rm {$name} 2>/dev/null");

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
        $name = 'hideo-'.$project->slug;
        exec("docker logs --tail {$lines} {$name} 2>&1", $output);

        return implode("\n", $output);
    }

    private function generateDockerfile(Project $project): string
    {
        $scanner = app(FrameworkScanner::class);
        $info = $scanner->scan($project->sourcePath());

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
                return $this->goDockerfile($baseImage, $installCmd, $startCmd, $port);

            default:
                return $this->staticDockerfile($port);
        }
    }

    private function nodeDockerfile(string $base, ?string $install, ?string $build, ?string $start, ?string $output, int $port): string
    {
        $df = "FROM {$base} AS builder\nWORKDIR /app\nCOPY package*.json ./\n";

        if ($install) {
            $df .= "RUN {$install}\n";
        }

        $df .= "COPY . .\n";

        if ($build) {
            $df .= "RUN {$build}\n";
        }

        if ($output && $build) {
            $df .= "\nFROM nginx:alpine\nCOPY --from=builder /app/{$output} /usr/share/nginx/html\n";
            $df .= "EXPOSE 80\nCMD [\"nginx\", \"-g\", \"daemon off;\"]\n";
        } else {
            $df .= "EXPOSE {$port}\n";
            if ($start) {
                $df .= "CMD [\"sh\", \"-c\", \"{$start}\"]\n";
            } else {
                $df .= "CMD [\"node\", \"index.js\"]\n";
            }
        }

        return $df;
    }

    private function phpDockerfile(string $base, ?string $install, ?string $start, ?string $output, int $port): string
    {
        $df = "FROM {$base}\n";
        $df .= "RUN apt-get update && apt-get install -y unzip curl && \\\n";
        $df .= "    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer\n";
        $df .= "WORKDIR /var/www/html\n";
        $df .= "COPY --chown=www-data:www-data . .\n";

        if ($install) {
            $df .= "RUN {$install}\n";
        }

        if ($start) {
            $start = str_replace('{port}', (string) $port, $start);
            $df .= "CMD [\"sh\", \"-c\", \"{$start}\"]\n";
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
            $df .= "CMD [\"sh\", \"-c\", \"{$start}\"]\n";
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
            $df .= "CMD [\"sh\", \"-c\", \"{$start}\"]\n";
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
        for ($port = self::PORT_RANGE_START; $port <= self::PORT_RANGE_END; $port++) {
            $conn = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.5);
            if (! is_resource($conn)) {
                return $port;
            }
            fclose($conn);
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
        $dbPass = bin2hex(random_bytes(16));
        $containerName = 'hideo-db-'.$project->slug;

        switch ($project->database_type) {
            case 'mysql':
                $dbContainer = 'mysql:8.4';
                $env = [
                    'MYSQL_ROOT_PASSWORD' => bin2hex(random_bytes(16)),
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
