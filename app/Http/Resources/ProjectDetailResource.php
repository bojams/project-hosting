<?php

namespace App\Http\Resources;

use App\Services\DockerDeployer;
use App\Services\ProjectFileService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        app(DockerDeployer::class)->syncMediaToSource($this->resource, $this->resource->sourcePath());

        $service = app(ProjectFileService::class);
        $mediaByPath = $this->getMedia('project_files')
            ->mapWithKeys(fn ($m) => [$m->getCustomProperty('path', $m->file_name) => $m]);

        $files = $service->list($this->resource, function (array $row) use ($mediaByPath) {
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
            'cloudflare_api_token' => $this->cloudflare_api_token ? '********' : null,
            'cloudflare_zone_id' => $this->cloudflare_zone_id ? '********' : null,
            'cloudflare_account_id' => $this->cloudflare_account_id ? '********' : null,
            'cloudflare_tunnel_id' => $this->cloudflare_tunnel_id,
            'media' => array_values($files),
            'deployments' => DeploymentResource::collection($this->whenLoaded('deployments')),
        ];
    }
}
