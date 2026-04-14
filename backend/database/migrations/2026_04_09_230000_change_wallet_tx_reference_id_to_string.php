<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * [L-07 FIX] Change reference_id from uuid to string(100).
 *
 * The reference_id column was originally typed as `uuid`, but it needs
 * to store non-UUID identifiers like Stripe Payment Intent IDs (pi_xxx).
 * This migration widens it to string(100) to accommodate all formats.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->string('reference_id', 100)->nullable()->comment('Related entity ID (UUID or Stripe PI ID)')->change();
        });
    }

    public function down(): void
    {
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->uuid('reference_id')->nullable()->comment('Related entity UUID (e.g., Order ID for purchases)')->change();
        });
    }
};
