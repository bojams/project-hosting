<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\ArchiveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaController extends Controller
{
    public function index(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $media = $project->getMedia('project_files');

        return response()->json([
            'success' => true,
            'data' => $media->map(fn (Media $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'file_name' => $m->file_name,
                'path' => $m->getCustomProperty('path', $m->file_name),
                'mime_type' => $m->mime_type,
                'size' => $m->size,
                'human_size' => $this->humanFileSize($m->size),
                'url' => $m->getUrl(),
                'thumbnail' => $m->mime_type === 'image' ? $m->getUrl('thumb') : null,
                'created_at' => $m->created_at,
                'updated_at' => $m->updated_at,
            ]),
        ]);
    }

    public function upload(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $request->validate([
            'file' => 'required|file|max:'.config('app.max_upload_size', 102400),
            'path' => 'nullable|string|max:500',
        ]);

        $file = $request->file('file');
        $relativePath = $request->input('path', $file->getClientOriginalName());
        $ext = strtolower($file->getClientOriginalExtension());

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

        try {
            $media = $project->addMedia($file)
                ->withCustomProperties(['path' => $relativePath])
                ->toMediaCollection('project_files');
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => [
                'id' => $media->id,
                'name' => $media->name,
                'file_name' => $media->file_name,
                'path' => $relativePath,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'human_size' => $this->humanFileSize($media->size),
                'url' => $media->getUrl(),
                'thumbnail' => $media->mime_type === 'image' ? $media->getUrl('thumb') : null,
                'created_at' => $media->created_at,
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
            'files.*' => 'required|file|max:'.config('app.max_upload_size', 102400),
            'paths' => 'nullable|array',
            'paths.*' => 'nullable|string|max:500',
        ]);

        $uploaded = [];
        $files = $request->file('files');
        $paths = $request->input('paths', []);

        foreach ($files as $i => $file) {
            $relativePath = $paths[$i] ?? $file->getClientOriginalName();
            $ext = strtolower($file->getClientOriginalExtension());

            if (in_array($ext, ['zip', 'rar', 'cbr'])) {
                $extracted = app(ArchiveService::class)->extractAndUpload($project, $file, $file->getClientOriginalName());
                foreach ($extracted as $item) {
                    $uploaded[] = $item;
                }

                continue;
            }

            try {
                $media = $project->addMedia($file)
                    ->withCustomProperties(['path' => $relativePath])
                    ->toMediaCollection('project_files');
            } catch (\Throwable $e) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            $uploaded[] = [
                'id' => $media->id,
                'name' => $media->name,
                'file_name' => $media->file_name,
                'path' => $relativePath,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'human_size' => $this->humanFileSize($media->size),
                'url' => $media->getUrl(),
                'thumbnail' => $media->mime_type === 'image' ? $media->getUrl('thumb') : null,
                'created_at' => $media->created_at,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => count($uploaded).' files uploaded successfully',
            'data' => $uploaded,
        ], 201);
    }

    public function destroy(Request $request, Project $project, Media $media): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        if ($media->model_id !== $project->id || $media->model_type !== Project::class) {
            abort(404);
        }

        $media->delete();

        return response()->json([
            'success' => true,
            'message' => 'File deleted successfully',
        ]);
    }

    public function destroyBatch(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer',
        ]);

        $media = Media::whereIn('id', $validated['ids'])
            ->where('model_id', $project->id)
            ->where('model_type', Project::class)
            ->get();

        $count = $media->count();
        foreach ($media as $m) {
            $m->delete();
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

        $media = Media::where('model_id', $project->id)
            ->where('model_type', Project::class)
            ->get();

        $count = $media->count();
        foreach ($media as $m) {
            $m->delete();
        }

        return response()->json([
            'success' => true,
            'message' => "All {$count} files deleted",
        ]);
    }

    public function rename(Request $request, Project $project, Media $media): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        if ($media->model_id !== $project->id || $media->model_type !== Project::class) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $media->update(['name' => $validated['name']]);

        return response()->json([
            'success' => true,
            'message' => 'File renamed successfully',
            'data' => $media,
        ]);
    }

    public function content(Request $request, Project $project, Media $media): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        if ($media->model_id !== $project->id || $media->model_type !== Project::class) {
            abort(404);
        }

        $textTypes = [
            'text/', 'application/json', 'application/javascript', 'application/xml',
            'application/x-httpd-php', 'application/x-sh', 'application/x-yaml',
        ];
        $isText = collect($textTypes)->contains(fn ($t) => str_starts_with($media->mime_type, $t));

        $content = null;
        if ($isText) {
            $content = file_get_contents($media->getPath());
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $media->id,
                'name' => $media->name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'human_size' => $this->humanFileSize($media->size),
                'url' => $media->getUrl(),
                'is_text' => $isText,
                'content' => $content,
            ],
        ]);
    }

    public function updateContent(Request $request, Project $project, Media $media): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        if ($media->model_id !== $project->id || $media->model_type !== Project::class) {
            abort(404);
        }

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        file_put_contents($media->getPath(), $validated['content']);

        return response()->json([
            'success' => true,
            'message' => 'File updated',
        ]);
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
