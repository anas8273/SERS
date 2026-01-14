<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the sections table - top-level grouping for categories.
     * Uses UUID for consistency with other tables.
     */
    public function up(): void
    {
        Schema::create('sections', function (Blueprint $table) {
            // Primary Key - UUID for consistency
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Multilingual Names
            $table->string('name_ar')->comment('Section name in Arabic');
            $table->string('name_en')->comment('Section name in English');

            // URL-friendly Identifier
            $table->string('slug', 100)->unique()->comment('URL-friendly unique identifier');

            // Multilingual Descriptions
            $table->text('description_ar')->nullable()->comment('Section description in Arabic');
            $table->text('description_en')->nullable()->comment('Section description in English');

            // Display
            $table->string('icon', 100)->nullable()->comment('Icon class or URL');
            $table->string('color', 20)->nullable()->comment('Theme color for UI');
            $table->unsignedSmallInteger('sort_order')->default(0)->comment('Display order (0 = first)');

            // Status
            $table->boolean('is_active')->default(true)->comment('Section visibility status');

            // System Timestamps
            $table->timestamps();

            // Performance Indexes
            $table->index('is_active', 'sections_active_index');
            $table->index(['is_active', 'sort_order'], 'sections_active_sort_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
