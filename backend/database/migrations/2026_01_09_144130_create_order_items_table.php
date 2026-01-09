<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the order_items table for individual items within an order.
     * Includes product snapshot (price/name at purchase time) and Firestore sync tracking.
     * Optimized with indexes for sync queue management and order lookups.
     */
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            // Primary Key
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Relationships
            $table->uuid('order_id')->comment('FK to orders table');
            $table->uuid('product_id')->comment('FK to products table');

            // Snapshot of Product at Purchase Time (Immutable - preserves historical data)
            $table->decimal('price', 10, 2)->unsigned()->comment('Price paid at time of purchase');
            $table->string('product_name')->comment('Product name at time of purchase');
            $table->enum('product_type', ['downloadable', 'interactive'])->comment('Product type at purchase');

            // Firestore Sync (Interactive Products)
            $table->string('firestore_record_id', 255)->nullable()->comment('Firestore document ID after sync');
            $table->enum('sync_status', ['pending', 'synced', 'failed'])->default('pending')->comment('Firestore sync status');
            $table->unsignedTinyInteger('sync_attempts')->default(0)->comment('Number of sync attempts (max 255)');
            $table->text('sync_error')->nullable()->comment('Last sync error message for debugging');

            // System Timestamps
            $table->timestamps();

            // Foreign Keys
            $table->foreign('order_id')
                  ->references('id')
                  ->on('orders')
                  ->cascadeOnDelete()
                  ->cascadeOnUpdate();

            $table->foreign('product_id')
                  ->references('id')
                  ->on('products')
                  ->restrictOnDelete() // Prevent deletion of products that have been purchased
                  ->cascadeOnUpdate();

            // Unique Constraint - Prevent duplicate product in same order
            $table->unique(['order_id', 'product_id'], 'order_items_unique_product');

            // Performance Indexes
            $table->index('order_id', 'order_items_order_index');
            $table->index('product_id', 'order_items_product_index');
            
            // Sync management indexes (for background job processing)
            $table->index('sync_status', 'order_items_sync_status_index');
            $table->index(['sync_status', 'sync_attempts'], 'order_items_sync_retry_index');
            $table->index('firestore_record_id', 'order_items_firestore_index');

            // Time-based sync processing queue
            $table->index(['sync_status', 'created_at'], 'order_items_sync_queue_index');
            
            // Product type for batch processing (e.g., process all interactive items)
            $table->index('product_type', 'order_items_type_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
