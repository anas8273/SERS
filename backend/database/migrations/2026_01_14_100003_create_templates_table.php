<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the templates table - main table for all templates.
     * Supports both 'ready' (downloadable) and 'interactive' (editable) types.
     * Uses UUID for consistency with other tables.
     */
    public function up(): void
    {
        Schema::create('templates', function (Blueprint $table) {
            // Primary Key - UUID for consistency
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Category Relationship
            $table->uuid('category_id')->comment('FK to categories table');

            // Multilingual Names
            $table->string('name_ar')->comment('Template name in Arabic');
            $table->string('name_en')->comment('Template name in English');

            // URL-friendly Identifier
            $table->string('slug', 100)->unique()->comment('URL-friendly unique identifier');

            // Multilingual Descriptions
            $table->text('description_ar')->nullable()->comment('Template description in Arabic');
            $table->text('description_en')->nullable()->comment('Template description in English');

            // Template Type
            $table->enum('type', ['ready', 'interactive'])->default('interactive')
                  ->comment('ready = downloadable file, interactive = editable template');
            $table->enum('format', ['digital', 'printable', 'both'])->default('digital')
                  ->comment('Output format type');

            // Pricing
            $table->decimal('price', 10, 2)->default(0)->comment('Template price (0 = free)');
            $table->boolean('is_free')->default(false)->comment('Quick check for free templates');

            // Display
            $table->string('thumbnail')->nullable()->comment('Preview image path');
            $table->unsignedSmallInteger('sort_order')->default(0)->comment('Display order');

            // For Ready Templates - Direct download file
            $table->string('ready_file')->nullable()->comment('Download file path for ready templates');
            $table->string('file_type', 20)->nullable()->comment('File extension (pdf, docx, etc.)');

            // Status
            $table->boolean('is_active')->default(true)->comment('Template visibility status');
            $table->boolean('is_featured')->default(false)->comment('Featured on homepage');

            // Statistics
            $table->unsignedInteger('downloads_count')->default(0)->comment('Total downloads');
            $table->unsignedInteger('uses_count')->default(0)->comment('Total uses (for interactive)');

            // System Timestamps
            $table->timestamps();
            $table->softDeletes();

            // Foreign Key
            $table->foreign('category_id')
                  ->references('id')
                  ->on('categories')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            // Performance Indexes
            $table->index('category_id', 'templates_category_index');
            $table->index('type', 'templates_type_index');
            $table->index('is_active', 'templates_active_index');
            $table->index('is_featured', 'templates_featured_index');
            $table->index(['is_active', 'sort_order'], 'templates_active_sort_index');
            $table->index(['category_id', 'is_active'], 'templates_category_active_index');

            // Full-text index for search
            $table->fullText(['name_ar', 'name_en'], 'templates_fulltext_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};
