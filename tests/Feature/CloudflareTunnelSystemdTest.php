<?php

use App\Models\Project;
use App\Models\User;
use App\Services\CloudflareTunnelService;

class CloudflareTunnelSystemdSpy extends CloudflareTunnelService
{
    public array $commands = [];

    private string $dir;

    public function setSystemdDir(string $dir): void
    {
        $this->dir = $dir;
    }

    protected function systemdDir(): string
    {
        return $this->dir;
    }

    protected function runCommand(string $command): array
    {
        $this->commands[] = $command;

        return str_contains($command, 'systemctl show')
            ? [0, ['4242']]
            : [0, []];
    }
}

function makeSystemdTestProject(): Project
{
    $user = User::factory()->create();
    $project = Project::create([
        'user_id' => $user->id,
        'name' => 'Demo Store',
        'slug' => 'demo',
    ]);
    $project->cloudflare_tunnel_id = '657ea26e-fa5f-483a-92aa-f057924ba5a1';
    $project->save();

    return $project;
}

function makeSystemdDir(Project $project, string $name): string
{
    $dir = sys_get_temp_dir().'/cloudflared-systemd-'.uniqid();
    mkdir($dir, 0777, true);
    file_put_contents("{$dir}/{$name}.service", '');

    return $dir;
}

test('runTunnel restarts the systemd service when a service file exists', function () {
    $project = makeSystemdTestProject();
    $serviceName = "cloudflared-demo-{$project->id}";
    $dir = makeSystemdDir($project, $serviceName);

    $spy = new CloudflareTunnelSystemdSpy;
    $spy->setSystemdDir($dir);

    $result = $spy->runTunnel($project);

    expect($result['manager'])->toBe('systemd');
    expect($result['pid'])->toBe('4242');
    expect($spy->commands[0])->toContain("systemctl restart {$serviceName}");
    expect(file_get_contents(storage_path("logs/tunnel-{$project->id}.pid")))->toBe('4242');

    @unlink("{$dir}/{$serviceName}.service");
    @rmdir($dir);
});

test('runTunnel falls back to the slug-based service name', function () {
    $project = makeSystemdTestProject();
    $dir = makeSystemdDir($project, 'cloudflared-demo');

    $spy = new CloudflareTunnelSystemdSpy;
    $spy->setSystemdDir($dir);

    $result = $spy->runTunnel($project);

    expect($result['manager'])->toBe('systemd');
    expect($spy->commands[0])->toContain('systemctl restart cloudflared-demo');

    @unlink("{$dir}/cloudflared-demo.service");
    @rmdir($dir);
});

test('stopTunnelProcess stops the systemd service when a service file exists', function () {
    $project = makeSystemdTestProject();
    $serviceName = "cloudflared-demo-{$project->id}";
    $dir = makeSystemdDir($project, $serviceName);
    file_put_contents(storage_path("logs/tunnel-{$project->id}.pid"), '4242');

    $spy = new CloudflareTunnelSystemdSpy;
    $spy->setSystemdDir($dir);

    $spy->stopTunnelProcess($project);

    expect($spy->commands[0])->toContain("systemctl stop {$serviceName}");
    expect(file_exists(storage_path("logs/tunnel-{$project->id}.pid")))->toBeFalse();

    @unlink("{$dir}/{$serviceName}.service");
    @rmdir($dir);
});
