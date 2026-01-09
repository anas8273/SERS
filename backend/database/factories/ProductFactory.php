<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name_ar' => $this->faker->name,
            'name_en' => $this->faker->name,
            'slug' => $this->faker->slug,
            'description_ar' => $this->faker->text,
            'description_en' => $this->faker->text,
            'price' => $this->faker->randomFloat(2, 10, 100),
            'discount_price' => null,
            'type' => 'downloadable', // القيمة الافتراضية
            'category_id' => Category::factory(), // سينشئ تصنيفاً تلقائياً
            'is_active' => true,
            'is_featured' => false,
            'downloads_count' => 0,
        ];
    }
}