<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create withdrawal_requests table.
 *
 * Stores withdrawal requests from users wishing to cash out their referral earnings.
 *
 * Status flow: pending → processing → completed | rejected
 *
 * Admin reviews pending requests and marks them completed/rejected.
 * When completed, the linked referral_earnings rows are marked 'paid'.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            // UUID primary key
            $table->uuid('id')->primary();

            // The user requesting withdrawal
            $table->string('user_id', 36)->comment('UUID of the user requesting withdrawal');

            // Amount requested
            $table->decimal('amount', 10, 2)->unsigned()
                  ->comment('Requested withdrawal amount in SAR');

            // Payment method chosen by user
            $table->enum('method', ['bank', 'wallet'])
                  ->comment('bank = bank transfer, wallet = credit to SERS wallet');

            // Bank / wallet account details (stored as encrypted JSON)
            $table->text('account_details')
                  ->comment('JSON: bank IBAN + account holder name, or wallet ID');

            // Request lifecycle
            $table->enum('status', ['pending', 'processing', 'completed', 'rejected'])
                  ->default('pending')
                  ->comment('Admin-managed status');

            // Admin notes (rejection reason, transfer reference, etc.)
            $table->text('admin_notes')->nullable()
                  ->comment('Admin notes: rejection reason or transfer reference number');

            // Admin who processed this request
            $table->string('processed_by', 36)->nullable()
                  ->comment('UUID of admin who processed this request');

            $table->timestamp('processed_at')->nullable()
                  ->comment('When the request was processed');

            $table->timestamps();

            // ── Indexes ──
            $table->index('user_id',  'withdrawal_user_idx');
            $table->index('status',   'withdrawal_status_idx');
            $table->index(['user_id', 'status'], 'withdrawal_user_status_idx');
            $table->index('created_at', 'withdrawal_created_idx');

            // ── Foreign Keys ──
            $table->foreign('user_id', 'withdrawal_user_fk')
                  ->references('id')->on('users')->cascadeOnDelete();

            $table->foreign('processed_by', 'withdrawal_processor_fk')
                  ->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawal_requests');
    }
};
