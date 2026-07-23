<?php

namespace App\Services;

class FrameworkScanner
{
    public function scan(string $sourcePath): array
    {
        $info = [
            'framework' => 'static',
            'language' => 'static',
            'framework_version' => null,
            'build_command' => null,
            'install_command' => null,
            'start_command' => null,
            'output_dir' => null,
            'internal_port' => 80,
            'docker_base_image' => 'nginx:alpine',
        ];

        if ($this->hasFile($sourcePath, 'composer.json')) {
            $composer = $this->readJson($sourcePath, 'composer.json');
            if ($composer) {
                $require = $composer['require'] ?? [];
                if (isset($require['laravel/framework'])) {
                    $info['framework'] = 'laravel';
                    $info['language'] = 'php';
                    $info['framework_version'] = $require['laravel/framework'];
                    $info['build_command'] = 'composer install --no-dev --optimize-autoloader';
                    $info['install_command'] = 'composer install --no-dev --optimize-autoloader';
                    $info['start_command'] = 'php artisan serve --host=0.0.0.0 --port={port}';
                    $info['output_dir'] = 'public';
                    $info['internal_port'] = 8000;
                    $info['docker_base_image'] = 'php:8.4-apache';

                    return $info;
                }
            }
            $info['framework'] = 'php';
            $info['language'] = 'php';
            $info['build_command'] = 'composer install --no-dev --optimize-autoloader';
            $info['install_command'] = 'composer install --no-dev --optimize-autoloader';
            $info['internal_port'] = 8000;
            $info['docker_base_image'] = 'php:8.4-apache';

            return $info;
        }

        if ($this->hasFile($sourcePath, 'package.json')) {
            $pkg = $this->readJson($sourcePath, 'package.json');
            if ($pkg) {
                $deps = array_merge(
                    $pkg['dependencies'] ?? [],
                    $pkg['devDependencies'] ?? []
                );

                $scripts = $pkg['scripts'] ?? [];
                $hasBuild = isset($scripts['build']);
                $hasDev = isset($scripts['dev']);

                if (isset($deps['next'])) {
                    $info['framework'] = 'nextjs';
                    $info['language'] = 'javascript';
                    $info['framework_version'] = $deps['next'];
                    $info['build_command'] = $hasBuild ? 'npm run build' : null;
                    $info['install_command'] = 'npm ci';
                    $info['start_command'] = 'npm start -- --port={port}';
                    $info['output_dir'] = '.next';
                    $info['internal_port'] = 3000;
                    $info['docker_base_image'] = 'node:22-alpine';

                    return $info;
                }

                if (isset($deps['vue']) && isset($deps['nuxt'])) {
                    $info['framework'] = 'nuxt';
                    $info['language'] = 'javascript';
                    $info['framework_version'] = $deps['nuxt'];
                    $info['build_command'] = $hasBuild ? 'npm run build' : null;
                    $info['install_command'] = 'npm ci';
                    $info['start_command'] = $hasDev ? 'npm run dev -- --port={port}' : 'npm start -- --port={port}';
                    $info['output_dir'] = '.output';
                    $info['internal_port'] = 3000;
                    $info['docker_base_image'] = 'node:22-alpine';

                    return $info;
                }

                if (isset($deps['react']) || isset($deps['react-dom'])) {
                    $info['framework'] = 'react';
                    $info['language'] = 'javascript';
                    $info['build_command'] = 'npm run build';
                    $info['install_command'] = 'npm ci';
                    $info['output_dir'] = 'build';
                    $info['internal_port'] = 80;
                    if ($hasDev) {
                        $info['start_command'] = 'npm run dev -- --port={port}';
                        $info['internal_port'] = 3000;
                    }
                    $info['docker_base_image'] = 'node:22-alpine';

                    return $info;
                }

                if (isset($deps['vue'])) {
                    $info['framework'] = 'vue';
                    $info['language'] = 'javascript';
                    $info['build_command'] = $hasBuild ? 'npm run build' : null;
                    $info['install_command'] = 'npm ci';
                    $info['output_dir'] = 'dist';
                    $info['internal_port'] = 80;
                    $info['docker_base_image'] = 'node:22-alpine';

                    return $info;
                }

                if (isset($deps['@angular/core'])) {
                    $info['framework'] = 'angular';
                    $info['language'] = 'javascript';
                    $info['build_command'] = $hasBuild ? 'npm run build' : null;
                    $info['install_command'] = 'npm ci';
                    $info['output_dir'] = 'dist';
                    $info['internal_port'] = 80;
                    $info['docker_base_image'] = 'node:22-alpine';

                    return $info;
                }

                if (isset($deps['svelte'])) {
                    $info['framework'] = 'svelte';
                    $info['language'] = 'javascript';
                    $info['build_command'] = $hasBuild ? 'npm run build' : null;
                    $info['install_command'] = 'npm ci';
                    $info['output_dir'] = 'dist';
                    $info['internal_port'] = 80;
                    $info['docker_base_image'] = 'node:22-alpine';

                    return $info;
                }

                if (isset($deps['express'])) {
                    $info['framework'] = 'express';
                    $info['language'] = 'javascript';
                    $info['install_command'] = 'npm ci';
                    $info['start_command'] = 'node index.js';
                    $info['internal_port'] = 3000;
                    $info['docker_base_image'] = 'node:22-alpine';

                    return $info;
                }

                $info['framework'] = 'node';
                $info['language'] = 'javascript';
                $info['install_command'] = 'npm ci';
                if ($hasBuild) {
                    $info['build_command'] = 'npm run build';
                    $info['output_dir'] = 'dist';
                }
                $info['docker_base_image'] = 'node:22-alpine';

                return $info;
            }
        }

        if ($this->hasFile($sourcePath, 'requirements.txt')) {
            $info['framework'] = 'python';
            $info['language'] = 'python';
            $info['install_command'] = 'pip install -r requirements.txt';
            $info['docker_base_image'] = 'python:3.12-slim';
            $info['internal_port'] = 8000;

            $contents = file_get_contents($sourcePath.'/requirements.txt');
            if (str_contains($contents, 'django')) {
                $info['framework'] = 'django';
                $info['start_command'] = 'python manage.py runserver 0.0.0.0:{port}';
                $info['internal_port'] = 8000;
            } elseif (str_contains($contents, 'flask')) {
                $info['framework'] = 'flask';
                $info['start_command'] = 'flask run --host=0.0.0.0 --port={port}';
                $info['internal_port'] = 5000;
            }

            return $info;
        }

        if ($this->hasFile($sourcePath, 'Gemfile')) {
            $info['framework'] = 'rails';
            $info['language'] = 'ruby';
            $info['install_command'] = 'bundle install';
            $info['start_command'] = 'rails server -b 0.0.0.0 -p {port}';
            $info['internal_port'] = 3000;
            $info['docker_base_image'] = 'ruby:3.3-slim';

            return $info;
        }

        if ($this->hasFile($sourcePath, 'go.mod')) {
            $info['framework'] = 'go';
            $info['language'] = 'go';
            $info['build_command'] = 'go build -o app .';
            $info['start_command'] = './app';
            $info['internal_port'] = 8080;
            $info['docker_base_image'] = 'golang:1.22-alpine';

            return $info;
        }

        if ($this->hasFile($sourcePath, 'Cargo.toml')) {
            $info['framework'] = 'rust';
            $info['language'] = 'rust';
            $info['build_command'] = 'cargo build --release';
            $info['start_command'] = './target/release/app';
            $info['internal_port'] = 8080;
            $info['docker_base_image'] = 'rust:1.77-slim';

            return $info;
        }

        $indexFiles = ['index.html', 'index.htm', 'index.php', 'index.html'];
        foreach ($indexFiles as $f) {
            if ($this->hasFile($sourcePath, $f)) {
                $info['framework'] = 'static';
                $info['language'] = 'static';
                $info['output_dir'] = '.';
                $info['internal_port'] = 80;
                $info['docker_base_image'] = 'nginx:alpine';

                return $info;
            }
        }

        return $info;
    }

    private function hasFile(string $dir, string $filename): bool
    {
        return file_exists($dir.'/'.$filename);
    }

    private function readJson(string $dir, string $filename): ?array
    {
        $path = $dir.'/'.$filename;
        if (! file_exists($path)) {
            return null;
        }
        $content = file_get_contents($path);
        $decoded = json_decode($content, true);

        return is_array($decoded) ? $decoded : null;
    }
}
