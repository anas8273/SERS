<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the outbox table for event-driven architecture (Transactional Outbox Pattern).
     * Used for reliable Firestore synchronization with retry support.
     * Optimized with indexes for queue processing and retry management.
     */
    public function up(): void
    {
        Schema::create('outbox', function (Blueprint $table) {
            // Primary Key
            $table->uuid('id')->primary()->comment('UUID primary key');

            // Event Information
            $table->string('event_type', 100)->comment('Event type (e.g., order.completed, record.created)');
            $table->string('aggregate_type', 50)->comment('Entity type (e.g., Order, Product, UserLibrary)');
            $table->uuid('aggregate_id')->comment('Related entity UUID');
            $table->json('payload')->comment('Event data to be synchronized to Firestore');

            // Processing Status
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->comment('Current processing status');
            $table->unsignedTinyInteger('attempts')->default(0)->comment('Processing attempts count');
            $table->unsignedTinyInteger('max_attempts')->default(5)->comment('Maximum retry attempts before marking as failed');
            $table->text('last_error')->nullable()->comment('Last processing error message for debugging');

            // Retry & Timing
            $table->timestamp('processed_at')->nullable()->comment('When event was successfully processed');
            $table->timestamp('next_retry_at')->nullable()->comment('Scheduled retry timestamp (exponential backoff)');

            // System Timestamps
            $table->timestamps();

            // Performance Indexes
            // Primary processing queue (get pending events ordered by retry time)
            $table->index('status', 'outbox_status_index');
            $table->index(['status', 'next_retry_at'], 'outbox_retry_queue_index');
            
            // Event filtering (for debugging, monitoring specific events)
            $table->index('event_type', 'outbox_event_type_index');
            
            // Aggregate lookup (find all events for a specific entity)
            $table->index(['aggregate_type', 'aggregate_id'], 'outbox_aggregate_index');

            // Cleanup and monitoring
            $table->index('processed_at', 'outbox_processed_index');
            $table->index('created_at', 'outbox_created_index');
            
            // Retry management (find events that have exceeded attempts)
            $table->index(['status', 'attempts'], 'outbox_retry_attempts_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('outbox');
    }
};
