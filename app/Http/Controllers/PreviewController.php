<?php

namespace App\Http\Controllers;

use App\Models\Project;

class PreviewController extends Controller
{
    public function index(string $slug)
    {
        $project = Project::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        if (! $project->preview_path) {
            abort(404, 'Preview not available');
        }

        $path = storage_path("app/public/{$project->preview_path}/index.html");

        if (! file_exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }

    public function serve(string $slug, string $path)
    {
        $project = Project::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        if (! $project->preview_path) {
            abort(404);
        }

        $fullPath = storage_path("app/public/{$project->preview_path}/{$path}");
        $fullPath = realpath($fullPath);
        $basePath = realpath(storage_path("app/public/{$project->preview_path}"));

        if (! $fullPath || ! $basePath || ! str_starts_with($fullPath, $basePath)) {
            abort(403);
        }

        if (! file_exists($fullPath)) {
            abort(404);
        }

        return response()->file($fullPath);
    }
}
