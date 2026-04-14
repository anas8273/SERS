<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create ai_request_logs table.
 *
 * Tracks every AI API call for:
 * - Real-time adminStats (total requests, success rate, avg latency)
 * - Cost estimation per user
 * - Abuse detection (user_id with excessive calls)
 * - Debugging failed AI requests
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_request_logs', function (Blueprint $table) {
            $table->id();

            // Who made the request — char(36) for UUID primary key compatibility (HasUuids)
            $table->char('user_id', 36)->nullable()->index();

            // What kind of AI action
            $table->string('action', 64)->index();
            // Examples: 'suggest', 'fill-all', 'chat', 'suggest-plan',
            //           'suggest-certificate', 'generate-performance-report',
            //           'generate-achievement-doc', 'generate-curriculum'

            // Linked template — char(36) for UUID primary key compatibility
            $table->char('template_id', 36)->nullable()->index();

            // AI response metadata
            $table->boolean('success')->default(true)->index();
            $table->string('error_code', 64)->nullable();  // e.g. 'rate_limit', 'timeout'
            $table->unsignedInteger('latency_ms')->nullable(); // how long the Groq call took
            $table->unsignedInteger('input_tokens')->nullable();
            $table->unsignedInteger('output_tokens')->nullable();

            // Request context
            $table->string('model', 100)->nullable();       // e.g. 'llama-3.3-70b-versatile'
            $table->string('locale', 10)->nullable();       // 'ar' | 'en'
            $table->ipAddress('ip_address')->nullable();

            $table->timestamps();

            // Composite indexes for admin dashboard queries
            $table->index(['created_at', 'success'], 'ai_logs_date_success');
            $table->index(['user_id', 'created_at'], 'ai_logs_user_date');
            $table->index(['action', 'created_at'], 'ai_logs_action_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_request_logs');
    }
};
