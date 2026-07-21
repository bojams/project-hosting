<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Http\UploadedFile;
use RuntimeException;
use ZipArchive;

class SourceManager
{
    public function importFromGithub(Project $project, string $url): string
    {
        set_time_limit(300);
        $destPath = $project->sourcePath();

        if (is_dir($destPath)) {
            $this->deleteDirectory($destPath);
        }

        $repoUrl = $this->parseGithubUrl($url);

        $cmd = sprintf(
            'git clone --depth 1 %s %s 2>&1',
            escapeshellarg($repoUrl),
            escapeshellarg($destPath)
        );

        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0) {
            throw new RuntimeException('Git clone failed: '.implode("\n", array_slice($output, -5)));
        }

        $gitDir = "{$destPath}/.git";
        if (is_dir($gitDir)) {
            $this->deleteDirectory($gitDir);
        }

        $scanner = app(FrameworkScanner::class);
        $info = $scanner->scan($destPath);

        $project->update([
            'source_type' => 'github',
            'github_url' => $url,
            'framework' => $info['framework'],
            'framework_version' => $info['framework_version'],
            'build_command' => $info['build_command'],
            'output_dir' => $info['output_dir'],
            'internal_port' => $info['internal_port'],
        ]);

        return $destPath;
    }

    public function importFromZip(Project $project, UploadedFile $file): string
    {
        set_time_limit(300);
        $destPath = $project->sourcePath();

        if (is_dir($destPath)) {
            $this->deleteDirectory($destPath);
        }

        $zip = new ZipArchive;
        $res = $zip->open($file->getRealPath());

        if ($res !== true) {
            throw new RuntimeException('Failed to open ZIP file');
        }

        $rootEntries = [];
        for ($i = 0; $i < $zip->count(); $i++) {
            $name = $zip->getNameIndex($i);
            $firstDir = explode('/', $name)[0];
            $rootEntries[$firstDir] = true;
        }

        $singleRoot = count($rootEntries) === 1;
        $rootName = array_key_first($rootEntries);
        $hasRootFolder = $singleRoot && is_dir("zip://{$file->getRealPath()}#{$rootName}");

        $extractTo = $destPath;
        if (! is_dir(dirname($extractTo))) {
            mkdir(dirname($extractTo), 0755, true);
        }

        $zip->extractTo(dirname($extractTo));
        $zip->close();

        if ($hasRootFolder) {
            $nested = dirname($extractTo).'/'.$rootName;
            if (is_dir($nested)) {
                rename($nested, $extractTo);
            }
        }

        if (! is_dir($destPath)) {
            if (is_dir(dirname($destPath).'/'.$rootName)) {
                rename(dirname($destPath).'/'.$rootName, $destPath);
            } else {
                mkdir($destPath, 0755, true);
            }
        }

        $scanner = app(FrameworkScanner::class);
        $info = $scanner->scan($destPath);

        $project->update([
            'source_type' => 'zip',
            'framework' => $info['framework'],
            'framework_version' => $info['framework_version'],
            'build_command' => $info['build_command'],
            'output_dir' => $info['output_dir'],
            'internal_port' => $info['internal_port'],
        ]);

        return $destPath;
    }

    private function parseGithubUrl(string $url): string
    {
        $url = trim($url);

        if (str_ends_with($url, '.git')) {
            return $url;
        }

        if (preg_match('#^https?://github\.com/([^/]+)/([^/]+)#', $url, $m)) {
            return "https://github.com/{$m[1]}/{$m[2]}.git";
        }

        if (preg_match('#^git@github\.com:([^/]+)/([^/]+)#', $url, $m)) {
            $repo = str_replace('.git', '', $m[2]);

            return "https://github.com/{$m[1]}/{$repo}.git";
        }

        if (preg_match('#^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$#', $url)) {
            return "https://github.com/{$url}.git";
        }

        throw new RuntimeException('Invalid GitHub URL format');
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
            $path = "{$dir}/{$item}";
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
