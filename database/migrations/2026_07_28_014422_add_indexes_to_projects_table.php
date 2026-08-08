<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (! Schema::hasIndex('projects', 'projects_domain_index')) {
                $table->index('domain');
            }

            if (! Schema::hasIndex('projects', 'projects_custom_domain_index')) {
                $table->index('custom_domain');
            }

            if (! Schema::hasIndex('projects', 'projects_slug_index')) {
                $table->index('slug');
            }
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex(['domain']);
            $table->dropIndex(['custom_domain']);
            $table->dropIndex(['slug']);
        });
    }
};
