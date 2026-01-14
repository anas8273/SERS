<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the template_data_versions table - version history for user template data.
     * Uses UUID for consistency with other tables.
     */
    public function up(): void
    {
        Schema::create('template_data_versions', function (Blueprint $table) {
            // Primary Key - UUID for consistency
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Relationship
            $table->uuid('user_template_data_id')->comment('FK to user_template_data table');

            // Version Number
            $table->unsignedInteger('version_number')->default(1)->comment('Auto-incrementing version number');

            // Snapshot Data
            $table->json('data')->comment('Snapshot of field values at this version');

            // Change Information
            $table->string('note')->nullable()->comment('User note about this version');
            $table->enum('change_type', ['manual', 'auto_save', 'ai_fill', 'import'])
                  ->default('manual')
                  ->comment('How this version was created');

            // Metadata
            $table->string('ip_address', 45)->nullable()->comment('IP address when saved');
            $table->string('user_agent')->nullable()->comment('Browser/device info');

            // Timestamp
            $table->timestamp('created_at')->useCurrent()->comment('When this version was created');

            // Foreign Key
            $table->foreign('user_template_data_id')
                  ->references('id')
                  ->on('user_template_data')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            // Performance Indexes
            $table->index('user_template_data_id', 'versions_data_index');
            $table->index(['user_template_data_id', 'version_number'], 'versions_number_index');
            $table->index(['user_template_data_id', 'created_at'], 'versions_timeline_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_data_versions');
    }
};
