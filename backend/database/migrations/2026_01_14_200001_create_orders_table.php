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
     * Creates the orders table for customer purchases.
     * Includes financials, payment tracking, and order status management.
     * Optimized with composite indexes for reporting and user order history.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            // Primary Key
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Order Identification
            $table->string('order_number', 50)->unique()->comment('Human-readable order number (e.g., ORD-2026-001234)');
            
            // Customer Relationship
            $table->uuid('user_id')->comment('FK to users table');

            // Financials (All amounts in SAR)
            $table->decimal('subtotal', 12, 2)->unsigned()->comment('Sum of items before discounts');
            $table->decimal('discount', 12, 2)->unsigned()->default(0.00)->comment('Total discount applied');
            $table->decimal('tax', 12, 2)->unsigned()->default(0.00)->comment('Tax amount (if applicable)');
            $table->decimal('total', 12, 2)->unsigned()->comment('Final order total');

            // Order Status
            $table->enum('status', [
                'pending',    // Order created, awaiting payment
                'processing', // Payment received, processing items
                'completed',  // All items delivered/synced
                'failed',     // Payment or processing failed
                'refunded',   // Order refunded
                'cancelled'   // Order cancelled
            ])->default('pending')->comment('Current order status');

            // Payment Information
            $table->enum('payment_method', ['stripe', 'paypal', 'wallet'])->nullable()->comment('Payment gateway used');
            $table->string('payment_id', 255)->nullable()->comment('External payment gateway transaction ID');
            $table->json('payment_details')->nullable()->comment('Payment gateway response data (encrypted if sensitive)');
            $table->timestamp('paid_at')->nullable()->comment('Payment confirmation timestamp');

            // System Timestamps
            $table->timestamps();
            $table->softDeletes()->comment('Soft delete timestamp');

            // Foreign Keys
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->cascadeOnDelete()
                  ->cascadeOnUpdate();

            // Performance Indexes
            // User order history (most common query)
            $table->index('user_id', 'orders_user_index');
            $table->index(['user_id', 'created_at'], 'orders_user_date_index');
            $table->index(['user_id', 'status'], 'orders_user_status_index');
            
            // Status-based queries (admin dashboard, processing queue)
            $table->index('status', 'orders_status_index');
            $table->index(['status', 'created_at'], 'orders_status_date_index');

            // Date-based queries (reporting, analytics)
            $table->index('created_at', 'orders_created_index');
            
            // Payment queries
            $table->index('paid_at', 'orders_paid_at_index');
            $table->index('payment_method', 'orders_payment_method_index');
            $table->index('payment_id', 'orders_payment_id_index');

            // Soft delete optimization
            $table->index('deleted_at', 'orders_deleted_index');
        });

        // Check constraints for data integrity
        if (config('database.default') === 'mysql') {
            DB::statement('ALTER TABLE orders ADD CONSTRAINT chk_orders_totals CHECK (total >= 0 AND subtotal >= 0 AND discount >= 0 AND tax >= 0)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
