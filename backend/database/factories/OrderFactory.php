<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * OrderFactory
 * 
 * Factory for creating sample orders.
 * Ensures referential integrity by selecting existing users.
 */
class OrderFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Order::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = $this->faker->randomFloat(2, 50, 1000);
        $tax = round($subtotal * 0.15, 2); // 15% VAT
        $total = $subtotal + $tax;

        return [
            'user_id' => User::inRandomOrder()->first()?->id ?? User::factory(),
            'order_number' => 'ORD-' . date('Y') . '-' . strtoupper(Str::random(8)),
            'subtotal' => $subtotal,
            'discount' => 0,
            'tax' => $tax,
            'total' => $total,
            'status' => $this->faker->randomElement(['pending', 'completed', 'processing']),
            'payment_method' => $this->faker->randomElement(['stripe', 'paypal', 'wallet']),
            'payment_id' => 'pi_' . Str::random(24),
            'paid_at' => $this->faker->boolean(70) ? now()->subDays(rand(1, 30)) : null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
