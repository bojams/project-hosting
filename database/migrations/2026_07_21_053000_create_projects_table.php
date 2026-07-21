<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('domain')->nullable();
            $table->string('custom_domain')->nullable()->unique();
            $table->string('domain_status')->default('pending');
            $table->text('description')->nullable();
            $table->string('status')->default('draft');
            $table->string('preview_path')->nullable();
            $table->string('source_type')->default('manual');
            $table->string('github_url')->nullable();
            $table->string('framework')->nullable();
            $table->string('framework_version')->nullable();
            $table->string('build_command')->nullable();
            $table->string('output_dir')->nullable();
            $table->integer('internal_port')->nullable();
            $table->integer('port')->nullable();
            $table->boolean('port_auto')->default(true);
            $table->string('database_type')->nullable();
            $table->string('database_name')->nullable();
            $table->string('container_id')->nullable();
            $table->string('container_status')->default('stopped');
            $table->string('cloudflare_api_token')->nullable();
            $table->string('cloudflare_zone_id')->nullable();
            $table->string('cloudflare_account_id')->nullable();
            $table->string('cloudflare_tunnel_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
