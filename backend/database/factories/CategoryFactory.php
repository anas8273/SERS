<?php

namespace Database\Factories;

use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'section_id' => Section::factory(),
            'name_ar' => $this->faker->word,
            'name_en' => $this->faker->word,
            'slug' => $this->faker->unique()->slug,
            'is_active' => true,
        ];
    }
}