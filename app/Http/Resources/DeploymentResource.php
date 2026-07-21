<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeploymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'version' => $this->version,
            'status' => $this->status,
            'description' => $this->description,
            'changed_files' => $this->changed_files ?? [],
            'deployed_at' => $this->deployed_at,
            'created_at' => $this->created_at,
        ];
    }
}
