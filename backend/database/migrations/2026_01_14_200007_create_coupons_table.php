<?php
// database/migrations/2026_01_11_000002_create_coupons_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Coupons Migration
 * 
 * Creates the coupons table for discount code management.
 * Supports percentage and fixed discounts with usage limits and expiry.
 * 
 * Features:
 *   - Percentage or fixed amount discounts
 *   - Minimum order amount requirement
 *   - Maximum discount cap (for percentage)
 *   - Usage limits (total and per user)
 *   - Date range validity
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            // ==================== PRIMARY KEY ====================
            $table->uuid('id')->primary();

            // ==================== COUPON DETAILS ====================
            // Unique coupon code (e.g., WELCOME10, SAVE20)
            $table->string('code', 50)->unique();
            
            // Human-readable description
            $table->string('description_ar')->nullable();
            $table->string('description_en')->nullable();
            
            // Discount type: 'percentage' or 'fixed'
            $table->enum('discount_type', ['percentage', 'fixed'])->default('percentage');
            
            // Discount value (percentage 0-100 or fixed amount in SAR)
            $table->decimal('discount_value', 10, 2);
            
            // Maximum discount amount (for percentage coupons)
            $table->decimal('max_discount', 10, 2)->nullable();
            
            // Minimum order amount required to use coupon
            $table->decimal('min_order_amount', 10, 2)->default(0);

            // ==================== USAGE LIMITS ====================
            // Maximum number of times this coupon can be used (null = unlimited)
            $table->unsignedInteger('max_uses')->nullable();
            
            // Current usage count
            $table->unsignedInteger('used_count')->default(0);
            
            // Maximum uses per user (null = unlimited per user)
            $table->unsignedInteger('max_uses_per_user')->nullable();

            // ==================== VALIDITY DATES ====================
            // Coupon validity period
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            // ==================== STATUS ====================
            $table->boolean('is_active')->default(true);

            // ==================== TIMESTAMPS ====================
            $table->timestamps();
            $table->softDeletes();

            // ==================== INDEXES ====================
            $table->index('code', 'coupon_code_index');
            $table->index('is_active', 'coupon_active_index');
            $table->index(['starts_at', 'expires_at'], 'coupon_validity_index');
        });

        // ==================== COUPON USAGE TRACKING ====================
        // Track which user used which coupon on which order
        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            $table->foreignUuid('coupon_id')
                  ->constrained('coupons')
                  ->cascadeOnDelete();
            
            $table->foreignUuid('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            
            $table->foreignUuid('order_id')
                  ->constrained('orders')
                  ->cascadeOnDelete();
            
            // Discount amount applied
            $table->decimal('discount_amount', 10, 2);
            
            $table->timestamps();

            // User can use same coupon on multiple orders (if allowed)
            $table->index(['coupon_id', 'user_id'], 'coupon_user_usage_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupon_usages');
        Schema::dropIfExists('coupons');
    }
};
