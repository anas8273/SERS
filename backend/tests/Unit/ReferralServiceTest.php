<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Unit tests for ReferralService — commission processing.
 *
 * Tests the commission calculation, idempotency guard, and edge cases
 * (no referrer, missing referrer user).
 */
class ReferralServiceTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────
    // Commission Processing
    // ─────────────────────────────────────────────────────────

    public function test_commission_is_10_percent_of_order_amount(): void
    {
        $referrer = User::factory()->create();
        $buyer = User::factory()->create(['referred_by' => $referrer->id]);
        $orderId = (string) Str::uuid();

        ReferralService::processCommission($buyer, 100.00, $orderId);

        $this->assertDatabaseHas('referral_earnings', [
            'user_id'     => $referrer->id,
            'referral_id' => $buyer->id,
            'order_id'    => $orderId,
            'amount'      => 10.00, // 10% of 100
            'type'        => 'commission',
            'status'      => 'available',
        ]);
    }

    public function test_idempotency_prevents_duplicate_commission(): void
    {
        $referrer = User::factory()->create();
        $buyer = User::factory()->create(['referred_by' => $referrer->id]);
        $orderId = (string) Str::uuid();

        // Process twice with same order ID
        ReferralService::processCommission($buyer, 100.00, $orderId);
        ReferralService::processCommission($buyer, 100.00, $orderId);

        // Should have exactly 1 entry, not 2
        $count = \Illuminate\Support\Facades\DB::table('referral_earnings')
            ->where('user_id', $referrer->id)
            ->where('order_id', $orderId)
            ->count();

        $this->assertEquals(1, $count);
    }

    public function test_no_commission_when_buyer_has_no_referrer(): void
    {
        $buyer = User::factory()->create(['referred_by' => null]);
        $orderId = (string) Str::uuid();

        ReferralService::processCommission($buyer, 100.00, $orderId);

        $this->assertDatabaseMissing('referral_earnings', [
            'referral_id' => $buyer->id,
        ]);
    }

    public function test_no_commission_when_referrer_user_is_deleted(): void
    {
        // Create a buyer with a referred_by pointing to a non-existent user
        $buyer = User::factory()->create(['referred_by' => 99999]);
        $orderId = (string) Str::uuid();

        ReferralService::processCommission($buyer, 200.00, $orderId);

        $this->assertDatabaseMissing('referral_earnings', [
            'referral_id' => $buyer->id,
        ]);
    }

    public function test_commission_rounds_to_two_decimals(): void
    {
        $referrer = User::factory()->create();
        $buyer = User::factory()->create(['referred_by' => $referrer->id]);
        $orderId = (string) Str::uuid();

        // 10% of 33.33 = 3.333, should round to 3.33
        ReferralService::processCommission($buyer, 33.33, $orderId);

        $this->assertDatabaseHas('referral_earnings', [
            'user_id'  => $referrer->id,
            'order_id' => $orderId,
            'amount'   => 3.33,
        ]);
    }
}
