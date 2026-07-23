<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Http\UploadedFile;
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

        $tempDir = storage_path('app/extract_'.uniqid());
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $zip->extractTo($tempDir);
        $zip->close();

        return $this->uploadExtracted($project, $tempDir);
    }

    private function extractRar(Project $project, string $path): array
    {
        $tempDir = storage_path('app/extract_'.uniqid());
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $escaped = escapeshellarg($path);
        $outDir = escapeshellarg($tempDir);
        exec("7z x {$escaped} -o{$outDir} -y 2>/dev/null", $output, $exitCode);

        if ($exitCode !== 0) {
            $this->deleteDirectory($tempDir);

            return [];
        }

        return $this->uploadExtracted($project, $tempDir);
    }

    private function uploadExtracted(Project $project, string $dir): array
    {
        $uploaded = [];

        $entries = array_diff(scandir($dir), ['.', '..']);
        $singleRoot = count($entries) === 1 && is_dir($dir.'/'.reset($entries));
        $baseDir = $singleRoot ? $dir.'/'.reset($entries) : $dir;

        $files = $this->getAllFiles($baseDir);

        foreach ($files as $filePath) {
            $relativePath = substr($filePath, strlen($baseDir) + 1);

            try {
                $media = $project->addMedia($filePath)
                    ->withCustomProperties(['path' => $relativePath])
                    ->toMediaCollection('project_files');

                $uploaded[] = [
                    'id' => $media->id,
                    'name' => $media->name,
                    'file_name' => $media->file_name,
                    'path' => $relativePath,
                    'mime_type' => $media->mime_type,
                    'size' => $media->size,
                    'human_size' => $this->humanFileSize($media->size),
                    'url' => $media->getUrl(),
                    'created_at' => $media->created_at,
                ];
            } catch (\Throwable) {
            }
        }

        $this->deleteDirectory($dir);

        return $uploaded;
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
