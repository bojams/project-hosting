<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\ArchiveService;
use App\Services\DockerDeployer;
use App\Services\ProjectFileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaController extends Controller
{
    private const ALLOWED_MIMES = 'mimes:jpg,jpeg,png,gif,webp,svg,pdf,zip,tar,gz,mp4,webm,txt,md,php,phtml,json,css,js';

    private const BLOCKED_EXTENSIONS = ['exe', 'dll', 'sh', 'bat', 'ps1', 'jar'];

    private const SAFE_PATH_REGEX = '/^(?!.*\.\.)[a-zA-Z0-9_\/\-\.\(\) ]+$/';

    public function index(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        app(DockerDeployer::class)->syncMediaToSource($project, $project->sourcePath());

        $service = app(ProjectFileService::class);
        $mediaByPath = $project->getMedia('project_files')
            ->mapWithKeys(fn ($m) => [$m->getCustomProperty('path', $m->file_name) => $m]);

        $files = $service->list($project, function (array $row) use ($mediaByPath) {
            $media = $mediaByPath->get($row['path']);
            if ($media) {
                $row['id'] = $media->id;
                $row['url'] = $media->getUrl();
                $row['created_at'] = $media->created_at;
                $row['updated_at'] = $media->updated_at;
            }

            return $row;
        });

        usort($files, fn ($a, $b) => strcmp($a['path'], $b['path']));

        return response()->json([
            'success' => true,
            'data' => array_values($files),
        ]);
    }

    public function upload(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $request->validate([
            'file' => ['required', 'file', 'max:'.config('app.max_upload_size', 102400), self::ALLOWED_MIMES],
            'path' => ['nullable', 'string', 'max:500', 'regex:'.self::SAFE_PATH_REGEX],
        ]);

        $file = $request->file('file');
        $relativePath = $request->input('path', $file->getClientOriginalName());
        $ext = strtolower($file->getClientOriginalExtension());

        if (in_array($ext, self::BLOCKED_EXTENSIONS)) {
            return response()->json(['success' => false, 'message' => 'File type not allowed'], 422);
        }

        if (in_array($ext, ['zip', 'rar', 'cbr'])) {
            $extracted = app(ArchiveService::class)->extractAndUpload($project, $file, $file->getClientOriginalName());

            if (count($extracted) > 0) {
                return response()->json([
                    'success' => true,
                    'message' => count($extracted).' files extracted from archive',
                    'data' => $extracted,
                ], 201);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to extract archive',
            ], 422);
        }

        $service = app(ProjectFileService::class);
        $dest = $service->resolve($project, $relativePath);
        if ($dest === false) {
            return response()->json(['success' => false, 'message' => 'Invalid path'], 422);
        }

        if (! is_dir(dirname($dest))) {
            mkdir(dirname($dest), 0755, true);
        }

        $file->move(dirname($dest), basename($dest));

        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => [
                'id' => null,
                'name' => pathinfo($dest, PATHINFO_FILENAME),
                'file_name' => basename($dest),
                'path' => $relativePath,
                'mime_type' => $service->mimeType($dest),
                'size' => (int) filesize($dest),
                'human_size' => $service->humanFileSize((int) filesize($dest)),
                'url' => null,
                'created_at' => null,
            ],
        ], 201);
    }

    public function uploadBulk(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $request->validate([
            'files' => 'required|array',
            'files.*' => ['required', 'file', 'max:'.config('app.max_upload_size', 102400), self::ALLOWED_MIMES],
            'paths' => 'nullable|array',
            'paths.*' => ['nullable', 'string', 'max:500', 'regex:'.self::SAFE_PATH_REGEX],
        ]);

        $uploaded = [];
        $service = app(ProjectFileService::class);

        foreach ($request->file('files') as $i => $file) {
            $relativePath = $request->input('paths')[$i] ?? $file->getClientOriginalName();
            $ext = strtolower($file->getClientOriginalExtension());

            if (in_array($ext, self::BLOCKED_EXTENSIONS)) {
                continue;
            }

            if (in_array($ext, ['zip', 'rar', 'cbr'])) {
                $extracted = app(ArchiveService::class)->extractAndUpload($project, $file, $file->getClientOriginalName());
                foreach ($extracted as $item) {
                    $uploaded[] = $item;
                }

                continue;
            }

            $dest = $service->resolve($project, $relativePath);
            if ($dest === false) {
                continue;
            }

            if (! is_dir(dirname($dest))) {
                mkdir(dirname($dest), 0755, true);
            }

            $file->move(dirname($dest), basename($dest));

            $uploaded[] = [
                'id' => null,
                'name' => pathinfo($dest, PATHINFO_FILENAME),
                'file_name' => basename($dest),
                'path' => $relativePath,
                'mime_type' => $service->mimeType($dest),
                'size' => (int) filesize($dest),
                'human_size' => $service->humanFileSize((int) filesize($dest)),
                'url' => null,
                'created_at' => null,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => count($uploaded).' files uploaded successfully',
            'data' => $uploaded,
        ], 201);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'path' => 'required|string|max:500',
        ]);

        $service = app(ProjectFileService::class);
        if (! $service->delete($project, $validated['path'])) {
            return response()->json(['success' => false, 'message' => 'File not found'], 404);
        }

        $this->deleteMatchingMedia($project, $validated['path']);

        return response()->json(['success' => true, 'message' => 'File deleted successfully']);
    }

    public function destroyBatch(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'paths' => 'required|array',
            'paths.*' => 'required|string|max:500',
        ]);

        $service = app(ProjectFileService::class);
        $count = 0;

        foreach ($validated['paths'] as $path) {
            if ($service->delete($project, $path)) {
                $count++;
            }
            $this->deleteMatchingMedia($project, $path);
        }

        return response()->json([
            'success' => true,
            'message' => "{$count} files deleted",
        ]);
    }

    public function destroyAll(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        app(ProjectFileService::class)->deleteAll($project);

        $count = $project->getMedia('project_files')->count();
        foreach ($project->getMedia('project_files') as $media) {
            $media->delete();
        }

        return response()->json([
            'success' => true,
            'message' => "All {$count} files deleted",
        ]);
    }

    public function rename(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'path' => 'required|string|max:500',
            'name' => 'required|string|max:255',
        ]);

        $service = app(ProjectFileService::class);
        if (! $service->rename($project, $validated['path'], $validated['name'])) {
            return response()->json(['success' => false, 'message' => 'Rename failed'], 422);
        }

        $newPath = dirname($validated['path']).'/'.$validated['name'];
        if (str_starts_with($newPath, './')) {
            $newPath = ltrim($newPath, './');
        }

        $this->deleteMatchingMedia($project, $validated['path']);
        $this->deleteMatchingMedia($project, $newPath);

        return response()->json([
            'success' => true,
            'message' => 'File renamed successfully',
        ]);
    }

    public function content(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'path' => 'required|string|max:500',
        ]);

        $data = app(ProjectFileService::class)->content($project, $validated['path']);
        if ($data === null) {
            return response()->json(['success' => false, 'message' => 'File not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function updateContent(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'path' => 'required|string|max:500',
            'content' => 'required|string',
        ]);

        if (! app(ProjectFileService::class)->updateContent($project, $validated['path'], $validated['content'])) {
            return response()->json(['success' => false, 'message' => 'File not found'], 404);
        }

        return response()->json(['success' => true, 'message' => 'File updated']);
    }

    public function serve(Request $request, Project $project): StreamedResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'path' => 'required|string|max:500',
        ]);

        $dest = app(ProjectFileService::class)->resolve($project, $validated['path']);
        if ($dest === false || ! is_file($dest)) {
            abort(404);
        }

        $mime = app(ProjectFileService::class)->mimeType($dest);

        return response()->streamDownload(function () use ($dest) {
            readfile($dest);
        }, basename($dest), ['Content-Type' => $mime]);
    }

    private function deleteMatchingMedia(Project $project, string $path): void
    {
        foreach ($project->getMedia('project_files') as $media) {
            if ($media->getCustomProperty('path', $media->file_name) === $path) {
                $media->delete();
            }
        }
    }

    private function humanFileSize(int $bytes): string
    {
        return app(ProjectFileService::class)->humanFileSize($bytes);
    }
}
