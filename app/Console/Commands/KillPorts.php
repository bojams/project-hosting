<?php

namespace App\Console\Commands;

use App\Models\Project;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:kill-ports')]
#[Description('Kill all running Docker containers for projects and free ports')]
class KillPorts extends Command
{
    public function handle(): void
    {
        $projects = Project::whereNotNull('container_id')->get();

        foreach ($projects as $project) {
            $name = 'hideo-'.$project->slug;
            $this->components->task("Stopping {$name}", function () use ($name, $project) {
                exec('docker stop '.escapeshellarg($name).' 2>/dev/null');
                exec('docker rm '.escapeshellarg($name).' 2>/dev/null');

                if ($project->container_id && $project->container_id !== $name) {
                    exec('docker stop '.escapeshellarg($project->container_id).' 2>/dev/null');
                    exec('docker rm '.escapeshellarg($project->container_id).' 2>/dev/null');
                }

                $project->update([
                    'container_id' => null,
                    'container_status' => 'stopped',
                ]);
            });
        }

        $this->components->info('All containers stopped and ports freed.');
    }
}
