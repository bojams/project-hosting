<?php

namespace App\Http\Controllers;

use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DocumentationController extends Controller
{
    private const ALLOWED_SLUG_REGEX = '/^[a-zA-Z0-9_-]+$/';

    private const DOCS_DIR = 'app/docs';

    public function index(): Response
    {
        $docsPath = storage_path(self::DOCS_DIR);
        $files = glob("{$docsPath}/*.md");
        $guides = [];

        foreach ($files as $file) {
            $slug = pathinfo($file, PATHINFO_FILENAME);
            if ($slug === 'index') {
                continue;
            }
            $content = file_get_contents($file);
            $title = Str::of($content)->match('/^#\s+(.+)/m')->toString() ?: $slug;
            $excerpt = Str::of($content)->match('/##\s+(.+)/m')->toString() ?: '';
            $body = Str::of($content)->after('---')->before('---')->trim()->toString() ?: '';
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
        $slug = $this->sanitizeSlug($slug);

        if ($slug === null) {
            abort(404);
        }

        $docsPath = storage_path(self::DOCS_DIR);
        $realDocsPath = realpath($docsPath);

        if ($realDocsPath === false) {
            abort(404);
        }

        $path = realpath("{$realDocsPath}/{$slug}.md");

        if ($path === false || ! str_starts_with($path, $realDocsPath)) {
            abort(404);
        }

        if (! file_exists($path) || ! is_file($path)) {
            abort(404);
        }

        $content = file_get_contents($path);

        return Inertia::render('dashboard/docs/show', [
            'slug' => $slug,
            'content' => $content,
        ]);
    }

    private function sanitizeSlug(string $slug): ?string
    {
        if (str_contains($slug, "\0")) {
            return null;
        }

        $slug = urldecode($slug);

        if (str_contains($slug, '/') || str_contains($slug, '\\') || str_contains($slug, '..')) {
            return null;
        }

        if (! preg_match(self::ALLOWED_SLUG_REGEX, $slug)) {
            return null;
        }

        return $slug;
    }
}
