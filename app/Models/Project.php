<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Project extends Model implements HasMedia
{
    use InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'domain',
        'custom_domain',
        'domain_status',
        'description',
        'status',
        'preview_path',
        'source_type',
        'github_url',
        'framework',
        'framework_version',
        'build_command',
        'output_dir',
        'internal_port',
        'port',
        'port_auto',
        'database_type',
        'database_name',
        'container_id',
        'container_status',
        'cloudflare_api_token',
        'cloudflare_zone_id',
        'cloudflare_account_id',
        'cloudflare_tunnel_id',
    ];

    protected $casts = [
        'port_auto' => 'boolean',
        'internal_port' => 'integer',
        'port' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Project $project) {
            if (empty($project->slug)) {
                $project->slug = Str::slug($project->name);
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('project_files');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function deployments(): HasMany
    {
        return $this->hasMany(Deployment::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function sourcePath(): string
    {
        return storage_path("app/sources/{$this->id}");
    }
}
