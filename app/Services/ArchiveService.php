<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class ArchiveService
{
    public function extractAndUpload(Project $project, UploadedFile|string $file, string $originalName): array
    {
        $path = $file instanceof UploadedFile ? $file->getRealPath() : $file;

        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        if ($ext === 'zip') {
            return $this->extractZip($project, $path);
        }

        if (in_array($ext, ['rar', 'cbr'])) {
            return $this->extractRar($project, $path);
        }

        return [];
    }

    private function extractZip(Project $project, string $path): array
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            return [];
        }

        $destPath = $project->sourcePath();
        if (! is_dir(dirname($destPath))) {
            mkdir(dirname($destPath), 0755, true);
        }
        if (! is_dir($destPath)) {
            mkdir($destPath, 0755, true);
        }

        $baseDir = realpath($destPath);
        if ($baseDir === false) {
            $zip->close();

            return [];
        }

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entryName = $zip->getNameIndex($i);
            if ($entryName === false) {
                continue;
            }

            $normalized = str_replace('\\', '/', $entryName);

            if (str_contains($normalized, '..') || str_starts_with($normalized, '/')) {
                $zip->close();
                Log::warning('Zip slip detected', ['entry' => $normalized, 'project' => $project->id]);

                return [];
            }

            $destEntry = $baseDir.'/'.$normalized;
            $destDir = dirname($destEntry);
            if (! is_dir($destDir)) {
                mkdir($destDir, 0755, true);
            }

            $destReal = realpath($destDir);
            if ($destReal === false || ! str_starts_with($destReal, $baseDir)) {
                $zip->close();
                Log::warning('Zip slip detected (resolved path)', ['entry' => $normalized, 'project' => $project->id]);

                return [];
            }

            if (substr($entryName, -1) === '/') {
                if (! is_dir($destEntry)) {
                    mkdir($destEntry, 0755, true);
                }
            } else {
                copy("zip://{$path}#{$entryName}", $destEntry);
            }
        }

        $zip->close();
        $project->update(['source_type' => 'zip']);
        $this->ungroupSingleRoot($baseDir);

        return $this->indexDirectory($baseDir);
    }

    private function extractRar(Project $project, string $path): array
    {
        $destPath = $project->sourcePath();
        if (! is_dir(dirname($destPath))) {
            mkdir(dirname($destPath), 0755, true);
        }
        if (! is_dir($destPath)) {
            mkdir($destPath, 0755, true);
        }

        $escaped = escapeshellarg($path);
        $outDir = escapeshellarg($destPath);
        exec("7z x {$escaped} -o{$outDir} -y 2>/dev/null", $output, $exitCode);

        if ($exitCode !== 0) {
            return [];
        }

        $baseDir = realpath($destPath);
        if ($baseDir === false) {
            return [];
        }

        $violations = $this->checkDirectoryTraversal($baseDir, $baseDir);
        if (! empty($violations)) {
            Log::warning('Zip slip detected in RAR extraction', ['entries' => $violations, 'project' => $project->id]);

            return [];
        }

        $project->update(['source_type' => 'rar']);
        $this->ungroupSingleRoot($baseDir);

        return $this->indexDirectory($baseDir);
    }

    private function checkDirectoryTraversal(string $baseDir, string $dir): array
    {
        $violations = [];
        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir.'/'.$item;
            $real = realpath($path);
            if ($real === false || ! str_starts_with($real, $baseDir)) {
                $violations[] = substr($path, strlen($baseDir) + 1);
            }
            if (is_dir($path)) {
                $violations = array_merge($violations, $this->checkDirectoryTraversal($baseDir, $path));
            }
        }

        return $violations;
    }

    private function ungroupSingleRoot(string $dir): void
    {
        $entries = array_values(array_diff(scandir($dir), ['.', '..']));
        if (count($entries) !== 1 || ! is_dir($dir.'/'.$entries[0])) {
            return;
        }

        $nested = $dir.'/'.$entries[0];
        $tmp = dirname($dir).'/'.basename($dir).'_move';
        if (is_dir($tmp)) {
            $this->deleteDirectory($tmp);
        }
        rename($dir, $tmp);
        rename($tmp.'/'.$entries[0], $dir);
        $this->deleteDirectory($tmp);
    }

    private function indexDirectory(string $dir): array
    {
        $uploaded = [];

        $files = $this->getAllFiles($dir);

        foreach ($files as $filePath) {
            $relativePath = substr($filePath, strlen(rtrim($dir, '/')) + 1);
            $size = (int) @filesize($filePath);
            $mime = $this->mimeType($filePath);

            $uploaded[] = [
                'id' => null,
                'name' => pathinfo($filePath, PATHINFO_FILENAME),
                'file_name' => basename($filePath),
                'path' => $relativePath,
                'mime_type' => $mime,
                'size' => $size,
                'human_size' => $this->humanFileSize($size),
                'url' => null,
                'created_at' => null,
            ];
        }

        return $uploaded;
    }

    private function mimeType(string $path): string
    {
        $mime = @mime_content_type($path);
        if (is_string($mime)) {
            return $mime;
        }

        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($ext) {
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

    private function getAllFiles(string $dir): array
    {
        $files = [];
        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir.'/'.$item;
            if (is_dir($path)) {
                $files = array_merge($files, $this->getAllFiles($path));
            } else {
                $files[] = $path;
            }
        }

        return $files;
    }

    private function deleteDirectory(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }
        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir.'/'.$item;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }

    private function humanFileSize(int $bytes): string
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
