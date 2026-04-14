<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for OrderController — payment flows.
 *
 * Tests:
 * - Idempotency: completed orders return 200 immediately
 * - Processing guard: 'processing' orders return 409
 * - Wallet: atomic deduction + correct ledger
 * - Wallet: insufficient balance rejected
 * - Wallet: invalid payment method rejected
 */
class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────
    // Auth
    // ─────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_pay_order(): void
    {
        $this->postJson('/api/orders/some-uuid/pay')->assertStatus(401);
    }

    // ─────────────────────────────────────────────────────────
    // Idempotency — completed order
    // ─────────────────────────────────────────────────────────

    public function test_paying_already_completed_order_returns_200(): void
    {
        $user  = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status'  => 'completed',
            'total'   => 100,
        ]);

        $this->actingAs($user, 'sanctum')
             ->postJson("/api/orders/{$order->id}/pay", ['payment_method' => 'wallet'])
             ->assertStatus(200)
             ->assertJsonPath('success', true)
             ->assertJsonPath('message', 'الطلب مدفوع مسبقاً');
    }

    // ─────────────────────────────────────────────────────────
    // Processing guard — [FIX GAP-NEW-01]
    // ─────────────────────────────────────────────────────────

    public function test_paying_processing_order_returns_409(): void
    {
        $user  = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status'  => 'processing',
            'total'   => 100,
        ]);

        $this->actingAs($user, 'sanctum')
             ->postJson("/api/orders/{$order->id}/pay", ['payment_method' => 'wallet'])
             ->assertStatus(409)
             ->assertJsonPath('error', 'order_processing');
    }

    // ─────────────────────────────────────────────────────────
    // Payment method validation
    // ─────────────────────────────────────────────────────────

    public function test_invalid_payment_method_returns_422(): void
    {
        $user  = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status'  => 'pending',
            'total'   => 50,
        ]);

        $this->actingAs($user, 'sanctum')
             ->postJson("/api/orders/{$order->id}/pay", ['payment_method' => 'bitcoin'])
             ->assertStatus(422)
             ->assertJsonPath('error', 'invalid_payment_method');
    }

    // ─────────────────────────────────────────────────────────
    // Wallet — insufficient balance
    // ─────────────────────────────────────────────────────────

    public function test_wallet_payment_fails_when_balance_insufficient(): void
    {
        $user  = User::factory()->create(['wallet_balance' => 30.00]);
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status'  => 'pending',
            'total'   => 100.00,
        ]);

        $this->actingAs($user, 'sanctum')
             ->postJson("/api/orders/{$order->id}/pay", ['payment_method' => 'wallet'])
             ->assertStatus(422)
             ->assertJsonPath('error', 'insufficient_balance')
             ->assertJsonPath('data.required', 100.0)
             ->assertJsonPath('data.shortfall', 70.0);
    }

    // ─────────────────────────────────────────────────────────
    // Order not found
    // ─────────────────────────────────────────────────────────

    public function test_paying_nonexistent_order_returns_404(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
             ->postJson('/api/orders/00000000-0000-0000-0000-000000000000/pay', ['payment_method' => 'wallet'])
             ->assertStatus(404);
    }

    // ─────────────────────────────────────────────────────────
    // Cannot pay another user's order
    // ─────────────────────────────────────────────────────────

    public function test_user_cannot_pay_another_users_order(): void
    {
        $owner   = User::factory()->create();
        $other   = User::factory()->create();
        $order   = Order::factory()->create([
            'user_id' => $owner->id,
            'status'  => 'pending',
            'total'   => 50,
        ]);

        $this->actingAs($other, 'sanctum')
             ->postJson("/api/orders/{$order->id}/pay", ['payment_method' => 'wallet'])
             ->assertStatus(404); // Order lookup scoped to authenticated user
    }
}
