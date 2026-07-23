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

        $this->stopTunnelProcess($project);

        $outputFile = storage_path("logs/tunnel-{$project->id}.log");
        $pidFile = storage_path("logs/tunnel-{$project->id}.pid");
        $tokenFile = storage_path("logs/tunnel-{$project->id}.token");

        file_put_contents($tokenFile, $token);
        chmod($tokenFile, 0600);

        $wrapperScript = storage_path("logs/tunnel-{$project->id}.sh");
        $script = "#!/bin/sh\n";
        $script .= "TOKEN=\"\$(cat {$tokenFile})\"\n";
        $script .= 'while true; do'."\n";
        $script .= "  cloudflared tunnel run --token \"\${TOKEN}\" >> {$outputFile} 2>&1\n";
        $script .= "  sleep 2\n";
        $script .= "done &\n";
        $script .= 'echo $! > '."{$pidFile}\n";
        $script .= "wait\n";
        file_put_contents($wrapperScript, $script);
        chmod($wrapperScript, 0755);

        $fullCommand = "nohup {$wrapperScript} > /dev/null 2>&1 &";
        exec($fullCommand);

        usleep(500000);
        $pid = @file_get_contents($pidFile);

        return [
            'pid' => trim($pid ?: 'unknown'),
            'log_file' => "tunnel-{$project->id}.log",
        ];
    }

    private function stopTunnelProcess(Project $project): void
    {
        $pidFile = storage_path("logs/tunnel-{$project->id}.pid");
        $tokenFile = storage_path("logs/tunnel-{$project->id}.token");
        $wrapperScript = storage_path("logs/tunnel-{$project->id}.sh");

        if (file_exists($pidFile)) {
            $oldPid = trim(file_get_contents($pidFile));
            if ($oldPid) {
                exec("kill -9 {$oldPid} 2>/dev/null");
                exec("kill -9 \$(pgrep -P {$oldPid}) 2>/dev/null");
            }
            @unlink($pidFile);
        }

        exec("pkill -9 -f 'tunnel-{$project->id}\\.' 2>/dev/null");

        @unlink($wrapperScript);
        @unlink($tokenFile);
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
