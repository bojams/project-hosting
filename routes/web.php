<?php

use App\Http\Controllers\DocumentationController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/csrf-token', function () {
    return response()->json(['token' => csrf_token()]);
});

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard/page')->name('dashboard');
    Route::inertia('dashboard/projects', 'dashboard/projects/index')->name('dashboard.projects.index');
    Route::get('dashboard/projects/{project}', function (string $project) {
        return Inertia::render('dashboard/projects/show', [
            'project' => ['id' => (int) $project],
        ]);
    })->name('dashboard.projects.show');

    Route::get('dashboard/docs', [DocumentationController::class, 'index'])->name('dashboard.docs.index');
    Route::get('dashboard/docs/{slug}', [DocumentationController::class, 'show'])->name('dashboard.docs.show');

    Route::get('dashboard/directory', function () {
        return Inertia::render('dashboard/users/directory', [
            'users' => User::where('status', 'active')
                ->orderBy('username')
                ->get(['id', 'username', 'email', 'avatar_url', 'role', 'created_at']),
        ]);
    })->name('dashboard.directory')->middleware('admin');

    Route::inertia('dashboard/users', 'dashboard/users/index')->name('dashboard.users.index')->middleware('admin');
});

require __DIR__.'/settings.php';
require __DIR__.'/api.php';
