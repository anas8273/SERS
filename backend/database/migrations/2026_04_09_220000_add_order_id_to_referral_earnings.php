<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * [L-06] Add order_id column to referral_earnings for robust idempotency.
 *
 * Replaces the fragile LIKE '%order:UUID%' check on the description field
 * with a proper nullable+unique constraint on (user_id, order_id).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('referral_earnings', 'order_id')) {
            Schema::table('referral_earnings', function (Blueprint $table) {
                $table->string('order_id', 36)->nullable()->after('referral_id')
                      ->comment('Order ID that triggered this commission — used for idempotency');

                // Unique constraint: one commission per referrer per order
                $table->unique(['user_id', 'order_id'], 'ref_earnings_user_order_unique');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('referral_earnings', 'order_id')) {
            Schema::table('referral_earnings', function (Blueprint $table) {
                $table->dropUnique('ref_earnings_user_order_unique');
                $table->dropColumn('order_id');
            });
        }
    }
};
