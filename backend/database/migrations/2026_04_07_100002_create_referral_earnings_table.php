<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create referral_earnings table.
 *
 * Stores every credit entry for the referral system:
 *   - commission  : 10% of a referred user's completed order
 *   - bonus       : Welcome bonus when applying a referral code
 *
 * Status flow: available → pending_withdrawal → paid
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_earnings', function (Blueprint $table) {
            // Primary key — UUID to match the rest of the system
            $table->uuid('id')->primary();

            // The user who EARNED this (the referrer)
            $table->string('user_id', 36)->comment('UUID of the referrer who earned this');

            // The user who triggered the earning (the referred user)
            // NULL for welcome bonuses
            $table->string('referral_id', 36)->nullable()
                  ->comment('UUID of the referred user who triggered this earning');

            // Amount in SAR
            $table->decimal('amount', 10, 2)->unsigned()
                  ->comment('Earnings amount in SAR');

            // Type of earning
            $table->enum('type', ['commission', 'bonus'])
                  ->default('commission')
                  ->comment('commission = order-based, bonus = welcome/promotional');

            // Lifecycle status
            $table->enum('status', ['available', 'pending_withdrawal', 'paid', 'cancelled'])
                  ->default('available')
                  ->comment('available = can be withdrawn, pending_withdrawal = withdrawal in progress');

            // Human-readable description (includes order ID for idempotency checks)
            $table->string('description', 500)->nullable()
                  ->comment('Description including order:uuid for idempotency');

            $table->timestamps();

            // ── Indexes ──
            $table->index('user_id',     'ref_earnings_user_idx');
            $table->index('referral_id', 'ref_earnings_referral_idx');
            $table->index('status',      'ref_earnings_status_idx');
            $table->index('type',        'ref_earnings_type_idx');

            // Composite for the main balance query
            $table->index(['user_id', 'status'], 'ref_earnings_user_status_idx');

            // ── Foreign Keys ──
            $table->foreign('user_id',     'ref_earnings_user_fk')
                  ->references('id')->on('users')->cascadeOnDelete();

            $table->foreign('referral_id', 'ref_earnings_referral_fk')
                  ->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_earnings');
    }
};
