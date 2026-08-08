<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(2),
            'slug' => $this->faker->unique()->slug(2),
            'user_id' => User::factory(),
            'status' => 'draft',
            'source_type' => 'manual',
        ];
    }
}
