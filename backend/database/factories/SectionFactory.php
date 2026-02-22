<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class SectionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name_ar' => $this->faker->sentence(2),
            'name_en' => $this->faker->sentence(2),
            'slug' => $this->faker->unique()->slug,
            'description_ar' => $this->faker->paragraph,
            'description_en' => $this->faker->paragraph,
            'icon' => $this->faker->randomElement(['📁', '📊', '📋', '🎓', '📝', '🏆']),
            'is_active' => true,
            'sort_order' => $this->faker->numberBetween(1, 100),
        ];
    }
}