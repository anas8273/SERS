<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name_ar' => $this->faker->word,
            'name_en' => $this->faker->word,
            'slug' => $this->faker->slug,
            'is_active' => true,
        ];
    }
}