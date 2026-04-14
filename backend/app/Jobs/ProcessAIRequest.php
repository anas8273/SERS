<?php

namespace App\Jobs;

use App\Services\AIService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * ProcessAIRequest — Queued AI generation job.
 *
 * [E-02] Allows heavy AI calls (Groq API, 3-15s each) to run asynchronously
 * instead of blocking the HTTP request. The result is stored in cache and
 * the frontend polls for completion.
 *
 * Usage:
 *   $jobId = Str::uuid();
 *   ProcessAIRequest::dispatch($jobId, $prompt, $options);
 *   // Frontend polls: GET /api/ai/jobs/{jobId}
 *
 * Result keys in cache:
 *   ai_job:{jobId}:status  → 'pending'|'processing'|'completed'|'failed'
 *   ai_job:{jobId}:result  → JSON string of the result
 *   ai_job:{jobId}:error   → Error message if failed
 */
class ProcessAIRequest implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of retry attempts.
     */
    public int $tries = 2;

    /**
     * Timeout in seconds (AI calls can be slow).
     */
    public int $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public readonly string $jobId,
        public readonly string $prompt,
        public readonly bool $jsonMode = false,
        public readonly string $model = 'llama-3.3-70b-versatile',
    ) {}

    /**
     * Execute the job.
     */
    public function handle(AIService $aiService): void
    {
        $cachePrefix = "ai_job:{$this->jobId}";

        try {
            Cache::put("{$cachePrefix}:status", 'processing', 600);

            $result = $aiService->call($this->prompt, $this->jsonMode);

            Cache::put("{$cachePrefix}:status", 'completed', 600);
            Cache::put("{$cachePrefix}:result", is_array($result) ? json_encode($result) : $result, 600);

            Log::info('ProcessAIRequest completed', [
                'job_id' => $this->jobId,
                'prompt_length' => strlen($this->prompt),
            ]);
        } catch (\Throwable $e) {
            Cache::put("{$cachePrefix}:status", 'failed', 600);
            Cache::put("{$cachePrefix}:error", $e->getMessage(), 600);

            Log::error('ProcessAIRequest failed', [
                'job_id' => $this->jobId,
                'error'  => $e->getMessage(),
            ]);

            throw $e; // Re-throw for retry mechanism
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(?\Throwable $exception): void
    {
        $cachePrefix = "ai_job:{$this->jobId}";
        Cache::put("{$cachePrefix}:status", 'failed', 600);
        Cache::put("{$cachePrefix}:error", $exception?->getMessage() ?? 'Unknown error', 600);

        Log::error('ProcessAIRequest permanently failed', [
            'job_id' => $this->jobId,
            'error'  => $exception?->getMessage(),
        ]);
    }
}
