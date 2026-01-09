<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the jobs, job_batches, and failed_jobs tables for Laravel's queue system.
     * Optimized with performance indexes for job processing and monitoring.
     */
    public function up(): void
    {
        Schema::create('jobs', function (Blueprint $table) {
            // Primary Key
            $table->bigIncrements('id')->comment('Auto-incrementing job ID');
            
            // Queue Information
            $table->string('queue')->index()->comment('Queue name for job routing');
            
            // Job Data
            $table->longText('payload')->comment('Serialized job payload');
            $table->unsignedTinyInteger('attempts')->comment('Number of job attempts');
            
            // Timing - Unix timestamps for job scheduling
            $table->unsignedInteger('reserved_at')->nullable()->comment('When job was reserved by worker');
            $table->unsignedInteger('available_at')->comment('When job becomes available');
            $table->unsignedInteger('created_at')->comment('When job was created');

            // Composite Index - For efficient job fetching
            $table->index(['queue', 'available_at'], 'jobs_queue_available_index');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            // Primary Key
            $table->string('id')->primary()->comment('Unique batch identifier');
            
            // Batch Information
            $table->string('name')->comment('Human-readable batch name');
            
            // Job Counters
            $table->unsignedInteger('total_jobs')->comment('Total jobs in batch');
            $table->unsignedInteger('pending_jobs')->comment('Remaining pending jobs');
            $table->unsignedInteger('failed_jobs')->default(0)->comment('Count of failed jobs');
            
            // Failed Job Details
            $table->longText('failed_job_ids')->comment('JSON array of failed job IDs');
            
            // Batch Options
            $table->mediumText('options')->nullable()->comment('Serialized batch options');
            
            // Timing - Unix timestamps
            $table->unsignedInteger('cancelled_at')->nullable()->comment('When batch was cancelled');
            $table->unsignedInteger('created_at')->comment('When batch was created');
            $table->unsignedInteger('finished_at')->nullable()->comment('When batch completed');

            // Performance Indexes
            $table->index('created_at', 'job_batches_created_index');
            $table->index('finished_at', 'job_batches_finished_index');
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            // Primary Key
            $table->id()->comment('Auto-incrementing failed job ID');
            
            // Unique Identifier
            $table->string('uuid')->unique()->comment('UUID for failed job identification');
            
            // Connection Information
            $table->text('connection')->comment('Queue connection that failed');
            $table->text('queue')->comment('Queue name where job failed');
            
            // Job Data
            $table->longText('payload')->comment('Original job payload');
            $table->longText('exception')->comment('Exception that caused failure');
            
            // Timing
            $table->timestamp('failed_at')->useCurrent()->comment('When job failed');

            // Performance Indexes - For monitoring and retry operations
            $table->index('failed_at', 'failed_jobs_failed_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('failed_jobs');
    }
};