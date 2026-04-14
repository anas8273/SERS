<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the reviews table for template ratings and feedback.
     * Links reviews to users, templates, and orders for purchase verification.
     * Updated to use templates instead of products.
     */
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            // Primary Key
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Relationships
            $table->uuid('user_id')->comment('FK to users (reviewer)');
            $table->uuid('template_id')->comment('FK to templates (reviewed template)');
            $table->uuid('order_id')->comment('FK to orders (purchase verification)');

            // Review Data
            $table->unsignedTinyInteger('rating')->comment('Rating 1-5 stars');
            $table->text('comment')->nullable()->comment('User review text (optional)');
            $table->boolean('is_approved')->default(true)->comment('Admin approval status for moderation');

            // System Timestamps
            $table->timestamps();
            $table->softDeletes()->comment('Soft delete timestamp');

            // Foreign Keys
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->restrictOnDelete() // Preserve reviews even if user is deleted
                  ->cascadeOnUpdate();

            $table->foreign('template_id')
                  ->references('id')
                  ->on('templates')
                  ->restrictOnDelete() // Preserve reviews even if template is deleted
                  ->cascadeOnUpdate();

            $table->foreign('order_id')
                  ->references('id')
                  ->on('orders')
                  ->restrictOnDelete() // Preserve reviews even if order is deleted
                  ->cascadeOnUpdate();

            // Unique Constraint - One review per template per order
            $table->unique(['user_id', 'template_id', 'order_id'], 'reviews_unique_per_order');

            // Performance Indexes
            // Template reviews listing (most common query)
            $table->index('template_id', 'reviews_template_index');
            $table->index(['template_id', 'is_approved'], 'reviews_template_approved_index');
            $table->index(['template_id', 'is_approved', 'created_at'], 'reviews_template_list_index');
            
            // User reviews history
            $table->index('user_id', 'reviews_user_index');
            
            // Rating analytics (average calculations, distribution charts)
            $table->index('rating', 'reviews_rating_index');
            $table->index(['template_id', 'rating'], 'reviews_template_rating_index');
            
            // Moderation workflow
            $table->index('is_approved', 'reviews_approved_index');
            
            // Time-based sorting
            $table->index('created_at', 'reviews_created_index');
            
            // Order verification lookups
            $table->index('order_id', 'reviews_order_index');

            // Soft delete optimization
            $table->index('deleted_at', 'reviews_deleted_index');
        });

        // Check constraint for rating range (1-5)
        if (config('database.default') === 'mysql') {
            DB::statement('ALTER TABLE reviews ADD CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
