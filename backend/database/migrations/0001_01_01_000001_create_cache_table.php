<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the cache and cache_locks tables for Laravel's cache system.
     * Optimized with expiration indexes for efficient cache cleanup.
     */
    public function up(): void
    {
        Schema::create('cache', function (Blueprint $table) {
            // Primary Key - Cache key identifier
            $table->string('key')->primary()->comment('Unique cache key identifier');
            
            // Cache Value - Using mediumText for larger cached data
            $table->mediumText('value')->comment('Serialized cache value');
            
            // Expiration - Unix timestamp for cache cleanup
            $table->integer('expiration')->comment('Unix timestamp when cache expires');

            // Performance Index - For efficient cache cleanup operations
            $table->index('expiration', 'cache_expiration_index');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            // Primary Key - Lock key identifier
            $table->string('key')->primary()->comment('Unique lock key identifier');
            
            // Owner - Process/thread that holds the lock
            $table->string('owner')->comment('Lock owner identifier (process/thread)');
            
            // Expiration - When the lock should be released
            $table->integer('expiration')->comment('Unix timestamp when lock expires');

            // Performance Index - For efficient lock cleanup
            $table->index('expiration', 'cache_locks_expiration_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cache');
        Schema::dropIfExists('cache_locks');
    }
};