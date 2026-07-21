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
        $serverIp = config('app.domain_ip') ?: env('APP_DOMAIN_IP');

        if ($project->cloudflare_tunnel_id) {
            try {
                $tunnels = $cf->listTunnels();
                $exists = false;
                foreach ($tunnels['result'] ?? [] as $t) {
                    if ($t['id'] === $project->cloudflare_tunnel_id) {
                        $exists = true;
                        break;
                    }
                }
                if (! $exists) {
                    $project->update(['cloudflare_tunnel_id' => null]);
                }
            } catch (\Throwable) {
                $project->update(['cloudflare_tunnel_id' => null]);
            }
        }

        if (! $project->cloudflare_tunnel_id) {
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

        $token = $cf->getTunnelToken($project->cloudflare_tunnel_id);

        return [
            'tunnel_id' => $project->cloudflare_tunnel_id,
            'tunnel_name' => $tunnelName,
            'token' => $token,
            'route_domain' => $routeDomain,
            'service' => $service,
            'command' => "cloudflared tunnel run --token '{$token}'",
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
        $command = "cloudflared tunnel run --token '{$token}'";

        $outputFile = storage_path("logs/tunnel-{$project->id}.log");
        $pidFile = storage_path("logs/tunnel-{$project->id}.pid");

        $fullCommand = "nohup {$command} > {$outputFile} 2>&1 & echo $! > {$pidFile}";
        exec($fullCommand);

        $pid = file_get_contents($pidFile);

        return [
            'pid' => trim($pid),
            'command' => $command,
            'log_file' => "tunnel-{$project->id}.log",
        ];
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

        try {
            $result = $cf->getTunnel($project->cloudflare_tunnel_id);
            $tunnel = $result['result'] ?? [];

            $remoteStatus = $tunnel['status'] ?? 'unknown';
            $status['tunnel_id'] = $project->cloudflare_tunnel_id;
            $status['status'] = $remoteStatus;
            $status['connected'] = $tunnel['connections'] && count($tunnel['connections']) > 0;

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
        } catch (\Throwable $e) {
            $status['tunnel_id'] = $project->cloudflare_tunnel_id;
            $status['status'] = 'error';
            $status['status_label'] = 'Check Failed';
        }

        return $status;
    }

    public function teardownTunnel(Project $project, string $mode = 'all'): void
    {
        if (! $project->cloudflare_tunnel_id) {
            return;
        }

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
            try {
                $cf->deleteTunnel($project->cloudflare_tunnel_id);
            } catch (\Throwable) {
            }
        }

        if ($mode === 'all') {
            $project->update(['cloudflare_tunnel_id' => null]);
        }
    }
}
