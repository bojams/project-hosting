<?php

use App\Http\Controllers\ChunkedUploadController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\PreviewController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\UsersController;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->middleware(['auth', 'throttle:60,1'])->group(function () {
    Route::apiResource('projects', ProjectController::class);

    Route::get('/projects/{project}/media', [MediaController::class, 'index']);
    Route::post('/projects/{project}/media', [MediaController::class, 'upload']);
    Route::post('/projects/{project}/media/bulk', [MediaController::class, 'uploadBulk']);
    Route::delete('/projects/{project}/media/all', [MediaController::class, 'destroyAll']);
    Route::post('/projects/{project}/media/batch-delete', [MediaController::class, 'destroyBatch']);
    Route::delete('/projects/{project}/media', [MediaController::class, 'destroy']);
    Route::patch('/projects/{project}/media', [MediaController::class, 'rename']);
    Route::get('/projects/{project}/media/content', [MediaController::class, 'content']);
    Route::put('/projects/{project}/media/content', [MediaController::class, 'updateContent']);
    Route::get('/projects/{project}/media/raw', [MediaController::class, 'serve']);

    Route::post('/projects/{project}/media/chunk', [ChunkedUploadController::class, 'uploadChunk']);
    Route::post('/projects/{project}/media/chunk/complete', [ChunkedUploadController::class, 'complete']);
    Route::post('/projects/{project}/media/chunk/cancel', [ChunkedUploadController::class, 'cancel']);

    Route::post('/projects/{project}/source/zip', [ProjectController::class, 'importZip']);
    Route::post('/projects/{project}/scan', [ProjectController::class, 'scan']);

    Route::patch('/projects/{project}/config', [ProjectController::class, 'updateConfig']);
    Route::post('/projects/{project}/verify-domain', [ProjectController::class, 'verifyDomain']);

    Route::post('/projects/{project}/deploy', [ProjectController::class, 'deploy']);
    Route::post('/projects/{project}/stop', [ProjectController::class, 'stop']);
    Route::get('/projects/{project}/logs', [ProjectController::class, 'logs']);

    Route::post('/projects/{project}/tunnel', [ProjectController::class, 'setupTunnel']);
    Route::post('/projects/{project}/tunnel/remove', [ProjectController::class, 'teardownTunnel']);
    Route::get('/projects/{project}/tunnel/token', [ProjectController::class, 'getTunnelToken']);
    Route::get('/projects/{project}/tunnel/status', [ProjectController::class, 'tunnelStatus']);
    Route::post('/projects/{project}/tunnel/run', [ProjectController::class, 'runTunnel']);
    Route::post('/projects/{project}/tunnel/stop', [ProjectController::class, 'stopTunnel']);

    Route::get('/users', [UsersController::class, 'index']);
    Route::post('/users', [UsersController::class, 'store']);
    Route::patch('/users/{user}/role', [UsersController::class, 'updateRole']);
    Route::patch('/users/{user}', [UsersController::class, 'update']);
    Route::post('/users/{user}/approve', [UsersController::class, 'approve']);
    Route::post('/users/{user}/reject', [UsersController::class, 'reject']);
    Route::delete('/users/{user}', [UsersController::class, 'destroy']);
});

Route::get('/api/preview/{slug}', [PreviewController::class, 'index'])->middleware('throttle:30,1');
Route::get('/api/preview/{slug}/{path}', [PreviewController::class, 'serve'])->where('path', '.*')->middleware('throttle:30,1');

Route::get('/api/by-domain', function (Request $request) {
    $host = $request->query('host');
    if (! $host) {
        return response()->json(['success' => false, 'message' => 'host required'], 400);
    }

    if (! preg_match('/^[a-zA-Z0-9._-]+$/', $host)) {
        return response()->json(['success' => false, 'message' => 'invalid host'], 400);
    }

    $parts = explode('.', $host);
    $subdomain = $parts[0] ?? null;

    $project = null;
    if (count($parts) >= 2) {
        $rootDomain = implode('.', array_slice($parts, 1));

        $project = Project::where('custom_domain', $rootDomain)
            ->where('domain', $subdomain)
            ->whereNotNull('container_status')
            ->first();
    }

    if (! $project) {
        $project = Project::where('slug', $subdomain)->whereNotNull('container_status')->first();
    }

    if (! $project || ! $project->port) {
        return response()->json(['success' => false, 'message' => 'No project found for this domain'], 404);
    }

    return response()->json([
        'success' => true,
        'data' => [
            'id' => $project->id,
            'slug' => $project->slug,
            'name' => $project->name,
            'port' => $project->port,
            'container_status' => $project->container_status,
        ],
    ]);
})->middleware('throttle:60,1');

Route::get('/api/slug/{slug}/port', function (string $slug) {
    if (! preg_match('/^[a-zA-Z0-9_-]+$/', $slug)) {
        return response()->json(['success' => false, 'message' => 'invalid slug'], 400);
    }

    $project = Project::where('slug', $slug)->first();
    if (! $project) {
        return response()->json(['success' => false, 'message' => 'Project not found'], 404);
    }

    return response()->json([
        'success' => true,
        'data' => [
            'slug' => $project->slug,
            'port' => $project->port,
            'container_status' => $project->container_status,
            'name' => $project->name,
        ],
    ]);
})->middleware('throttle:60,1');
