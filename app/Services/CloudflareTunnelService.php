<?php

namespace App\Services;

use App\Models\Project;
use RuntimeException;

class CloudflareTunnelService
{
    public function setupTunnel(Project $project): array
    {
        $cf = CloudflareService::forProject($project);
        if (! $cf) {
            throw new RuntimeException('Cloudflare credentials not configured for this project.');
        }

        $tunnelName = "hideo-{$project->slug}-{$project->id}";

        if ($project->cloudflare_tunnel_id) {
            try {
                $cf->getTunnel($project->cloudflare_tunnel_id);
            } catch (\Throwable $e) {
                if (str_contains($e->getMessage(), '404')) {
                    $project->update(['cloudflare_tunnel_id' => null]);
                }
            }
        }

        if (! $project->cloudflare_tunnel_id) {
            try {
                $existingTunnels = $cf->listTunnels();
                $existing = collect($existingTunnels['result'] ?? [])->firstWhere('name', $tunnelName);
                if ($existing) {
                    $cf->deleteTunnel($existing['id']);
                }
            } catch (\Throwable) {
            }

            $secret = bin2hex(random_bytes(32));
            $result = $cf->createTunnel($tunnelName, $secret);
            $tunnelId = $result['result']['id'] ?? null;
            if (! $tunnelId) {
                throw new RuntimeException('Failed to create Cloudflare Tunnel.');
            }
            $project->update(['cloudflare_tunnel_id' => $tunnelId]);
        }

        $hostPort = $project->port ?: $project->internal_port ?: 80;
        $service = "http://localhost:{$hostPort}";

        $routeDomain = $project->domain && $project->custom_domain
            ? "{$project->domain}.{$project->custom_domain}"
            : ($project->custom_domain ?: $project->domain ?: $tunnelName);

        $cf->configureTunnelRoute($project->cloudflare_tunnel_id, $routeDomain, $service);

        $tunnelCname = "{$project->cloudflare_tunnel_id}.cfargotunnel.com";
        try {
            $cf->deleteRecordByName($routeDomain, 'CNAME');
        } catch (\Throwable) {
        }
        $cf->createCNAMERecord($routeDomain, $tunnelCname);

        $this->runTunnel($project);

        return [
            'tunnel_id' => $project->cloudflare_tunnel_id,
            'tunnel_name' => $tunnelName,
            'route_domain' => $routeDomain,
            'service' => $service,
        ];
    }

    public function runTunnel(Project $project): array
    {
        if (! $project->cloudflare_tunnel_id) {
            throw new RuntimeException('No tunnel configured for this project.');
        }

        $cf = CloudflareService::forProject($project);
        if (! $cf) {
            throw new RuntimeException('Cloudflare credentials not configured.');
        }

        $token = $cf->getTunnelToken($project->cloudflare_tunnel_id);

        $this->stopTunnelProcess($project);

        $outputFile = storage_path("logs/tunnel-{$project->id}.log");
        $pidFile = storage_path("logs/tunnel-{$project->id}.pid");

        $pid = $this->startTunnelProcess($token, $outputFile, $pidFile);

        return [
            'pid' => trim($pid ?: 'unknown'),
            'log_file' => "tunnel-{$project->id}.log",
        ];
    }

    private function startTunnelProcess(string $token, string $outputFile, string $pidFile): string
    {
        $escapedToken = escapeshellarg($token);
        $escapedOutput = escapeshellarg($outputFile);
        $escapedPidFile = escapeshellarg($pidFile);

        $fullCommand = "nohup cloudflared tunnel run --token {$escapedToken} >> {$escapedOutput} 2>&1 & echo $! > {$escapedPidFile}";
        exec($fullCommand);

        usleep(500000);
        $pid = @file_get_contents($pidFile);

        return trim($pid ?: 'unknown');
    }

