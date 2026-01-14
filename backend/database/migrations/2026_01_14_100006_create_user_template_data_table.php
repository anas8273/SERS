<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the user_template_data table - stores user's filled template data.
     * Uses UUID for consistency with other tables.
     */
    public function up(): void
    {
        Schema::create('user_template_data', function (Blueprint $table) {
            // Primary Key - UUID for consistency
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Relationships
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->uuid('template_id')->comment('FK to templates table');
            $table->uuid('variant_id')->comment('FK to template_variants table');

            // User's Custom Title
            $table->string('title')->nullable()->comment('User-defined title for this filled template');

            // Field Data (JSON)
            $table->json('data')->comment('Filled field values as JSON');

            // Status
            $table->enum('status', ['draft', 'completed', 'exported'])->default('draft')
                  ->comment('draft = in progress, completed = all fields filled, exported = PDF generated');

            // Export Information
            $table->string('exported_file')->nullable()->comment('Path to exported file (PDF, etc.)');
            $table->timestamp('exported_at')->nullable()->comment('When the file was exported');

            // Firestore Reference (for real-time collaboration)
            $table->string('firestore_doc_id')->nullable()->comment('Firestore document ID for real-time sync');

            // System Timestamps
            $table->timestamps();
            $table->softDeletes();

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
            $table->index('user_id', 'user_template_data_user_index');
            $table->index('template_id', 'user_template_data_template_index');
            $table->index('status', 'user_template_data_status_index');
            $table->index(['user_id', 'status'], 'user_template_data_user_status_index');
            $table->index(['user_id', 'created_at'], 'user_template_data_user_recent_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_template_data');
    }
};
