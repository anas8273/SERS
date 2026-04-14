<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the personal_access_tokens table for Laravel Sanctum.
     * Optimized with indexes for token lookups, expiration, and activity monitoring.
     */
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            // Primary Key
            $table->id()->comment('Auto-incrementing token ID');
            
            // Polymorphic Relationship - Using UUID morphs for Firestore compatibility
            $table->uuidMorphs('tokenable');

            // Token Information
            $table->string('name')->comment('Human-readable token name/description');
            $table->string('token', 64)->unique()->comment('Hashed API token (SHA-256)');
            
            // Token Abilities/Scopes
            $table->text('abilities')->nullable()->comment('JSON array of token abilities/scopes');
            
            // Usage Tracking
            $table->timestamp('last_used_at')->nullable()->comment('Last API request timestamp');
            
            // Expiration
            $table->timestamp('expires_at')->nullable()->comment('Token expiration timestamp');
            
            // System Timestamps
            $table->timestamps();

            // Performance Indexes
            // Composite index for efficient tokenable lookups
            $table->index(['tokenable_type', 'tokenable_id'], 'pat_tokenable_index');
            
            // Index for token expiration cleanup jobs
            $table->index('expires_at', 'pat_expires_at_index');
            
            // Index for token activity monitoring
            $table->index('last_used_at', 'pat_last_used_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};