    public function stopTunnelProcess(Project $project): void
    {
        $pidFile = storage_path("logs/tunnel-{$project->id}.pid");
        $outputFile = storage_path("logs/tunnel-{$project->id}.log");

        if (file_exists($pidFile)) {
            $oldPid = trim(file_get_contents($pidFile));
            if ($oldPid && ctype_digit($oldPid)) {
                $intPid = (int) $oldPid;
                exec("kill -9 {$intPid} 2>/dev/null");
            }
            @unlink($pidFile);
        }

        $escapedOutput = escapeshellarg($outputFile);
        exec("fuser -k {$escapedOutput} 2>/dev/null");

        $escapedPattern = escapeshellarg("tunnel-{$project->id}.");
        exec("pkill -9 -f {$escapedPattern} 2>/dev/null");
    }

    public function getTunnelStatus(Project $project): array
    {
        $status = [
            'tunnel_id' => null,
            'status' => 'not_configured',
            'status_label' => 'Not Configured',
            'healthy' => false,
            'connected' => false,
        ];

        if (! $project->cloudflare_tunnel_id) {
            return $status;
        }

        $cf = CloudflareService::forProject($project);
        if (! $cf) {
            $status['tunnel_id'] = $project->cloudflare_tunnel_id;
            $status['status'] = 'no_credentials';
            $status['status_label'] = 'No Credentials';

            return $status;
        }

        $pidFile = storage_path("logs/tunnel-{$project->id}.pid");
        $processRunning = false;
        if (file_exists($pidFile)) {
            $pid = trim(file_get_contents($pidFile));
            if ($pid && ctype_digit($pid)) {
                $processRunning = (bool) trim(exec('ps -p '.(int) $pid.' -o pid= 2>/dev/null'));
            }
        }

        try {
            $result = $cf->getTunnel($project->cloudflare_tunnel_id);
            $tunnel = $result['result'] ?? [];

            $remoteStatus = $tunnel['status'] ?? 'unknown';
            $status['tunnel_id'] = $project->cloudflare_tunnel_id;
            $status['status'] = $remoteStatus;
            $status['connected'] = $processRunning && $tunnel['connections'] && count($tunnel['connections']) > 0;

            if (! $processRunning) {
                $status['status_label'] = 'Stopped';
                $status['healthy'] = false;
            } else {
                switch ($remoteStatus) {
                    case 'healthy':
                        $status['healthy'] = $status['connected'];
                        $status['status_label'] = $status['connected'] ? 'Running' : 'Healthy (No conn)';
                        break;
                    case 'degraded':
                        $status['status_label'] = 'Degraded';
                        break;
                    case 'down':
                        $status['status_label'] = 'Down';
                        break;
                    case 'inactive':
                        $status['status_label'] = 'Inactive';
                        break;
                    default:
                        $status['status_label'] = ucfirst($remoteStatus);
                        break;
                }
            }
        } catch (\Throwable $e) {
            $status['tunnel_id'] = $project->cloudflare_tunnel_id;
            $status['status'] = 'error';
            $status['status_label'] = $processRunning ? 'Check Failed' : 'Stopped';
        }

        return $status;
    }

    public function teardownTunnel(Project $project, string $mode = 'all'): void
    {
        if (! $project->cloudflare_tunnel_id) {
            return;
        }

        $this->stopTunnelProcess($project);

        $cf = CloudflareService::forProject($project);
        if (! $cf) {
            return;
        }

        $routeDomain = $project->domain && $project->custom_domain
            ? "{$project->domain}.{$project->custom_domain}"
            : ($project->custom_domain ?: $project->domain);

        if ($mode === 'all' || $mode === 'dns') {
            try {
                $cf->deleteRecordByName($routeDomain, 'CNAME');
            } catch (\Throwable) {
            }
        }

        if ($mode === 'all' || $mode === 'tunnel') {
            $cf->deleteTunnel($project->cloudflare_tunnel_id);
        }

        if ($mode === 'all') {
            $project->update(['cloudflare_tunnel_id' => null]);
        }
    }
}
