<?php

namespace Tests\Unit;

use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for Coupon model — calculateDiscount(), isValid(), canBeUsedBy(), recordUsage().
 *
 * Tests:
 * - Percentage discount calculation (with and without max_discount cap)
 * - Fixed discount calculation (cannot exceed order total)
 * - Expired coupon is invalid
 * - Inactive coupon is invalid
 * - Max uses limit enforcement
 * - Per-user usage limit enforcement
 * - Min order amount enforcement
 * - recordUsage() race-condition guard (double-use prevention)
 */
class CouponTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────
    // calculateDiscount — percentage type
    // ─────────────────────────────────────────────────────────

    public function test_percentage_discount_calculates_correctly(): void
    {
        $coupon = Coupon::factory()->create([
            'discount_type'  => 'percentage',
            'discount_value' => 20,   // 20%
            'max_discount'   => null,
            'min_order_amount' => 0,
        ]);

        $this->assertEquals(20.00, $coupon->calculateDiscount(100.00)); // 20% of 100
        $this->assertEquals(5.00,  $coupon->calculateDiscount(25.00));  // 20% of 25
    }

    public function test_percentage_discount_capped_by_max_discount(): void
    {
        $coupon = Coupon::factory()->create([
            'discount_type'  => 'percentage',
            'discount_value' => 50,     // 50%
            'max_discount'   => 30.00,  // cap at 30
            'min_order_amount' => 0,
        ]);

        // 50% of 200 = 100, but capped at 30
        $this->assertEquals(30.00, $coupon->calculateDiscount(200.00));

        // 50% of 40 = 20 < 30, so not capped
        $this->assertEquals(20.00, $coupon->calculateDiscount(40.00));
    }

    // ─────────────────────────────────────────────────────────
    // calculateDiscount — fixed type
    // ─────────────────────────────────────────────────────────

    public function test_fixed_discount_calculates_correctly(): void
    {
        $coupon = Coupon::factory()->create([
            'discount_type'  => 'fixed',
            'discount_value' => 15.00,
            'min_order_amount' => 0,
        ]);

        $this->assertEquals(15.00, $coupon->calculateDiscount(100.00));
    }

    public function test_fixed_discount_cannot_exceed_order_total(): void
    {
        $coupon = Coupon::factory()->create([
            'discount_type'  => 'fixed',
            'discount_value' => 50.00,  // discount > order
            'min_order_amount' => 0,
        ]);

        // Should return order total (not negative)
        $this->assertEquals(10.00, $coupon->calculateDiscount(10.00));
    }

    // ─────────────────────────────────────────────────────────
    // calculateDiscount — min_order_amount
    // ─────────────────────────────────────────────────────────

    public function test_discount_returns_zero_when_below_min_order(): void
    {
        $coupon = Coupon::factory()->create([
            'discount_type'  => 'fixed',
            'discount_value' => 10.00,
            'min_order_amount' => 100.00,
        ]);

        $this->assertEquals(0, $coupon->calculateDiscount(50.00)); // below min
        $this->assertEquals(10.00, $coupon->calculateDiscount(100.00)); // exactly min
    }

    // ─────────────────────────────────────────────────────────
    // isValid()
    // ─────────────────────────────────────────────────────────

    public function test_inactive_coupon_is_not_valid(): void
    {
        $coupon = Coupon::factory()->create(['is_active' => false]);
        $this->assertFalse($coupon->isValid());
    }

    public function test_expired_coupon_is_not_valid(): void
    {
        $coupon = Coupon::factory()->create([
            'is_active'  => true,
            'expires_at' => now()->subDay(),
        ]);
        $this->assertFalse($coupon->isValid());
    }

    public function test_not_started_coupon_is_not_valid(): void
    {
        $coupon = Coupon::factory()->create([
            'is_active'  => true,
            'starts_at'  => now()->addDay(), // starts tomorrow
            'expires_at' => null,
        ]);
        $this->assertFalse($coupon->isValid());
    }

    public function test_exhausted_coupon_is_not_valid(): void
    {
        $coupon = Coupon::factory()->create([
            'is_active'  => true,
            'max_uses'   => 5,
            'used_count' => 5,
        ]);
        $this->assertFalse($coupon->isValid());
    }

    public function test_active_coupon_within_date_is_valid(): void
    {
        $coupon = Coupon::factory()->create([
            'is_active'  => true,
            'starts_at'  => now()->subDay(),
            'expires_at' => now()->addDay(),
            'max_uses'   => null,
        ]);
        $this->assertTrue($coupon->isValid());
    }

    // ─────────────────────────────────────────────────────────
    // canBeUsedBy() — per-user limit
    // ─────────────────────────────────────────────────────────

    public function test_user_cannot_exceed_per_user_limit(): void
    {
        $user   = User::factory()->create();
        $coupon = Coupon::factory()->create([
            'is_active'          => true,
            'max_uses_per_user'  => 1,
        ]);

        // Simulate 1 prior usage
        CouponUsage::factory()->create([
            'coupon_id' => $coupon->id,
            'user_id'   => $user->id,
        ]);

        $this->assertFalse($coupon->canBeUsedBy($user->id));
    }

    public function test_user_within_limit_can_use_coupon(): void
    {
        $user   = User::factory()->create();
        $coupon = Coupon::factory()->create([
            'is_active'          => true,
            'max_uses_per_user'  => 3,
        ]);

        // Only 1 prior usage — limit is 3
        CouponUsage::factory()->create([
            'coupon_id' => $coupon->id,
            'user_id'   => $user->id,
        ]);

        $this->assertTrue($coupon->canBeUsedBy($user->id));
    }

    // ─────────────────────────────────────────────────────────
    // recordUsage() — race condition guard
    // ─────────────────────────────────────────────────────────

    public function test_record_usage_throws_when_max_uses_exceeded_under_lock(): void
    {
        $user   = User::factory()->create();
        $coupon = Coupon::factory()->create([
            'is_active'  => true,
            'max_uses'   => 1,
            'used_count' => 1, // Already at limit
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('كود الخصم تجاوز الحد الأقصى للاستخدام');

        $orderId = (string)\Illuminate\Support\Str::uuid();
        $coupon->recordUsage($user->id, $orderId, 10.00);
    }

    public function test_record_usage_increments_used_count(): void
    {
        $user   = User::factory()->create();
        $coupon = Coupon::factory()->create([
            'is_active'  => true,
            'max_uses'   => 10,
            'used_count' => 2,
        ]);

        $orderId = (string)\Illuminate\Support\Str::uuid();
        $coupon->recordUsage($user->id, $orderId, 15.00);

        $coupon->refresh();
        $this->assertEquals(3, $coupon->used_count);
        $this->assertDatabaseHas('coupon_usages', [
            'coupon_id'       => $coupon->id,
            'user_id'         => $user->id,
            'order_id'        => $orderId,
            'discount_amount' => 15.00,
        ]);
    }
}
