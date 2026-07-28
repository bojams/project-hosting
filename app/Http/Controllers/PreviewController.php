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

        if (! $project->preview_path || ! ctype_digit((string) $project->preview_path)) {
            abort(404, 'Preview not available');
        }

        $port = (int) $project->preview_path;
        $serverHost = config('app.preview_url', 'http://localhost');

        return redirect("{$serverHost}:{$port}", 302);
    }

    public function serve(string $slug, string $path)
    {
        $project = Project::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        if (! $project->preview_path || ! ctype_digit((string) $project->preview_path)) {
            abort(404);
        }

        $port = (int) $project->preview_path;
        $serverHost = config('app.preview_url', 'http://localhost');

        $path = ltrim($path, '/');
        if (str_contains($path, '..') || str_contains($path, "\0")) {
            abort(404);
        }

        $query = http_build_query(request()->query());
        $url = "{$serverHost}:{$port}/{$path}".($query ? "?{$query}" : '');

        return redirect($url, 302);
    }
}
