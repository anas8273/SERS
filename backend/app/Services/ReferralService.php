<?php
// app/Services/ReferralService.php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * ReferralService
 *
 * [BUG-03 FIX] Extracted from ReferralController to decouple business logic
 * from HTTP layer. Called by PurchaseService after order completion.
 *
 * Handles referral commission processing with idempotency guard.
 */
class ReferralService
{
    /**
     * Process referral commission when a referred user completes a purchase.
     *
     * [FIX SEC-03] Idempotency guard: checks for existing commission for the
     * same order to prevent double-crediting on retry scenarios.
     *
     * @param  User   $buyer       The user who made the purchase
     * @param  float  $orderAmount The order total
     * @param  string $orderId     The order UUID
     */
    public static function processCommission(User $buyer, float $orderAmount, string $orderId): void
    {
        if (!$buyer->referred_by) {
            return;
        }

        $referrer = User::find($buyer->referred_by);
        if (!$referrer) {
            return;
        }

        // [L-06 FIX] Proper idempotency via order_id column (replaces fragile LIKE check)
        $exists = DB::table('referral_earnings')
            ->where('user_id', $referrer->id)
            ->where('order_id', $orderId)
            ->exists();

        if ($exists) {
            Log::warning('ReferralService::processCommission: duplicate commission skipped', [
                'order_id'    => $orderId,
                'referrer_id' => $referrer->id,
            ]);
            return;
        }

        // [FIX GAP-NEW-04] Read commission rate from config instead of hardcoding
        $commission = round($orderAmount * config('referral.commission_rate', 0.10), 2);

        try {
            DB::table('referral_earnings')->insert([
                'id'          => (string) Str::uuid(),
                'user_id'     => $referrer->id,
                'referral_id' => $buyer->id,
                'order_id'    => $orderId, // [L-06] Exact match for idempotency
                'amount'      => $commission,
                'type'        => 'commission',
                'status'      => 'available',
                'description' => "عمولة إحالة - {$buyer->name} - order:{$orderId}",
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);

            Log::info('Referral commission credited', [
                'referrer_id' => $referrer->id,
                'buyer_id'    => $buyer->id,
                'order_id'    => $orderId,
                'commission'  => $commission,
            ]);
        } catch (\Throwable $e) {
            Log::error('ReferralService::processCommission failed to insert earnings', [
                'referrer_id' => $referrer->id,
                'order_id'    => $orderId,
                'error'       => $e->getMessage(),
            ]);
        }
    }
}
