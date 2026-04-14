<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the wallet_transactions table for tracking user wallet activity.
     * Records deposits, withdrawals, purchases, and refunds with full audit trail.
     * Optimized with indexes for user history, reporting, and reference lookups.
     */
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            // Primary Key
            $table->uuid('id')->primary()->comment('UUID primary key');

            // User Relationship
            $table->uuid('user_id')->comment('FK to users table (transaction owner)');

            // Transaction Details
            $table->enum('type', ['deposit', 'withdrawal', 'purchase', 'refund'])->comment('Transaction type');
            $table->decimal('amount', 12, 2)->comment('Transaction amount (positive for credit, negative for debit)');
            $table->decimal('balance_before', 12, 2)->comment('Wallet balance before transaction');
            $table->decimal('balance_after', 12, 2)->comment('Wallet balance after transaction');

            // Reference to Related Entity (Polymorphic-like relationship)
            $table->uuid('reference_id')->nullable()->comment('Related entity UUID (e.g., Order ID for purchases)');
            $table->string('reference_type', 50)->nullable()->comment('Related entity type (e.g., Order, Refund)');
            $table->text('description')->nullable()->comment('Human-readable transaction description');

            // System Timestamps
            $table->timestamps();

            // Foreign Key
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->restrictOnDelete() // Preserve transaction history even if user is soft-deleted
                  ->cascadeOnUpdate();

            // Performance Indexes
            // User transaction history (most common query)
            $table->index('user_id', 'wallet_tx_user_index');
            $table->index(['user_id', 'created_at'], 'wallet_tx_user_history_index');
            $table->index(['user_id', 'type'], 'wallet_tx_user_type_index');

            // Transaction type filtering (admin reporting)
            $table->index('type', 'wallet_tx_type_index');

            // Reference lookup (find transactions for a specific order/refund)
            $table->index(['reference_type', 'reference_id'], 'wallet_tx_reference_index');
            $table->index('reference_id', 'wallet_tx_reference_id_index');

            // Audit and reporting (date-based queries)
            $table->index('created_at', 'wallet_tx_created_index');
        });

        // Check constraint to ensure balance_after is never negative
        if (config('database.default') === 'mysql') {
            DB::statement('ALTER TABLE wallet_transactions ADD CONSTRAINT chk_wallet_tx_balance CHECK (balance_after >= 0)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
