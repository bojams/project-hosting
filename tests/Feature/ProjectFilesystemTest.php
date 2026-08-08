<?php

use App\Models\Project;
use App\Models\User;
use App\Services\ArchiveService;
use App\Services\ProjectFileService;
use Illuminate\Http\UploadedFile;

function makeTestZip(): string
{
    $zipPath = tempnam(sys_get_temp_dir(), 'hideo_test_').'.zip';
    $zip = new ZipArchive;
    $zip->open($zipPath, ZipArchive::CREATE);
    $zip->addFromString('public/index.php', '<?php echo "hello";');
    $zip->addFromString('composer.json', '{}');
    $zip->addFromString('src/App/Controller.php', '<?php class C {}');
    $zip->addFromString('folder/readme.md', '# test');
    $zip->close();

    return $zipPath;
}

beforeEach(function () {
    $dir = storage_path(config('app.source_path', 'app/sources'));
    if (is_dir($dir)) {
        app(ProjectFileService::class)->deleteDirectory($dir);
    }
});

test('zip extraction writes to project source path and includes php files', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $zipPath = makeTestZip();

    $rows = app(ArchiveService::class)->extractAndUpload($project, $zipPath, 'src.zip');
    @unlink($zipPath);

    expect($rows)->toHaveCount(4)
        ->and(collect($rows)->pluck('path')->all())
        ->toContain('public/index.php', 'composer.json');

    expect(file_exists($project->sourcePath().'/public/index.php'))->toBeTrue()
        ->and($project->fresh()->source_type)->toBe('zip');
});

test('extractAndUpload returns empty on zip slip entries', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $zipPath = tempnam(sys_get_temp_dir(), 'zip_slip_').'.zip';
    $zip = new ZipArchive;
    $zip->open($zipPath, ZipArchive::CREATE);
    $zip->addFromString('../evil.php', '<?php echo 1;');
    $zip->close();

    $rows = app(ArchiveService::class)->extractAndUpload($project, $zipPath, 'evil.zip');
    @unlink($zipPath);

    expect($rows)->toBe([]);
});

test('authenticated user can list, delete and rename filesystem files', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->postJson("/api/projects/{$project->id}/media/bulk", [
            'files' => [
                'index.php' => UploadedFile::fake()->createWithContent('index.php', '<?php echo 1;'),
                'readme.md' => UploadedFile::fake()->createWithContent('readme.md', '# test'),
            ],
        ])->assertStatus(201);

    expect(file_exists($project->sourcePath().'/index.php'))->toBeTrue();

    $index = $this->actingAs($user)->getJson("/api/projects/{$project->id}/media")->assertOk()->json('data');
    expect(count($index))->toBeGreaterThanOrEqual(1);

    $this->actingAs($user)->deleteJson("/api/projects/{$project->id}/media?path=index.php")->assertOk();
    expect(file_exists($project->sourcePath().'/index.php'))->toBeFalse();

    $this->actingAs($user)->patchJson("/api/projects/{$project->id}/media", [
        'path' => 'readme.md',
        'name' => 'README.md',
    ])->assertOk();
    expect(file_exists($project->sourcePath().'/README.md'))->toBeTrue();
});
