<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'original_name' => $this->original_name,
            'stored_path' => $this->stored_path,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'file_type' => $this->file_type,
            'created_at' => $this->created_at,
        ];
    }
}
