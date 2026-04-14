<?php
// database/migrations/2026_01_11_000001_create_wishlists_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wishlists Migration
 * 
 * Creates the wishlists table for storing templates intended for future acquisition or purchase (Purchase Intent).
 * Each user can add templates to their wishlist for later purchase consideration.
 * Updated to use templates instead of products.
 * 
 * Relationships:
 *   - wishlists.user_id -> users.id (CASCADE on delete)
 *   - wishlists.template_id -> templates.id (CASCADE on delete)
 * 
 * Unique constraint: user can only wishlist a template once
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
            // User who added the template to wishlist
            $table->uuid('user_id')->comment('FK to users table');
            
            // Template added to wishlist
            $table->uuid('template_id')->comment('FK to templates table');

            // ==================== TIMESTAMPS ====================
            $table->timestamps();

            // ==================== FOREIGN KEY CONSTRAINTS ====================
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->cascadeOnDelete();

            $table->foreign('template_id')
                  ->references('id')
                  ->on('templates')
                  ->cascadeOnDelete();

            // ==================== INDEXES ====================
            // Ensure user can only wishlist a template once
            $table->unique(['user_id', 'template_id'], 'wishlist_user_template_unique');
            
            // Index for quick lookup by user
            $table->index('user_id', 'wishlist_user_index');
            
            // Index for template popularity
            $table->index('template_id', 'wishlist_template_index');
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
