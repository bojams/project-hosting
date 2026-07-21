<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\ArchiveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChunkedUploadController extends Controller
{
    private function chunkDir(Project $project): string
    {
        $dir = storage_path("app/chunks/{$project->id}");
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir;
    }

    public function uploadChunk(Request $request, Project $project): JsonResponse
    {
        set_time_limit(300);

        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $request->validate([
            'file' => 'required|file',
            'chunk_index' => 'required|integer|min:0',
            'total_chunks' => 'required|integer|min:1',
            'original_name' => 'required|string|max:255',
            'relative_path' => 'nullable|string|max:500',
            'upload_id' => 'nullable|string|max:100',
        ]);

        $chunkDir = $this->chunkDir($project);
        $uploadId = $request->input('upload_id', md5($request->input('original_name').$project->id));
        $chunkIndex = $request->integer('chunk_index');
        $totalChunks = $request->integer('total_chunks');

        $request->file('file')->move($chunkDir, "{$uploadId}.part{$chunkIndex}");

        $receivedChunks = 0;
        for ($i = 0; $i < $totalChunks; $i++) {
            if (file_exists("{$chunkDir}/{$uploadId}.part{$i}")) {
                $receivedChunks++;
            }
        }

        $done = $receivedChunks === $totalChunks;

        return response()->json([
            'success' => true,
            'data' => [
                'upload_id' => $uploadId,
                'chunk_index' => $chunkIndex,
                'total_chunks' => $totalChunks,
                'received_chunks' => $receivedChunks,
                'done' => $done,
            ],
        ]);
    }

    public function complete(Request $request, Project $project): JsonResponse
    {
        set_time_limit(300);

        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $request->validate([
            'upload_id' => 'required|string',
            'original_name' => 'required|string|max:255',
            'total_chunks' => 'required|integer|min:1',
            'relative_path' => 'nullable|string|max:500',
        ]);

        $chunkDir = $this->chunkDir($project);
        $uploadId = $request->input('upload_id');
        $totalChunks = $request->integer('total_chunks');
        $originalName = $request->input('original_name');
        $relativePath = $request->input('relative_path', $originalName);

        for ($i = 0; $i < $totalChunks; $i++) {
            if (! file_exists("{$chunkDir}/{$uploadId}.part{$i}")) {
                return response()->json([
                    'success' => false,
                    'message' => "Missing chunk {$i}",
                ], 400);
            }
        }

        $tempPath = tempnam(sys_get_temp_dir(), 'hideo_');
        $out = fopen($tempPath, 'wb');
        if (! $out) {
            return response()->json(['success' => false, 'message' => 'Failed to create temp file'], 500);
        }

        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkPath = "{$chunkDir}/{$uploadId}.part{$i}";
            $in = fopen($chunkPath, 'rb');
            if ($in) {
                stream_copy_to_stream($in, $out);
                fclose($in);
            }
            unlink($chunkPath);
        }
        fclose($out);

        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (in_array($ext, ['zip', 'rar', 'cbr'])) {
            $archiveService = app(ArchiveService::class);
            $extracted = $archiveService->extractAndUpload($project, $tempPath, $originalName);
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }

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
            $media = $project->addMedia($tempPath)
                ->usingName(pathinfo($originalName, PATHINFO_FILENAME))
                ->usingFileName($originalName)
                ->withCustomProperties(['path' => $relativePath])
                ->toMediaCollection('project_files');

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
                    'created_at' => $media->created_at,
                ],
            ], 201);
        } catch (\Throwable $e) {
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to process file: '.$e->getMessage(),
            ], 500);
        }
    }

    public function cancel(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $request->validate(['upload_id' => 'required|string']);

        $chunkDir = $this->chunkDir($project);
        $uploadId = $request->input('upload_id');

        foreach (glob("{$chunkDir}/{$uploadId}.part*") as $chunk) {
            unlink($chunk);
        }

        return response()->json(['success' => true, 'message' => 'Upload cancelled']);
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
