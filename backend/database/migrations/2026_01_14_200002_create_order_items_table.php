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
     * Includes template snapshot (price/name at purchase time) and Firestore sync tracking.
     * Updated to use templates instead of products.
     */
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            // Primary Key
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Relationships
            $table->uuid('order_id')->comment('FK to orders table');
            $table->uuid('template_id')->comment('FK to templates table');

            // Snapshot of Template at Purchase Time (Immutable - preserves historical data)
            $table->decimal('price', 10, 2)->unsigned()->comment('Price paid at time of purchase');
            $table->string('template_name')->comment('Template name at time of purchase');
            $table->enum('template_type', ['ready', 'interactive'])->comment('Template type at purchase');

            // Firestore Sync (Interactive Templates)
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

            $table->foreign('template_id')
                  ->references('id')
                  ->on('templates')
                  ->restrictOnDelete() // Prevent deletion of templates that have been purchased
                  ->cascadeOnUpdate();

            // Unique Constraint - Prevent duplicate template in same order
            $table->unique(['order_id', 'template_id'], 'order_items_unique_template');

            // Performance Indexes
            $table->index('order_id', 'order_items_order_index');
            $table->index('template_id', 'order_items_template_index');
            
            // Sync management indexes (for background job processing)
            $table->index('sync_status', 'order_items_sync_status_index');
            $table->index(['sync_status', 'sync_attempts'], 'order_items_sync_retry_index');
            $table->index('firestore_record_id', 'order_items_firestore_index');

            // Time-based sync processing queue
            $table->index(['sync_status', 'created_at'], 'order_items_sync_queue_index');
            
            // Template type for batch processing (e.g., process all interactive items)
            $table->index('template_type', 'order_items_type_index');
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
