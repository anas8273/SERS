<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Favorite Templates Migration
 * 
 * Creates the favorite_templates table for storing user's favorite templates.
 * Updated to use UUID and reference the unified templates table.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('favorite_templates', function (Blueprint $table) {
            // Primary Key - UUID for consistency
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Relationships
            $table->uuid('user_id')->comment('FK to users table');
            $table->uuid('template_id')->comment('FK to templates table');

            // Timestamps
            $table->timestamps();

            // Foreign Keys
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->cascadeOnDelete();

            $table->foreign('template_id')
                  ->references('id')
                  ->on('templates')
                  ->cascadeOnDelete();

            // Unique Constraint - User can only favorite a template once
            $table->unique(['user_id', 'template_id'], 'favorite_templates_unique');

            // Performance Indexes
            $table->index('user_id', 'favorite_templates_user_index');
            $table->index('template_id', 'favorite_templates_template_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favorite_templates');
    }
};
