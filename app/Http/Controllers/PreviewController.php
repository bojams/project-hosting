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

        return redirect("http://localhost:{$project->preview_path}", 302);
    }

    public function serve(string $slug, string $path)
    {
        $project = Project::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        if (! $project->preview_path) {
            abort(404);
        }

        $target = "/{$path}";
        $query = http_build_query(request()->query());
        $url = "http://localhost:{$project->preview_path}".($query ? "?{$query}" : '');

        return redirect($url, 302);
    }
}
