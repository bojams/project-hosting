<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'username' => 'jawa',
            'email' => 'jawa@gmail.com',
            'password' => bcrypt('password'),
            'role' => 'user',
            'status' => 'active',
        ]);

        User::factory()->create([
            'username' => 'admin',
            'email' => 'admin@hideo.id',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);
    }
}
