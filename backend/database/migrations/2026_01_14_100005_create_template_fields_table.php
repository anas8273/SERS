<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the template_fields table - defines editable fields for interactive templates.
     * Fields are linked to template variants for variant-specific positioning.
     * Uses UUID for consistency with other tables.
     */
    public function up(): void
    {
        Schema::create('template_fields', function (Blueprint $table) {
            // Primary Key - UUID for consistency
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Relationships
            $table->uuid('template_id')->comment('FK to templates table');
            $table->uuid('variant_id')->nullable()->comment('FK to template_variants (null = applies to all variants)');

            // Field Identification
            $table->string('name', 50)->comment('Field name for programming (snake_case)');
            $table->string('label_ar')->comment('Field label in Arabic');
            $table->string('label_en')->comment('Field label in English');

            // Field Type
            $table->enum('type', ['text', 'textarea', 'date', 'image', 'signature', 'qrcode', 'barcode', 'select', 'checkbox', 'number'])
                  ->default('text')
                  ->comment('Input field type');

            // For Select Fields
            $table->json('options')->nullable()->comment('Options for select/checkbox fields');

            // Positioning on Canvas (for interactive editor)
            $table->integer('position_x')->default(0)->comment('X position on canvas');
            $table->integer('position_y')->default(0)->comment('Y position on canvas');
            $table->unsignedInteger('width')->default(200)->comment('Field width in pixels');
            $table->unsignedInteger('height')->default(40)->comment('Field height in pixels');

            // Styling
            $table->unsignedSmallInteger('font_size')->default(14)->comment('Font size in pixels');
            $table->string('font_family', 50)->default('Cairo')->comment('Font family name');
            $table->string('color', 20)->default('#000000')->comment('Text color (hex)');
            $table->string('background_color', 20)->nullable()->comment('Background color (hex)');
            $table->enum('text_align', ['right', 'left', 'center'])->default('right')->comment('Text alignment');
            $table->boolean('is_bold')->default(false)->comment('Bold text');
            $table->boolean('is_italic')->default(false)->comment('Italic text');

            // Validation
            $table->boolean('is_required')->default(false)->comment('Field is required');
            $table->unsignedSmallInteger('min_length')->nullable()->comment('Minimum text length');
            $table->unsignedSmallInteger('max_length')->nullable()->comment('Maximum text length');
            $table->string('validation_regex')->nullable()->comment('Custom validation regex');
            $table->string('validation_message')->nullable()->comment('Custom validation error message');

            // Default & Placeholder
            $table->string('default_value')->nullable()->comment('Default field value');
            $table->string('placeholder_ar')->nullable()->comment('Placeholder text in Arabic');
            $table->string('placeholder_en')->nullable()->comment('Placeholder text in English');

            // Display Order
            $table->unsignedSmallInteger('sort_order')->default(0)->comment('Display order in form');

            // AI Support
            $table->boolean('ai_fillable')->default(false)->comment('Can be filled by AI');
            $table->string('ai_prompt_hint')->nullable()->comment('Hint for AI to fill this field');

            // System Timestamps
            $table->timestamps();

            // Foreign Keys
            $table->foreign('template_id')
                  ->references('id')
                  ->on('templates')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            $table->foreign('variant_id')
                  ->references('id')
                  ->on('template_variants')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            // Performance Indexes
            $table->index('template_id', 'template_fields_template_index');
            $table->index('variant_id', 'template_fields_variant_index');
            $table->index(['template_id', 'sort_order'], 'template_fields_order_index');

            // Unique constraint: field name must be unique per template
            $table->unique(['template_id', 'name'], 'template_fields_unique_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_fields');
    }
};
