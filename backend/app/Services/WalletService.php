<?php

namespace App\Services;

use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * WalletService — Centralized wallet operations
 *
 * [DRY-02 FIX] Consolidates the duplicated wallet credit logic that existed
 * in PaymentController::handleWalletTopupSucceeded() and ::confirmTopup().
 * Both methods shared identical atomic credit + ledger + cache-bust code.
 *
 * Usage:
 *   app(WalletService::class)->credit($userId, 50.0, 'Stripe topup', 'StripeTopup', $piId);
 */
class WalletService
{
    /**
     * Credit a user's wallet atomically with ledger entry and cache invalidation.
     *
     * @param int|string $userId        The user ID to credit
     * @param float      $amount        Amount to add (must be > 0)
     * @param string     $description   Human-readable description for ledger
     * @param string     $referenceType Reference type (e.g., 'StripeTopup', 'Referral')
     * @param string|null $referenceId  External reference ID (e.g., Stripe PI ID)
     * @return array{balance_before: float, balance_after: float}
     *
     * @throws \InvalidArgumentException If amount <= 0
     * @throws \Throwable               If DB transaction fails
     */
    public function credit(
        int|string $userId,
        float $amount,
        string $description,
        string $referenceType = 'Manual',
        ?string $referenceId = null,
    ): array {
        if ($amount <= 0) {
            throw new \InvalidArgumentException("Credit amount must be positive, got: {$amount}");
        }

        $result = [];

        DB::transaction(function () use ($userId, $amount, $description, $referenceType, $referenceId, &$result) {
            $freshUser = User::where('id', $userId)->lockForUpdate()->first();

            if (!$freshUser) {
                throw new \RuntimeException("User {$userId} not found for wallet credit");
            }

            $balanceBefore = (float) $freshUser->wallet_balance;
            $freshUser->increment('wallet_balance', $amount);
            $balanceAfter = $balanceBefore + $amount;

            // Ledger entry
            if (class_exists(WalletTransaction::class)) {
                WalletTransaction::create([
                    'user_id'        => $userId,
                    'type'           => 'deposit',
                    'amount'         => $amount,
                    'balance_before' => $balanceBefore,
                    'balance_after'  => $balanceAfter,
                    'description'    => $description,
                    'reference_type' => $referenceType,
                    'reference_id'   => $referenceId,
                ]);
            }

            $result = [
                'balance_before' => $balanceBefore,
                'balance_after'  => $balanceAfter,
            ];
        });

        // Bust the transactions cache so the next API call returns fresh data
        $this->bustTransactionCache($userId);

        return $result;
    }

    /**
     * Invalidate cached wallet transaction pages for a user.
     *
     * [BUG-02 FIX] Removed hardcoded Cache::store('file') — now uses the default
     * cache store (respects CACHE_DRIVER in .env). Previously, if CACHE_DRIVER=redis,
     * this method was a no-op and users would see stale data after crediting their wallet.
     */
    public function bustTransactionCache(int|string $userId): void
    {
        // Clear all common page-size variants
        foreach (['pp10', 'pp20', 'pp50'] as $pp) {
            Cache::forget("wallet_tx_{$userId}_p1_{$pp}");
        }
    }
}
