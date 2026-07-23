<?php

namespace App\Services;

use App\Models\Project;
use RuntimeException;

class CloudflareService
{
    private ?string $apiToken;

    private ?string $zoneId;

    private ?string $accountId = null;

    public function __construct(?string $apiToken = null, ?string $zoneId = null, ?string $accountId = null)
    {
        $this->apiToken = $apiToken ?: config('services.cloudflare.api_token') ?: env('CLOUDFLARE_API_TOKEN');
        $this->zoneId = $zoneId ?: config('services.cloudflare.zone_id') ?: env('CLOUDFLARE_ZONE_ID');
        $this->accountId = $accountId;

        if (! $this->apiToken || ! $this->zoneId) {
            throw new RuntimeException('Cloudflare API token and Zone ID must be configured.');
        }
    }

    public static function forProject(Project $project): ?self
    {
        $token = $project->cloudflare_api_token;
        $zoneId = $project->cloudflare_zone_id;

        if ($token === '********' || $zoneId === '********') {
            $token = null;
            $zoneId = null;
        }

        if ($token && $zoneId) {
            return new self($token, $zoneId, $project->cloudflare_account_id);
        }
        try {
            return new self;
        } catch (RuntimeException) {
            return null;
        }
    }

    public function getAccountId(): string
    {
        if ($this->accountId) {
            return $this->accountId;
        }
        $zone = $this->request('GET', "/zones/{$this->zoneId}");
        $this->accountId = $zone['result']['account']['id'] ?? throw new RuntimeException('Could not determine Cloudflare account ID from zone.');

        return $this->accountId;
    }

    public function createCNAMERecord(string $name, string $target, bool $proxied = true): array
    {
        return $this->request('POST', "/zones/{$this->zoneId}/dns_records", [
            'type' => 'CNAME',
            'name' => $name,
            'content' => $target,
            'ttl' => 120,
            'proxied' => $proxied,
        ]);
    }

    public function createARecord(string $name, string $ip, bool $proxied = false): array
    {
        return $this->request('POST', "/zones/{$this->zoneId}/dns_records", [
            'type' => 'A',
            'name' => $name,
            'content' => $ip,
            'ttl' => 120,
            'proxied' => $proxied,
        ]);
    }

    public function deleteRecord(string $recordId): array
    {
        return $this->request('DELETE', "/zones/{$this->zoneId}/dns_records/{$recordId}");
    }

    public function findRecord(string $name, string $type = 'A'): ?array
    {
        $result = $this->request('GET', "/zones/{$this->zoneId}/dns_records", [
            'type' => $type,
            'name' => $name,
        ]);

        return $result['result'][0] ?? null;
    }

    public function ensureARecord(string $name, string $ip, bool $proxied = false): array
    {
        $existing = $this->findRecord($name);
        if ($existing) {
            if ($existing['content'] === $ip) {
                return $existing;
            }
            $this->deleteRecord($existing['id']);
        }

        return $this->createARecord($name, $ip, $proxied);
    }

    public function deleteRecordByName(string $name, string $type = 'A'): void
    {
        $existing = $this->findRecord($name, $type);
        if ($existing) {
            $this->deleteRecord($existing['id']);
        }
    }

    public function createTunnel(string $name, string $secret): array
    {
        $accountId = $this->getAccountId();

        return $this->request('POST', "/accounts/{$accountId}/cfd_tunnel", [
            'name' => $name,
            'tunnel_secret' => base64_encode($secret),
        ]);
    }

    public function listTunnels(): array
    {
        $accountId = $this->getAccountId();

        return $this->request('GET', "/accounts/{$accountId}/cfd_tunnel");
    }

    public function getTunnel(string $tunnelId): array
    {
        $accountId = $this->getAccountId();

        return $this->request('GET', "/accounts/{$accountId}/cfd_tunnel/{$tunnelId}");
    }

    public function deleteTunnel(string $tunnelId): void
    {
        $accountId = $this->getAccountId();
        $this->request('DELETE', "/accounts/{$accountId}/cfd_tunnel/{$tunnelId}");
    }

    public function getTunnelToken(string $tunnelId): string
    {
        $accountId = $this->getAccountId();
        $result = $this->request('GET', "/accounts/{$accountId}/cfd_tunnel/{$tunnelId}/token");
        $token = $result['result'];
        if (! is_string($token) || empty($token)) {
            throw new RuntimeException('Failed to get tunnel token.');
        }

        return $token;
    }

    public function configureTunnelRoute(string $tunnelId, string $domain, string $service, bool $proxied = false): array
    {
        $accountId = $this->getAccountId();

        return $this->request('PUT', "/accounts/{$accountId}/cfd_tunnel/{$tunnelId}/configurations", [
            'config' => [
                'ingress' => [
                    ['hostname' => $domain, 'service' => $service],
                    ['service' => 'http_status:404'],
                ],
            ],
        ]);
    }

    private function request(string $method, string $path, array $data = []): array
    {
        $url = "https://api.cloudflare.com/client/v4{$path}";
        if ($method === 'GET' && ! empty($data)) {
            $url .= '?'.http_build_query($data);
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$this->apiToken}",
                'Content-Type: application/json',
            ],
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        } elseif ($method === 'DELETE') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        } elseif ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (! $response) {
            throw new RuntimeException('Cloudflare API request failed: '.curl_error($ch));
        }

        $body = json_decode($response, true);
        if (! $body || ! ($body['success'] ?? false)) {
            $error = $body['errors'][0]['message'] ?? 'Unknown error';
            throw new RuntimeException("Cloudflare API error ({$httpCode}): {$error}");
        }

        return $body;
    }
}
