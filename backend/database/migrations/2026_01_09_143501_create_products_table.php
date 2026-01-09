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
     * Creates the products table for downloadable and interactive educational content.
     * Includes multilingual support, pricing, file storage, and educational metadata.
     * Optimized with full-text search, composite indexes, and check constraints.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            // Primary Key
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Multilingual Basic Info
            $table->string('name_ar')->comment('Product name in Arabic');
            $table->string('name_en')->comment('Product name in English');
            $table->string('slug', 150)->unique()->comment('URL-friendly unique identifier');
            $table->text('description_ar')->comment('Full description in Arabic');
            $table->text('description_en')->comment('Full description in English');

            // Pricing (SAR currency)
            $table->decimal('price', 10, 2)->unsigned()->comment('Original price (SAR)');
            $table->decimal('discount_price', 10, 2)->unsigned()->nullable()->comment('Discounted price (null if no discount)');

            // Product Type
            $table->enum('type', ['downloadable', 'interactive'])->comment('Product delivery type');

            // Category Relationship
            $table->uuid('category_id')->comment('FK to categories table');

            // Media
            $table->string('thumbnail_url', 500)->nullable()->comment('Product thumbnail image URL');
            $table->json('preview_images')->nullable()->comment('JSON array of preview image URLs');

            // Secure File Storage (Downloadable Products Only)
            $table->string('file_path', 500)->nullable()->comment('Internal storage path (never exposed to users)');
            $table->string('file_name')->nullable()->comment('Original filename for download');
            $table->unsignedBigInteger('file_size')->nullable()->comment('File size in bytes');

            // Interactive Template Data
            $table->json('template_structure')->nullable()->comment('JSON template for interactive products');

            // Educational Metadata
            $table->string('educational_stage', 50)->nullable()->comment('Target educational stage (e.g., primary, secondary)');
            $table->string('subject', 100)->nullable()->comment('Subject/topic area');
            $table->json('tags')->nullable()->comment('JSON array of searchable tags');

            // Statistics (Denormalized for Performance - Updated via events/jobs)
            $table->unsignedInteger('downloads_count')->default(0)->comment('Total download count');
            $table->decimal('average_rating', 3, 2)->unsigned()->default(0.00)->comment('Cached average rating (0.00-5.00)');
            $table->unsignedInteger('reviews_count')->default(0)->comment('Cached review count');

            // Flags
            $table->boolean('is_featured')->default(false)->comment('Show in featured products section');
            $table->boolean('is_active')->default(true)->comment('Product visibility status');

            // System Timestamps
            $table->timestamps();
            $table->softDeletes()->comment('Soft delete timestamp');

            // Foreign Keys
            $table->foreign('category_id')
                  ->references('id')
                  ->on('categories')
                  ->cascadeOnDelete()
                  ->cascadeOnUpdate();

            // Performance Indexes - Basic filtering
            $table->index('type', 'products_type_index');
            $table->index('category_id', 'products_category_index');
            $table->index('is_active', 'products_active_index');
            $table->index('is_featured', 'products_featured_index');

            // Composite indexes for common queries
            $table->index(['is_active', 'category_id'], 'products_active_category_index');
            $table->index(['is_active', 'is_featured'], 'products_active_featured_index');
            $table->index(['is_active', 'type'], 'products_active_type_index');
            $table->index(['is_active', 'created_at'], 'products_active_new_index');
            
            // Price filtering (for price range queries)
            $table->index(['is_active', 'price'], 'products_active_price_index');

            // Educational filtering
            $table->index('educational_stage', 'products_stage_index');
            $table->index('subject', 'products_subject_index');
            $table->index(['educational_stage', 'subject'], 'products_education_index');

            // Sorting indexes (for popular, top-rated)
            $table->index('average_rating', 'products_rating_index');
            $table->index('downloads_count', 'products_downloads_index');

            // Soft delete optimization
            $table->index('deleted_at', 'products_deleted_index');

            // Full-text search (MySQL/MariaDB) - Arabic and English names
            $table->fullText(['name_ar', 'name_en'], 'products_fulltext_name');
        });

        // Check constraints for data integrity (MySQL 8.0.16+ / MariaDB 10.2+)
        if (config('database.default') === 'mysql') {
            DB::statement('ALTER TABLE products ADD CONSTRAINT chk_products_rating CHECK (average_rating >= 0 AND average_rating <= 5)');
            DB::statement('ALTER TABLE products ADD CONSTRAINT chk_products_price CHECK (price >= 0)');
            DB::statement('ALTER TABLE products ADD CONSTRAINT chk_products_discount CHECK (discount_price IS NULL OR discount_price >= 0)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
