<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for WalletService — atomic wallet credit operations.
 *
 * Tests the credit method (happy path, negative amount, missing user)
 * and the cache busting method.
 */
class WalletServiceTest extends TestCase
{
    use RefreshDatabase;

    protected WalletService $walletService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->walletService = new WalletService();
    }

    // ─────────────────────────────────────────────────────────
    // Credit
    // ─────────────────────────────────────────────────────────

    public function test_credit_increases_user_balance(): void
    {
        $user = User::factory()->create(['wallet_balance' => 100.00]);

        $result = $this->walletService->credit(
            $user->id,
            50.00,
            'شحن رصيد — اختبار',
            'TestCredit'
        );

        $user->refresh();

        $this->assertEquals(100.00, $result['balance_before']);
        $this->assertEquals(150.00, $result['balance_after']);
        $this->assertEquals(150.00, $user->wallet_balance);
    }

    public function test_credit_creates_ledger_entry(): void
    {
        $user = User::factory()->create(['wallet_balance' => 0]);

        $this->walletService->credit(
            $user->id,
            25.50,
            'عمولة إحالة',
            'Referral',
            'ref_123'
        );

        $tx = WalletTransaction::where('user_id', $user->id)->first();

        $this->assertNotNull($tx);
        $this->assertEquals('deposit', $tx->type);
        $this->assertEquals(25.50, $tx->amount);
        $this->assertEquals(0, $tx->balance_before);
        $this->assertEquals(25.50, $tx->balance_after);
        $this->assertEquals('Referral', $tx->reference_type);
        $this->assertEquals('ref_123', $tx->reference_id);
    }

    public function test_credit_rejects_zero_amount(): void
    {
        $user = User::factory()->create(['wallet_balance' => 100]);

        $this->expectException(\InvalidArgumentException::class);

        $this->walletService->credit($user->id, 0, 'Should fail');
    }

    public function test_credit_rejects_negative_amount(): void
    {
        $user = User::factory()->create(['wallet_balance' => 100]);

        $this->expectException(\InvalidArgumentException::class);

        $this->walletService->credit($user->id, -10, 'Should fail');
    }

    public function test_credit_throws_for_missing_user(): void
    {
        $this->expectException(\RuntimeException::class);

        $this->walletService->credit(99999, 10.00, 'Nonexistent user');
    }

    public function test_multiple_credits_are_atomic(): void
    {
        $user = User::factory()->create(['wallet_balance' => 0]);

        $this->walletService->credit($user->id, 10.00, 'Credit 1', 'Test');
        $this->walletService->credit($user->id, 20.00, 'Credit 2', 'Test');
        $this->walletService->credit($user->id, 30.00, 'Credit 3', 'Test');

        $user->refresh();
        $this->assertEquals(60.00, $user->wallet_balance);
        $this->assertEquals(3, WalletTransaction::where('user_id', $user->id)->count());
    }

    // ─────────────────────────────────────────────────────────
    // Cache Busting
    // ─────────────────────────────────────────────────────────

    public function test_bust_transaction_cache_does_not_throw(): void
    {
        $user = User::factory()->create();

        // Should not throw even if no cache exists
        $this->walletService->bustTransactionCache($user->id);
        $this->assertTrue(true); // explicit assertion that we reached this point
    }
}
