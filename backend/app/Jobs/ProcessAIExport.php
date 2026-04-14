<?php
// app/Jobs/ProcessAIExport.php

namespace App\Jobs;

use App\Models\AIRequestLog;
use App\Services\AIService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * ProcessAIExport — Queued Job for Heavy AI Operations
 *
 * Dispatched for AI operations that are too slow for a synchronous HTTP request:
 * - Performance report generation
 * - Achievement document generation
 * - Curriculum generation
 *
 * Usage:
 *   ProcessAIExport::dispatch($userId, 'generate-performance-report', $prompt, $templateId);
 *
 * When QUEUE_CONNECTION=sync (default/local), this runs immediately (no worker needed).
 * When QUEUE_CONNECTION=database or redis, this runs in background via `php artisan queue:work`.
 *
 * [NOTE] The current implementation is intentionally simple.
 * Adding a notification/webhook system to inform users of completion is a future step.
 */
class ProcessAIExport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Number of times the job may be attempted */
    public int $tries = 2;

    /** Timeout in seconds for each attempt */
    public int $timeout = 120;

    /** Delay before marking as failed (backoff) */
    public array $backoff = [30, 60];

    public function __construct(
        private readonly int $userId,
        private readonly string $action,
        private readonly string $prompt,
        private readonly ?int $templateId = null,
        private readonly string $locale = 'ar',
    ) {}

    public function handle(AIService $aiService): void
    {
        $startTime = microtime(true);

        try {
            $result = $aiService->call(
                prompt: $this->prompt,
                action: $this->action,
                userId: $this->userId,
                templateId: $this->templateId,
            );

            Log::info('ProcessAIExport completed', [
                'user_id'    => $this->userId,
                'action'     => $this->action,
                'latency_ms' => (int) ((microtime(true) - $startTime) * 1000),
            ]);
        } catch (\Throwable $e) {
            Log::error('ProcessAIExport failed', [
                'user_id' => $this->userId,
                'action'  => $this->action,
                'error'   => $e->getMessage(),
            ]);

            // Re-throw so the queue worker knows this job failed
            throw $e;
        }
    }
}
