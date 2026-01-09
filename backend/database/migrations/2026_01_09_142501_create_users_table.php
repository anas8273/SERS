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
     * Creates the users table with UUID primary key for Firestore compatibility.
     * Includes wallet balance, role-based access, and Firebase Auth integration.
     * Optimized with composite indexes and check constraints.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            // Primary Key - UUID for Firestore compatibility
            $table->uuid('id')->primary()->comment('UUID primary key for Firestore sync');

            // Authentication
            $table->string('email')->unique()->comment('User email address (unique, for login)');
            $table->string('password')->comment('Bcrypt hashed password');
            $table->timestamp('email_verified_at')->nullable()->comment('Email verification timestamp');
            $table->rememberToken()->comment('Remember me token for persistent sessions');

            // Profile Information
            $table->string('name')->comment('User display name');
            $table->string('phone', 20)->nullable()->comment('Phone number in E.164 format');

            // Authorization
            $table->enum('role', ['user', 'admin'])->default('user')->comment('User role for access control');

            // Firebase Integration
            $table->string('firebase_uid', 128)->nullable()->unique()->comment('Firebase Auth UID for frontend sync');

            // Wallet - Using unsigned decimal for non-negative balance
            $table->decimal('wallet_balance', 12, 2)->unsigned()->default(0.00)->comment('Current wallet balance (always >= 0)');

            // Status
            $table->boolean('is_active')->default(true)->comment('Account active status');

            // System Timestamps
            $table->timestamps();
            $table->softDeletes()->comment('Soft delete timestamp');

            // Performance Indexes
            // Note: Unique constraints (email, firebase_uid) already create indexes automatically
            
            // Composite index for user filtering (admin dashboards, user lists)
            $table->index(['is_active', 'role'], 'users_active_role_index');
            
            // Index for role-based queries
            $table->index('role', 'users_role_index');
            
            // Index for soft delete queries
            $table->index('deleted_at', 'users_deleted_at_index');
            
            // Index for phone lookups (if used for verification)
            $table->index('phone', 'users_phone_index');
            
            // Index for created_at (reporting, user registration trends)
            $table->index('created_at', 'users_created_at_index');
        });

        // Add check constraint for wallet_balance (MySQL 8.0.16+ / MariaDB 10.2+)
        // This ensures wallet balance can never go negative at database level
        if (config('database.default') === 'mysql') {
            DB::statement('ALTER TABLE users ADD CONSTRAINT chk_users_wallet_balance CHECK (wallet_balance >= 0)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};