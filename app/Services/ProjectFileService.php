<?php

namespace App\Services;

use App\Models\Project;

class ProjectFileService
{
    public function ensureSourceDir(Project $project): string
    {
        $dir = $project->sourcePath();
        if (! is_dir(dirname($dir))) {
            mkdir(dirname($dir), 0755, true);
        }
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir;
    }

    public function resolve(Project $project, string $relativePath): string|false
    {
        $baseDir = realpath($this->ensureSourceDir($project));
        if ($baseDir === false) {
            return false;
        }

        $relative = str_replace('\\', '/', $relativePath);
        $relative = ltrim($relative, '/');

        if ($relative === '' || str_contains($relative, "\0") || $relative === '..' || str_starts_with($relative, '../')) {
            return false;
        }

        $baseDir = rtrim($baseDir, '/');
        $dest = $baseDir.'/'.$relative;
        $destDir = realpath(dirname($dest));
        if ($destDir === false || ! str_starts_with($destDir, $baseDir)) {
            return false;
        }

        return $dest;
    }

    public function list(Project $project, ?callable $map = null): array
    {
        $baseDir = realpath($this->ensureSourceDir($project));
        if ($baseDir === false) {
            return [];
        }

        $items = [];
        $this->walk($baseDir, $baseDir, $items, $map ?? fn (array $row) => $row);

        return $items;
    }

    private function walk(string $baseDir, string $dir, array &$items, callable $map): void
    {
        foreach (scandir($dir) as $item) {
            if ($item === '.' || $item === '..' || $item === 'Dockerfile' || $item === '.dockerignore') {
                continue;
            }
            $path = $dir.'/'.$item;

            if (is_dir($path)) {
                $this->walk($baseDir, $path, $items, $map);

                continue;
            }

            $relative = substr($path, strlen($baseDir) + 1);
            $size = (int) @filesize($path);
            $mime = $this->mimeType($path);

            $row = [
                'id' => null,
                'name' => pathinfo($item, PATHINFO_FILENAME),
                'file_name' => $item,
                'path' => $relative,
                'mime_type' => $mime,
                'size' => $size,
                'human_size' => $this->humanFileSize($size),
                'url' => null,
                'created_at' => null,
                'updated_at' => null,
            ];

            $items[] = $map($row);
        }
    }

    public function delete(Project $project, string $relativePath): bool
    {
        $dest = $this->resolve($project, $relativePath);
        if ($dest === false || ! is_file($dest)) {
            return false;
        }

        return unlink($dest);
    }

    public function deleteDirectory(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }
        foreach (scandir($dir) as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir.'/'.$item;
            is_dir($path) ? $this->deleteDirectory($path) : @unlink($path);
        }
        @rmdir($dir);
    }

    public function deleteAll(Project $project): void
    {
        $dir = $project->sourcePath();
        if (is_dir($dir)) {
            $this->deleteDirectory($dir);
        }
    }

    public function rename(Project $project, string $relativePath, string $newName): bool
    {
        if ($newName === '' || str_contains($newName, '/') || str_contains($newName, '\\') || str_contains($newName, "\0") || $newName === '.' || $newName === '..') {
            return false;
        }

        $dest = $this->resolve($project, $relativePath);
        if ($dest === false || ! is_file($dest)) {
            return false;
        }

        $newDest = dirname($dest).'/'.$newName;
        if (file_exists($newDest)) {
            return false;
        }

        return rename($dest, $newDest);
    }

    public function content(Project $project, string $relativePath): ?array
    {
        $dest = $this->resolve($project, $relativePath);
        if ($dest === false || ! is_file($dest)) {
            return null;
        }

        $mime = $this->mimeType($dest);
        $textTypes = [
            'text/', 'application/json', 'application/javascript', 'application/xml',
            'application/x-httpd-php', 'application/x-sh', 'application/x-yaml',
        ];
        $isText = collect($textTypes)->contains(fn ($t) => str_starts_with($mime, $t));
        $content = null;

        if ($isText && filesize($dest) < 1024 * 1024) {
            $content = file_get_contents($dest);
        }

        return [
            'path' => $relativePath,
            'name' => basename($dest),
            'mime_type' => $mime,
            'size' => (int) filesize($dest),
            'human_size' => $this->humanFileSize((int) filesize($dest)),
            'is_text' => $isText,
            'content' => $content,
        ];
    }

    public function updateContent(Project $project, string $relativePath, string $content): bool
    {
        $dest = $this->resolve($project, $relativePath);
        if ($dest === false || ! is_file($dest)) {
            return false;
        }

        file_put_contents($dest, $content);

        return true;
    }

    public function mimeType(string $path): string
    {
        $mime = @mime_content_type($path);
        if (is_string($mime)) {
            return $mime;
        }

        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'php', 'phtml', 'phar' => 'application/x-httpd-php',
            'js' => 'text/javascript',
            'json' => 'application/json',
            'css' => 'text/css',
            'md' => 'text/markdown',
            'txt', 'env', 'gitignore', 'dockerignore' => 'text/plain',
            'zip' => 'application/zip',
            default => 'application/octet-stream',
        };
    }

    public function humanFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 2).' '.$units[$i];
    }
}
