<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('dashboard/projects', 'dashboard/projects/index')->name('dashboard.projects.index');
    Route::inertia('dashboard/projects/{project}', 'dashboard/projects/show')->name('dashboard.projects.show');
    Route::inertia('dashboard/users', 'dashboard/users/index')->name('dashboard.users.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/api.php';
