<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProjectDetailResource;
use App\Http\Resources\ProjectResource;
use App\Models\Deployment;
use App\Models\Project;
use App\Services\CloudflareService;
use App\Services\CloudflareTunnelService;
use App\Services\DockerDeployer;
use App\Services\FrameworkScanner;
use App\Services\SourceManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Project::forUser($request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $projects = $query->orderBy('created_at', 'desc')
            ->paginate($request->integer('limit', 20));

        $userId = $request->user()->id;

        return response()->json([
            'success' => true,
            'data' => [
                'projects' => ProjectResource::collection($projects),
                'total' => $projects->total(),
                'page' => $projects->currentPage(),
                'limit' => $projects->perPage(),
                'published' => Project::forUser($userId)->where('status', 'published')->count(),
                'draft' => Project::forUser($userId)->where('status', 'draft')->count(),
                'archived' => Project::forUser($userId)->where('status', 'archived')->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $slug = $this->generateUniqueSlug($validated['name']);

        $project = Project::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
        ]);

        try {
            $destPath = $project->sourcePath();
            if (! is_dir($destPath)) {
                mkdir($destPath, 0755, true);
            }
            file_put_contents("{$destPath}/index.html", '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>'.htmlspecialchars($project->name).'</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; background: #f8fafc; color: #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; max-width: 480px; }
    .logo { width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 1.5rem; margin-left: auto; margin-right: auto; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { color: #64748b; line-height: 1.6; font-size: 0.95rem; }
    .status { margin-top: 2rem; padding: 0.75rem 1.25rem; background: #f1f5f9; border-radius: 9999px; display: inline-block; font-size: 0.8rem; color: #475569; }
    .deploy-hint { margin-top: 2rem; font-size: 0.8rem; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">H</div>
    <h1>'.htmlspecialchars($project->name).'</h1>
    <p>This project is ready for deployment. Upload your source code via ZIP, GitHub, or files to get started.</p>
    <div class="status">Waiting for source code</div>
    <div class="deploy-hint">Powered by Hideo Hosting</div>
  </div>
</body>
</html>');

            $project->update([
                'source_type' => 'default',
                'framework' => 'static',
                'internal_port' => 80,
            ]);
        } catch (\Throwable) {
        }

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully',
            'data' => new ProjectResource($project),
        ], 201);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $project->load(['deployments' => function ($q) {
            $q->orderBy('created_at', 'desc');
        }]);

        return response()->json([
            'success' => true,
            'data' => new ProjectDetailResource($project),
        ]);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:draft,published,archived',
        ]);

        $project->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully',
            'data' => new ProjectResource($project),
        ]);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        try {
            app(DockerDeployer::class)->stopContainer($project);
        } catch (\Throwable) {
        }

        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully',
        ]);
    }

    public function importGithub(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'url' => 'required|string|max:500',
        ]);

        try {
            app(SourceManager::class)->importFromGithub($project, $validated['url']);

            return response()->json([
                'success' => true,
                'message' => 'Repository cloned successfully',
                'data' => new ProjectResource($project),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function importZip(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $request->validate([
            'file' => 'required|file|mimes:zip|max:'.config('app.max_upload_size', 102400),
        ]);

        try {
            app(SourceManager::class)->importFromZip($project, $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => 'ZIP file extracted successfully',
                'data' => new ProjectResource($project),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function scan(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $sourcePath = $project->sourcePath();
        if (! is_dir($sourcePath)) {
            return response()->json([
                'success' => false,
                'message' => 'No source imported yet. Import from GitHub or upload ZIP first.',
            ], 422);
        }

        $info = app(FrameworkScanner::class)->scan($sourcePath);

        $project->update([
            'framework' => $info['framework'],
            'framework_version' => $info['framework_version'],
            'build_command' => $info['build_command'],
            'output_dir' => $info['output_dir'],
            'internal_port' => $info['internal_port'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $info,
        ]);
    }

    public function updateConfig(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'framework' => 'nullable|string|max:50',
            'build_command' => 'nullable|string|max:500',
            'output_dir' => 'nullable|string|max:200',
            'internal_port' => 'nullable|integer|min:1|max:65535',
            'port' => 'nullable|integer|min:1024|max:65535',
            'port_auto' => 'boolean',
            'database_type' => 'nullable|in:mysql,sqlite,postgresql',
            'database_name' => 'nullable|string|max:100',
            'domain' => 'nullable|string|max:255',
            'custom_domain' => 'nullable|string|max:255|unique:projects,custom_domain,'.$project->id,
            'cloudflare_api_token' => 'nullable|string|max:255',
            'cloudflare_zone_id' => 'nullable|string|max:255',
            'cloudflare_account_id' => 'nullable|string|max:255',
            'cloudflare_tunnel_id' => 'nullable|string|max:255',
        ]);

        $serverIp = config('app.domain_ip') ?: env('APP_DOMAIN_IP');
        $oldCustomDomain = $project->custom_domain;
        $oldDomain = $project->domain;

        foreach (['cloudflare_api_token', 'cloudflare_zone_id', 'cloudflare_account_id'] as $cfField) {
            if (array_key_exists($cfField, $validated) && ($validated[$cfField] === null || $validated[$cfField] === '********')) {
                unset($validated[$cfField]);
            }
        }

        if (array_key_exists('custom_domain', $validated) && $validated['custom_domain'] !== $oldCustomDomain) {
            $validated['domain_status'] = $validated['custom_domain'] ? 'pending' : null;
        }

        $project->update($validated);

        $cf = CloudflareService::forProject($project);
        if ($serverIp && $cf) {
            try {
                $newCustomDomain = $project->custom_domain;
                $newDomain = $project->domain;

                if ($oldCustomDomain && $oldCustomDomain !== $newCustomDomain) {
                    $cf->deleteRecordByName($oldCustomDomain);
                    if ($oldDomain) {
                        $cf->deleteRecordByName("{$oldDomain}.{$oldCustomDomain}");
                    }
                }
                if ($oldDomain && $oldDomain !== $newDomain && $oldCustomDomain === $newCustomDomain) {
                    $cf->deleteRecordByName("{$oldDomain}.{$newCustomDomain}");
                }

                if ($newCustomDomain) {
                    $cf->ensureARecord($newCustomDomain, $serverIp);
                    if ($newDomain) {
                        $cf->ensureARecord("{$newDomain}.{$newCustomDomain}", $serverIp);
                    }
                }
            } catch (\Throwable $e) {
                logger()->warning("Cloudflare DNS auto-config failed: {$e->getMessage()}");
            }
        }

        $this->recordDeploymentFromConfig($project, $validated, $oldDomain, $oldCustomDomain);

        return response()->json([
            'success' => true,
            'message' => 'Configuration updated',
            'data' => new ProjectResource($project),
        ]);
    }

    public function verifyDomain(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $domain = $project->custom_domain;
        if (! $domain) {
            return response()->json([
                'success' => false,
                'message' => 'No custom domain set for this project',
            ], 422);
        }

        $serverIp = config('app.domain_ip') ?: env('APP_DOMAIN_IP');
        if (! $serverIp) {
            $resp = @file_get_contents('https://api.ipify.org?format=json', false, stream_context_create(['http' => ['timeout' => 3]]));
            if ($resp) {
                $data = json_decode($resp, true);
                $serverIp = $data['ip'] ?? null;
            }
        }

        $records = @dns_get_record($domain, DNS_A);
        $matches = false;
        $resolvedIps = [];

        if ($records) {
            foreach ($records as $record) {
                if (! empty($record['ip'])) {
                    $resolvedIps[] = $record['ip'];
                    if ($serverIp && $record['ip'] === $serverIp) {
                        $matches = true;
                    }
                }
            }
        }

        $status = $matches ? 'active' : ($resolvedIps ? 'failed' : 'pending');
        $project->update(['domain_status' => $status]);

        $nextVersion = ($project->deployments()->max('version') ?? 0) + 1;
        Deployment::create([
            'project_id' => $project->id,
            'version' => $nextVersion,
            'status' => 'deployed',
            'description' => $status === 'active'
                ? "Domain\n{$domain} verified → {$serverIp}"
                : "Domain\n{$domain} ({$status})",
            'changed_files' => [],
            'deployed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $status,
                'domain' => $domain,
                'server_ip' => $serverIp,
                'resolved_ips' => $resolvedIps,
            ],
        ]);
    }

    public function setupTunnel(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        try {
            $result = app(CloudflareTunnelService::class)->setupTunnel($project);

            $version = ($project->deployments()->max('version') ?? 0) + 1;
            Deployment::create([
                'project_id' => $project->id,
                'version' => $version,
                'status' => 'deployed',
                'description' => "Tunnel\nconfigured",
                'changed_files' => [],
                'deployed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tunnel configured successfully',
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function teardownTunnel(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $mode = $request->input('mode', 'all');
        if (! in_array($mode, ['all', 'dns', 'tunnel'], true)) {
            return response()->json(['success' => false, 'message' => 'Invalid mode'], 422);
        }

        try {
            app(CloudflareTunnelService::class)->teardownTunnel($project, $mode);

            $labels = ['all' => "Tunnel\nremoved (all)", 'dns' => "DNS\ntunnel removed", 'tunnel' => "Tunnel\nremoved"];
            $nextVersion = ($project->deployments()->max('version') ?? 0) + 1;
            Deployment::create([
                'project_id' => $project->id,
                'version' => $nextVersion,
                'status' => 'deployed',
                'description' => $labels[$mode],
                'changed_files' => [],
                'deployed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => $labels[$mode],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function runTunnel(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        try {
            $result = app(CloudflareTunnelService::class)->runTunnel($project);

            return response()->json([
                'success' => true,
                'message' => 'Tunnel started',
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function tunnelStatus(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }
        $status = app(CloudflareTunnelService::class)->getTunnelStatus($project);

        return response()->json(['success' => true, 'data' => $status]);
    }

    public function getTunnelToken(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        if (! $project->cloudflare_tunnel_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tunnel configured for this project.',
            ], 422);
        }

        try {
            $cf = CloudflareService::forProject($project);
            if (! $cf) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cloudflare credentials not configured.',
                ], 422);
            }
            $token = $cf->getTunnelToken($project->cloudflare_tunnel_id);

            return response()->json([
                'success' => true,
                'data' => ['token' => $token],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function deploy(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        if (! is_dir($project->sourcePath()) && $project->getMedia('project_files')->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No source files. Import from GitHub, upload ZIP, or upload files first.',
            ], 422);
        }

        if ($project->source_type === 'manual' || ! is_dir($project->sourcePath())) {
            return $this->legacyDeploy($project);
        }

        try {
            app(DockerDeployer::class)->deploy($project);

            return response()->json([
                'success' => true,
                'message' => 'Deployed on port '.$project->port,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "Deploy failed: {$e->getMessage()}",
            ], 500);
        }
    }

    public function stop(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        try {
            app(DockerDeployer::class)->stopContainer($project);

            return response()->json([
                'success' => true,
                'message' => 'Container stopped',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function logs(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $lines = $request->integer('lines', 50);
        $logOutput = app(DockerDeployer::class)->getLogs($project, $lines);

        return response()->json([
            'success' => true,
            'data' => $logOutput,
        ]);
    }

    private function legacyDeploy(Project $project): JsonResponse
    {
        $buildId = Str::random(12);
        $buildPath = storage_path("app/builds/{$buildId}");
        $previewPath = "previews/{$project->slug}";
        $previewFullPath = storage_path("app/public/{$previewPath}");

        $mediaItems = $project->getMedia('project_files');
        foreach ($mediaItems as $media) {
            $relativePath = $media->getCustomProperty('path', $media->file_name);
            $destPath = "{$buildPath}/{$relativePath}";
            $destDir = dirname($destPath);
            if (! is_dir($destDir)) {
                mkdir($destDir, 0755, true);
            }
            copy($media->getPath(), $destPath);
        }

        $status = 'deployed';
        $error = null;
        $outputDir = $buildPath;

        try {
            $framework = $this->detectFramework($buildPath);
            if ($framework) {
                $outputDir = $this->runBuild($framework);
            }
        } catch (\Throwable $e) {
            $status = 'failed';
            $error = $e->getMessage();
        }

        if (is_dir($previewFullPath)) {
            $this->deleteDirectory($previewFullPath);
        }
        if (is_dir($outputDir)) {
            $this->copyDirectory($outputDir, $previewFullPath);
        }
        if (is_dir($buildPath)) {
            $this->deleteDirectory($buildPath);
        }

        $project->update([
            'preview_path' => $previewPath,
            'status' => $status === 'deployed' ? 'published' : 'draft',
        ]);

        return response()->json([
            'success' => $status === 'deployed',
            'message' => $status === 'deployed' ? 'Project deployed successfully' : "Deployment failed: {$error}",
        ]);
    }

    private function detectFramework(string $path): ?array
    {
        if (file_exists("{$path}/package.json")) {
            $pkg = json_decode(file_get_contents("{$path}/package.json"), true);
            $hasBuildScript = isset($pkg['scripts']['build']);
            $deps = array_merge(
                array_keys($pkg['dependencies'] ?? []),
                array_keys($pkg['devDependencies'] ?? [])
            );
            $outputDir = null;
            $name = 'static';

            if (in_array('next', $deps)) {
                $outputDir = '.next';
                $name = 'nextjs';
            } elseif (in_array('react-scripts', $deps) || in_array('vite', $deps)) {
                $outputDir = 'dist';
                $name = 'react';
            } elseif (in_array('@angular/core', $deps)) {
                $outputDir = 'dist';
                $name = 'angular';
            } elseif (in_array('vue', $deps) || in_array('@vue/cli-service', $deps)) {
                $outputDir = 'dist';
                $name = 'vue';
            } elseif (in_array('svelte', $deps) || in_array('svelte-kit', $deps)) {
                $outputDir = 'build';
                $name = 'svelte';
            } elseif (in_array('gatsby', $deps)) {
                $outputDir = 'public';
                $name = 'gatsby';
            } elseif (in_array('nuxt', $deps) || in_array('nuxt3', $deps)) {
                $outputDir = 'dist';
                $name = 'nuxt';
            }

            return ['type' => 'node', 'name' => $name, 'has_build' => $hasBuildScript, 'output_dir' => $outputDir, 'path' => $path];
        }

        if (file_exists("{$path}/composer.json")) {
            return ['type' => 'php', 'name' => 'laravel', 'has_build' => true, 'output_dir' => 'public', 'path' => $path];
        }

        return null;
    }

    private function runBuild(array $framework): string
    {
        $path = $framework['path'];
        $outputDir = "{$path}/".($framework['output_dir'] ?? '');

        if ($framework['type'] === 'node' && $framework['has_build']) {
            $installCmd = 'cd '.escapeshellarg($path).' && npm install 2>&1';
            exec($installCmd, $installOutput, $installExitCode);
            if ($installExitCode !== 0) {
                throw new \RuntimeException('npm install failed: '.implode("\n", array_slice($installOutput, -10)));
            }

            $buildCmd = 'cd '.escapeshellarg($path).' && npm run build 2>&1';
            exec($buildCmd, $buildOutput, $buildExitCode);
            if ($buildExitCode !== 0) {
                throw new \RuntimeException('Build failed: '.implode("\n", array_slice($buildOutput, -10)));
            }
        }

        if ($framework['type'] === 'php') {
            $installCmd = 'cd '.escapeshellarg($path).' && composer install --no-dev --optimize-autoloader 2>&1';
            exec($installCmd, $installOutput, $installExitCode);
            if ($installExitCode !== 0) {
                throw new \RuntimeException('composer install failed: '.implode("\n", array_slice($installOutput, -10)));
            }
        }

        return ($framework['output_dir'] && is_dir($outputDir)) ? $outputDir : $path;
    }

    private function generateUniqueSlug(string $name): string
    {
        $slug = Str::slug($name);
        $base = $slug;
        $counter = 1;
        while (Project::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    private function recordDeploymentFromConfig(Project $project, array $validated, ?string $oldDomain, ?string $oldCustomDomain): void
    {
        $descriptionParts = [];

        $description = null;

        if (array_key_exists('domain', $validated) && $validated['domain'] !== $oldDomain) {
            $from = $oldDomain ?: null;
            $to = $validated['domain'] ?: null;
            if ($from && $to) {
                $description = "Subdomain\n{$from} → {$to}";
            } elseif ($to) {
                $description = "Subdomain\n(null) → {$to}";
            } elseif ($from) {
                $description = "Subdomain\n{$from} → (removed)";
            }
        }

        if (array_key_exists('custom_domain', $validated) && $validated['custom_domain'] !== $oldCustomDomain) {
            $from = $oldCustomDomain ?: null;
            $to = $validated['custom_domain'] ?: null;
            if ($from && $to) {
                $description = "Domain\n{$from} → {$to}";
            } elseif ($to) {
                $description = "Domain\n(null) → {$to}";
            } elseif ($from) {
                $description = "Domain\n{$from} → (removed)";
            }
        }

        $cfFields = ['cloudflare_api_token', 'cloudflare_zone_id', 'cloudflare_account_id', 'cloudflare_tunnel_id'];
        foreach ($cfFields as $field) {
            if (array_key_exists($field, $validated)) {
                $label = str_replace('cloudflare_', '', str_replace('_', ' ', $field));
                $value = $validated[$field];
                if ($value && $value !== '********') {
                    $description = "{$label}\nupdated";
                }
            }
        }

        if (! $description) {
            return;
        }

        $nextVersion = ($project->deployments()->max('version') ?? 0) + 1;
        Deployment::create([
            'project_id' => $project->id,
            'version' => $nextVersion,
            'status' => 'deployed',
            'description' => $description,
            'changed_files' => [],
            'deployed_at' => now(),
        ]);
    }

    private function detectChangedFiles(Project $project): array
    {
        $currentFiles = $this->scanSourceFiles($project);
        $previousDeployment = $project->deployments()->whereNotNull('changed_files')->latest()->first();
        $previousFiles = $previousDeployment ? ($previousDeployment->changed_files ?? []) : [];

        $prevMap = [];
        foreach ($previousFiles as $pf) {
            $prevMap[$pf['path']] = $pf['modified_at'];
        }

        $changed = [];
        foreach ($currentFiles as $cf) {
            $path = $cf['path'];
            if (! isset($prevMap[$path])) {
                $cf['status'] = 'added';
            } elseif ($prevMap[$path] !== $cf['modified_at']) {
                $cf['status'] = 'modified';
            } else {
                $cf['status'] = 'unchanged';
            }
            $changed[] = $cf;
        }

        foreach ($prevMap as $path => $modifiedAt) {
            $found = false;
            foreach ($changed as $cf) {
                if ($cf['path'] === $path) {
                    $found = true;
                    break;
                }
            }
            if (! $found) {
                $changed[] = ['path' => $path, 'status' => 'deleted', 'modified_at' => $modifiedAt];
            }
        }

        return $changed;
    }

    private function scanSourceFiles(Project $project): array
    {
        $basePath = $project->sourcePath();
        if (! is_dir($basePath)) {
            return [];
        }

        $files = [];
        $this->scanDirRecursive($basePath, '', $files);

        return $files;
    }

    private function scanDirRecursive(string $basePath, string $relative, array &$files): void
    {
        $fullPath = $basePath.($relative ? '/'.$relative : '');
        if (! is_dir($fullPath)) {
            return;
        }

        $items = scandir($fullPath);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            if ($item === 'node_modules' || $item === '.git' || $item === 'vendor') {
                continue;
            }

            $itemPath = $relative ? "{$relative}/{$item}" : $item;
            $itemFull = "{$fullPath}/{$item}";

            if (is_dir($itemFull)) {
                $this->scanDirRecursive($basePath, $itemPath, $files);
            } else {
                $files[] = [
                    'path' => $itemPath,
                    'modified_at' => filemtime($itemFull),
                ];
            }
        }
    }

    private function copyDirectory(string $src, string $dst): void
    {
        if (! is_dir($src)) {
            return;
        }
        if (! is_dir($dst)) {
            mkdir($dst, 0755, true);
        }
        $items = scandir($src);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $srcPath = "{$src}/{$item}";
            $dstPath = "{$dst}/{$item}";
            is_dir($srcPath) ? $this->copyDirectory($srcPath, $dstPath) : copy($srcPath, $dstPath);
        }
    }

    private function deleteDirectory(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }
        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = "{$dir}/{$item}";
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
