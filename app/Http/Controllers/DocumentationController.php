<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DocumentationController extends Controller
{
    public function index(): Response
    {
        $docsPath = storage_path('app/docs');
        $files = glob("{$docsPath}/*.md");
        $guides = [];

        foreach ($files as $file) {
            $slug = pathinfo($file, PATHINFO_FILENAME);
            if ($slug === 'index') {
                continue;
            }
            $content = file_get_contents($file);
            $title = str($content)->match('/^#\s+(.+)/m')->toString() ?: $slug;
            $excerpt = str($content)->match('/##\s+(.+)/m')->toString() ?: '';
            $body = str($content)->after('---')->before('---')->trim()->toString() ?: '';
            $guides[] = compact('slug', 'title', 'excerpt', 'body');
        }

        $order = array_flip(['cloudflare', 'domain']);
        usort($guides, fn (array $a, array $b) => ($order[$a['slug']] ?? 99) <=> ($order[$b['slug']] ?? 99));

        return Inertia::render('dashboard/docs/index', [
            'guides' => $guides,
        ]);
    }

    public function show(string $slug): Response
    {
        $path = storage_path("app/docs/{$slug}.md");

        if (! file_exists($path)) {
            abort(404);
        }

        $content = file_get_contents($path);

        return Inertia::render('dashboard/docs/show', [
            'slug' => $slug,
            'content' => $content,
        ]);
    }
}
