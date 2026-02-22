<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Template;
use Illuminate\Database\Eloquent\Factories\Factory;

class TemplateFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = Template::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'name_ar' => $this->faker->sentence(3),
            'name_en' => $this->faker->sentence(3),
            'slug' => $this->faker->unique()->slug,
            'description_ar' => $this->faker->paragraph,
            'description_en' => $this->faker->paragraph,
            'type' => $this->faker->randomElement(['ready', 'interactive']),
            'format' => $this->faker->randomElement(['pdf', 'docx', 'pptx']),
            'price' => $this->faker->randomFloat(2, 0, 100),
            'is_free' => $this->faker->boolean(30), // 30% chance of being free
            'category_id' => Category::factory(),
            'is_active' => true,
            'is_featured' => $this->faker->boolean(20), // 20% chance of being featured
            'downloads_count' => $this->faker->numberBetween(0, 1000),
            'uses_count' => $this->faker->numberBetween(0, 500),
        ];
    }

    /**
     * Indicate that the template is free.
     */
    public function free(): static
    {
        return $this->state(fn (array $attributes) => [
            'price' => 0,
            'is_free' => true,
        ]);
    }

    /**
     * Indicate that the template is featured.
     */
    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }

    /**
     * Indicate that the template is ready type (downloadable).
     */
    public function ready(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'ready',
            'ready_file' => 'templates/files/' . $this->faker->uuid . '.pdf',
            'file_type' => 'pdf',
        ]);
    }

    /**
     * Indicate that the template is interactive type (editable).
     */
    public function interactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'interactive',
            'ready_file' => null,
            'file_type' => null,
        ]);
    }
}