<?php
// database/migrations/2026_01_11_000001_create_wishlists_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wishlists Migration
 * 
 * Creates the wishlists table for storing user product favorites.
 * Each user can add products to their wishlist for later purchase.
 * 
 * Relationships:
 *   - wishlists.user_id -> users.id (CASCADE on delete)
 *   - wishlists.product_id -> products.id (CASCADE on delete)
 * 
 * Unique constraint: user can only wishlist a product once
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wishlists', function (Blueprint $table) {
            // ==================== PRIMARY KEY ====================
            $table->uuid('id')->primary();

            // ==================== FOREIGN KEYS ====================
            // User who added the product to wishlist
            $table->foreignUuid('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            
            // Product added to wishlist
            $table->foreignUuid('product_id')
                  ->constrained('products')
                  ->cascadeOnDelete();

            // ==================== TIMESTAMPS ====================
            $table->timestamps();

            // ==================== INDEXES ====================
            // Ensure user can only wishlist a product once
            $table->unique(['user_id', 'product_id'], 'wishlist_user_product_unique');
            
            // Index for quick lookup by user
            $table->index('user_id', 'wishlist_user_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wishlists');
    }
};
