<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Feature tests for ReferralController::withdraw().
 *
 * Tests:
 * - Min amount validation is enforced (from config)
 * - Cannot withdraw more than available balance
 * - Insufficient balance returns correct error
 * - Auth guard
 */
class ReferralControllerTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────
    // Auth
    // ─────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_withdraw(): void
    {
        $this->postJson('/api/referrals/withdraw')->assertStatus(401);
    }

    // ─────────────────────────────────────────────────────────
    // Validation — min amount
    // ─────────────────────────────────────────────────────────

    public function test_withdraw_below_minimum_is_rejected(): void
    {
        $user = User::factory()->create();
        $minAmount = config('referral.min_withdrawal_amount', 50);

        $this->actingAs($user, 'sanctum')
             ->postJson('/api/referrals/withdraw', [
                 'amount'          => $minAmount - 0.01,
                 'method'          => 'bank',
                 'account_details' => ['iban' => 'SA0000000000000000000000'],
             ])
             ->assertStatus(422); // Validation error
    }

    public function test_withdraw_missing_fields_returns_422(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
             ->postJson('/api/referrals/withdraw', [])
             ->assertStatus(422);
    }

    // ─────────────────────────────────────────────────────────
    // Business logic — insufficient earnings
    // ─────────────────────────────────────────────────────────

    public function test_withdraw_with_no_earnings_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
             ->postJson('/api/referrals/withdraw', [
                 'amount'          => 100,
                 'method'          => 'bank',
                 'account_details' => ['iban' => 'SA0000000000000000000000'],
             ])
             ->assertStatus(400) // Business logic rejection
             ->assertJsonPath('error', 'withdrawal_rejected');
    }

    public function test_withdraw_with_sufficient_earnings_creates_record(): void
    {
        $user = User::factory()->create();

        // Seed available earnings
        DB::table('referral_earnings')->insert([
            'id'          => \Illuminate\Support\Str::uuid(),
            'user_id'     => $user->id,
            'referral_id' => null,
            'amount'      => 200.00,
            'type'        => 'commission',
            'status'      => 'available',
            'description' => 'Test earning',
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $this->actingAs($user, 'sanctum')
             ->postJson('/api/referrals/withdraw', [
                 'amount'          => 100.00,
                 'method'          => 'bank',
                 'account_details' => ['iban' => 'SA0000000000000000000000'],
             ])
             ->assertStatus(200)
             ->assertJsonPath('success', true);

        // Verify withdrawal record was created
        $this->assertDatabaseHas('withdrawal_requests', [
            'user_id' => $user->id,
            'amount'  => 100.00,
            'status'  => 'pending',
        ]);

        // Verify earnings are now marked as pending_withdrawal
        $pending = DB::table('referral_earnings')
            ->where('user_id', $user->id)
            ->where('status', 'pending_withdrawal')
            ->count();

        $this->assertGreaterThan(0, $pending);
    }
}
