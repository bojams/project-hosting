<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class ProjectDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $mediaItems = $this->getMedia('project_files');

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'domain' => $this->domain,
            'custom_domain' => $this->custom_domain,
            'domain_status' => $this->domain_status,
            'description' => $this->description,
            'status' => $this->status,
            'preview_path' => $this->preview_path,
            'source_type' => $this->source_type,
            'framework' => $this->framework,
            'framework_version' => $this->framework_version,
            'build_command' => $this->build_command,
            'output_dir' => $this->output_dir,
            'internal_port' => $this->internal_port,
            'port' => $this->port,
            'port_auto' => $this->port_auto,
            'database_type' => $this->database_type,
            'database_name' => $this->database_name,
            'container_id' => $this->container_id,
            'container_status' => $this->container_status,
            'cloudflare_api_token' => $this->cloudflare_api_token,
            'cloudflare_zone_id' => $this->cloudflare_zone_id,
            'cloudflare_account_id' => $this->cloudflare_account_id,
            'cloudflare_tunnel_id' => $this->cloudflare_tunnel_id,
            'media' => $mediaItems->map(fn (Media $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'file_name' => $m->file_name,
                'path' => $m->getCustomProperty('path', $m->file_name),
                'mime_type' => $m->mime_type,
                'size' => $m->size,
                'url' => $m->getUrl(),
                'created_at' => $m->created_at,
            ])->values(),
            'deployments' => DeploymentResource::collection($this->whenLoaded('deployments')),
        ];
    }
}
