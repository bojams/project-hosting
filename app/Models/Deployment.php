<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deployment extends Model
{
    protected $fillable = [
        'project_id',
        'version',
        'status',
        'description',
        'changed_files',
        'deployed_at',
    ];

    protected function casts(): array
    {
        return [
            'deployed_at' => 'datetime',
            'changed_files' => 'array',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
