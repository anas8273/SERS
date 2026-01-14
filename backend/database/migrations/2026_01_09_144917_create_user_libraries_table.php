<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the user_libraries table for tracking purchased templates.
     * Represents a user's digital library of owned content.
     * Updated to use templates instead of products.
     */
    public function up(): void
    {
        Schema::create('user_libraries', function (Blueprint $table) {
            // Primary Key
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Relationships
            $table->uuid('user_id')->comment('FK to users (library owner)');
            $table->uuid('template_id')->comment('FK to templates (owned template)');
            $table->uuid('order_id')->comment('FK to orders (purchase record)');

            // Purchase Information
            $table->timestamp('purchased_at')->comment('When the purchase was confirmed');

            // System Timestamps
            $table->timestamps();

            // Foreign Keys
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->restrictOnDelete() // Preserve library records for deleted users
                  ->cascadeOnUpdate();

            $table->foreign('template_id')
                  ->references('id')
                  ->on('templates')
                  ->restrictOnDelete() // Prevent deletion of purchased templates
                  ->cascadeOnUpdate();

            $table->foreign('order_id')
                  ->references('id')
                  ->on('orders')
                  ->restrictOnDelete() // Preserve library records even if order is deleted
                  ->cascadeOnUpdate();

            // Unique Constraint - User can only own a template once
            $table->unique(['user_id', 'template_id'], 'user_libraries_unique_ownership');

            // Performance Indexes
            // User library listing (most common query - "My Library" page)
            $table->index('user_id', 'user_libraries_user_index');
            $table->index(['user_id', 'purchased_at'], 'user_libraries_user_time_index');
            $table->index(['user_id', 'created_at'], 'user_libraries_user_created_index');
            
            // Template ownership check (verify if user owns a template)
            $table->index('template_id', 'user_libraries_template_index');
            
            // Order-based lookups (find library items created by a specific order)
            $table->index('order_id', 'user_libraries_order_index');
            
            // Time-based sorting (recent purchases)
            $table->index('purchased_at', 'user_libraries_purchased_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_libraries');
    }
};
