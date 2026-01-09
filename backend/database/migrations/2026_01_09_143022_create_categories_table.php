<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the categories table with self-referencing hierarchy support.
     * Includes multilingual name/description fields (Arabic/English).
     * Optimized with full-text search and composite sorting indexes.
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            // Primary Key - UUID for consistency
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Multilingual Names
            $table->string('name_ar')->comment('Category name in Arabic');
            $table->string('name_en')->comment('Category name in English');

            // URL-friendly Identifier
            $table->string('slug', 100)->unique()->comment('URL-friendly unique identifier');

            // Multilingual Descriptions
            $table->text('description_ar')->nullable()->comment('Category description in Arabic');
            $table->text('description_en')->nullable()->comment('Category description in English');

            // Hierarchy - Self-referencing for subcategories
            $table->uuid('parent_id')->nullable()->comment('Parent category UUID (null for root)');

            // Display
            $table->string('icon', 100)->nullable()->comment('Icon class or URL');
            $table->unsignedSmallInteger('sort_order')->default(0)->comment('Display order (0 = first)');

            // Status
            $table->boolean('is_active')->default(true)->comment('Category visibility status');

            // System Timestamps
            $table->timestamps();

            // Foreign Key - Self-referencing with cascade null on delete
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('categories')
                  ->onDelete('set null')
                  ->onUpdate('cascade');

            // Performance Indexes
            $table->index('parent_id', 'categories_parent_index');
            $table->index('is_active', 'categories_active_index');
            
            // Composite index for sorted listings (hierarchy navigation)
            $table->index(['parent_id', 'sort_order'], 'categories_hierarchy_sort_index');
            $table->index(['is_active', 'sort_order'], 'categories_active_sort_index');

            // Full-text index for search (MySQL/MariaDB) - Arabic and English names
            $table->fullText(['name_ar', 'name_en'], 'categories_fulltext_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};