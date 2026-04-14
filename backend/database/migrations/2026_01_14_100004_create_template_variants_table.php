<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the template_variants table - different design options for templates.
     * Uses UUID for consistency with other tables.
     */
    public function up(): void
    {
        Schema::create('template_variants', function (Blueprint $table) {
            // Primary Key - UUID for consistency
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Template Relationship
            $table->uuid('template_id')->comment('FK to templates table');

            // Multilingual Names
            $table->string('name_ar')->comment('Variant name in Arabic');
            $table->string('name_en')->nullable()->comment('Variant name in English');

            // Design Assets
            $table->string('design_image')->comment('Preview image for this variant');
            $table->string('background_image')->nullable()->comment('Background image for interactive editor');

            // Display
            $table->unsignedSmallInteger('sort_order')->default(0)->comment('Display order');
            $table->boolean('is_default')->default(false)->comment('Default variant for this template');

            // Status
            $table->boolean('is_active')->default(true)->comment('Variant visibility status');

            // System Timestamps
            $table->timestamps();

            // Foreign Key
            $table->foreign('template_id')
                  ->references('id')
                  ->on('templates')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            // Performance Indexes
            $table->index('template_id', 'template_variants_template_index');
            $table->index(['template_id', 'is_default'], 'template_variants_default_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_variants');
    }
};
