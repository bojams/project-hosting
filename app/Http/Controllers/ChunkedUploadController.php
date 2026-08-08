<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\ArchiveService;
use App\Services\ProjectFileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ChunkedUploadController extends Controller
{
    private const ALLOWED_MIMES = 'mimes:jpg,jpeg,png,gif,webp,svg,pdf,zip,tar,gz,mp4,webm,txt,md,php,phtml,json,css,js';

    private const BLOCKED_EXTENSIONS = ['php', 'exe', 'dll', 'sh', 'bat', 'ps1', 'jar'];

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
            'file' => ['required', 'file', self::ALLOWED_MIMES],
            'chunk_index' => 'required|integer|min:0|max:99999',
            'total_chunks' => 'required|integer|min:1|max:5000',
            'original_name' => 'required|string|max:255',
            'relative_path' => 'nullable|string|max:500',
            'upload_id' => 'nullable|string|max:100|regex:/^[a-zA-Z0-9_-]+$/',
        ]);

        $ext = strtolower(pathinfo($request->input('original_name'), PATHINFO_EXTENSION));
        if (in_array($ext, self::BLOCKED_EXTENSIONS)) {
            return response()->json(['success' => false, 'message' => 'File type not allowed'], 422);
        }

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
            'upload_id' => 'required|string|max:100|regex:/^[a-zA-Z0-9_-]+$/',
            'original_name' => 'required|string|max:255',
            'total_chunks' => 'required|integer|min:1|max:5000',
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

        $tempPath = tempnam(sys_get_temp_dir(), 'hideo_'.Str::random(16));
        $out = fopen($tempPath, 'wb');
        if (! $out) {
            return response()->json(['success' => false, 'message' => 'Failed to create temp file'], 500);
        }

        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkPath = realpath("{$chunkDir}/{$uploadId}.part{$i}");
            if ($chunkPath === false || ! str_starts_with($chunkPath, realpath($chunkDir))) {
                fclose($out);
                unlink($tempPath);

                return response()->json(['success' => false, 'message' => 'Invalid chunk path'], 400);
            }
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

        $service = app(ProjectFileService::class);
        $dest = $service->resolve($project, $relativePath);
        if ($dest === false) {
            @unlink($tempPath);

            return response()->json(['success' => false, 'message' => 'Invalid path'], 422);
        }

        if (! is_dir(dirname($dest))) {
            mkdir(dirname($dest), 0755, true);
        }

        copy($tempPath, $dest);
        unlink($tempPath);

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

    public function cancel(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            abort(404);
        }

        $request->validate(['upload_id' => 'required|string|max:100|regex:/^[a-zA-Z0-9_-]+$/']);

        $chunkDir = $this->chunkDir($project);
        $uploadId = $request->input('upload_id');
        $realChunkDir = realpath($chunkDir);

        if ($realChunkDir === false) {
            return response()->json(['success' => true, 'message' => 'No chunks to cancel']);
        }

        foreach (glob("{$realChunkDir}/{$uploadId}.part*") as $chunk) {
            $realChunk = realpath($chunk);
            if ($realChunk !== false && str_starts_with($realChunk, $realChunkDir)) {
                unlink($realChunk);
            }
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
