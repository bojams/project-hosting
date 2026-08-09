<?php

use App\Models\Project;
use App\Models\User;
use App\Services\DockerDeployer;

function generateDockerfileFor(Project $project): string
{
    $deployer = app(DockerDeployer::class);
    $ref = new ReflectionMethod($deployer, 'generateDockerfile');
    $ref->setAccessible(true);

    return $ref->invoke($deployer, $project);
}

function withSource(string $sourcePath, array $files): void
{
    if (! is_dir($sourcePath)) {
        mkdir($sourcePath, 0755, true);
    }
    foreach ($files as $path => $content) {
        $dir = dirname($sourcePath.'/'.$path);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($sourcePath.'/'.$path, $content);
    }
}

test('plain php project without start command gets a built-in server cmd', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    withSource($project->sourcePath(), [
        'composer.json' => '{}',
        'public/index.php' => '<?php echo "hello";',
    ]);

    $df = generateDockerfileFor($project);

    expect($df)->toContain('EXPOSE 8000')
        ->and($df)->toContain('php -S 0.0.0.0:8000 -t public')
        ->and($df)->toContain('CMD');
});

test('plain php project with no public dir uses serve root', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    withSource($project->sourcePath(), [
        'composer.json' => '{}',
        'index.php' => '<?php echo "hi";',
    ]);

    $df = generateDockerfileFor($project);

    expect($df)->toContain('php -S 0.0.0.0:8000');
});

test('laravel project keeps artisan serve start command', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    withSource($project->sourcePath(), [
        'composer.json' => json_encode(['require' => ['laravel/framework' => '^12.0']]),
        'public/index.php' => '<?php // laravel',
        'artisan' => '',
    ]);

    $df = generateDockerfileFor($project);

    expect($df)->toContain('php artisan serve --host=0.0.0.0 --port=8000');
});
