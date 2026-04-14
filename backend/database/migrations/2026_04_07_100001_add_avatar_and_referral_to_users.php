<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Add avatar_url, referral_code, referred_by to users table.
 * 
 * Split into simple addColumn operations without FK constraints
 * to avoid table locking issues.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Only add columns that don't exist yet
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'avatar_url')) {
                $table->string('avatar_url', 500)->nullable()->after('phone')
                      ->comment('Profile picture URL');
            }

            if (!Schema::hasColumn('users', 'referral_code')) {
                $table->string('referral_code', 20)->nullable()->after('avatar_url')
                      ->comment('Unique referral code (e.g. SERSAB1234)');
            }

            if (!Schema::hasColumn('users', 'referred_by')) {
                $table->string('referred_by', 36)->nullable()->after('referral_code')
                      ->comment('UUID of the user who referred this user');
            }
        });

        // Add unique index for referral_code if it doesn't exist
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('referral_code', 'users_referral_code_unique');
                $table->index('referred_by', 'users_referred_by_index');
            });
        } catch (\Exception $e) {
            // Indexes may already exist — continue
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            try {
                $table->dropUnique('users_referral_code_unique');
            } catch (\Exception $e) {}
            try {
                $table->dropIndex('users_referred_by_index');
            } catch (\Exception $e) {}

            $cols = ['avatar_url', 'referral_code', 'referred_by'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
