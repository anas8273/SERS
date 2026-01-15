<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the evidences table - supporting documents/files for templates.
     * Uses UUID for consistency with other tables.
     * user_template_data_id is REQUIRED (not nullable) - evidences must be linked to a template.
     */
    public function up(): void
    {
        Schema::create('evidences', function (Blueprint $table) {
            // Primary Key - UUID for consistency
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Relationships
            $table->uuid('user_id')->comment('FK to users table');
            // REQUIRED: Evidence must be linked to a user template data
            $table->uuid('user_template_data_id')->comment('FK to user_template_data - REQUIRED');

            // Evidence Information
            $table->string('name')->comment('Evidence display name');
            $table->text('description')->nullable()->comment('Evidence description');

            // Evidence Type
            $table->enum('type', ['image', 'file', 'link', 'qrcode', 'barcode'])
                  ->default('image')
                  ->comment('Type of evidence');

            // File Information (for image/file types)
            $table->string('file_path')->nullable()->comment('Storage path for uploaded files');
            $table->string('file_name')->nullable()->comment('Original file name');
            $table->string('file_type', 50)->nullable()->comment('MIME type or extension');
            $table->unsignedInteger('file_size')->nullable()->comment('File size in bytes');

            // Link Information (for link type)
            $table->string('link', 500)->nullable()->comment('External URL');

            // QR/Barcode Information
            $table->string('qr_code')->nullable()->comment('Generated QR code image path');
            $table->string('barcode')->nullable()->comment('Generated barcode image path');
            $table->string('code_content')->nullable()->comment('Content encoded in QR/barcode');

            // Display Order
            $table->unsignedSmallInteger('sort_order')->default(0)->comment('Display order');

            // Status
            $table->boolean('is_active')->default(true)->comment('Evidence visibility status');

            // System Timestamps
            $table->timestamps();
            $table->softDeletes();

            // Foreign Keys
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
                  
            $table->foreign('user_template_data_id')
                  ->references('id')
                  ->on('user_template_data')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            // Performance Indexes
            $table->index('user_id', 'evidences_user_index');
            $table->index('user_template_data_id', 'evidences_template_data_index');
            $table->index('type', 'evidences_type_index');
            $table->index(['user_template_data_id', 'sort_order'], 'evidences_order_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evidences');
    }
};
