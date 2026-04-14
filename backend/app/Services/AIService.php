<?php

namespace App\Services;

use App\Models\AIRequestLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

/**
 * AIService — Unified AI API Client
 *
 * [DRY-01 FIX] This service consolidates the duplicated callOpenAI() and
 * callOpenAIChat() methods that were in AIController (80% code overlap).
 *
 * [AI-PERSIST FIX] All calls are now logged to ai_request_logs for
 * real-time admin metrics (success rate, latency, cost estimation).
 *
 * [BUG-01 FIX] $userId and $templateId are now typed ?string (UUID) —
 * previously typed ?int which silently cast UUIDs to 0 corrupting all logs.
 *
 * Usage:
 *   $service = app(AIService::class);
 *   $text = $service->call('Your prompt', action: 'suggest');
 *   $json = $service->call('...', json: true, action: 'fill-all');
 *   $chat = $service->chat($messagesArray, action: 'chat');
 */
class AIService
{
    private string $apiKey;
    private string $apiUrl;
    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key', '');

        $this->apiUrl = rtrim(
            config('services.openai.base_url', 'https://api.groq.com/openai/v1'),
            '/'
        ) . '/chat/completions';

        $this->model = config('services.openai.model', 'llama-3.3-70b-versatile');
    }

    /**
     * Call AI with a single prompt string.
     *
     * @param string      $prompt         The user prompt
     * @param bool        $json           Whether to request JSON response format
     * @param string      $systemMessage  Optional system message override
     * @param float       $temperature    Sampling temperature (0-2)
     * @param int         $maxTokens      Maximum response tokens
     * @param string      $action         Logging action label (e.g. 'suggest', 'fill-all')
     * @param string|null $userId         UUID of the authenticated user for logging
     * @param string|null $templateId     UUID of the related template for logging
     * @return string|array               Raw text or decoded JSON
     */
    public function call(
        string $prompt,
        bool $json = false,
        string $systemMessage = 'أنت مساعد تعليمي ذكي متخصص في مساعدة المعلمين والإداريين في المدارس. تجيب باللغة العربية بشكل احترافي ومفيد.',
        float $temperature = 0.7,
        int $maxTokens = 2000,
        string $action = 'call',
        ?string $userId = null,
        ?string $templateId = null,
    ): string|array {
        $messages = [
            ['role' => 'system', 'content' => $systemMessage],
            ['role' => 'user',   'content' => $prompt],
        ];

        return $this->sendRequest($messages, $json, $temperature, $maxTokens, $action, $userId, $templateId);
    }

    /**
     * Call AI with a full message array (multi-turn chat).
     *
     * @param array       $messages     Array of {role, content} messages
     * @param bool        $json         Whether to request JSON response format
     * @param float       $temperature  Sampling temperature (0-2)
     * @param int         $maxTokens    Maximum response tokens
     * @param string      $action       Logging action label
     * @param string|null $userId       UUID of the authenticated user for logging
     * @return string|array             Raw text or decoded JSON
     */
    public function chat(
        array $messages,
        bool $json = false,
        float $temperature = 0.7,
        int $maxTokens = 2000,
        string $action = 'chat',
        ?string $userId = null,
    ): string|array {
        return $this->sendRequest($messages, $json, $temperature, $maxTokens, $action, $userId);
    }

    /**
     * Core HTTP request method — single source of truth for AI API calls.
     * Logs success/failure to ai_request_logs for admin metrics.
     */
    private function sendRequest(
        array $messages,
        bool $json,
        float $temperature,
        int $maxTokens,
        string $action = 'unknown',
        ?string $userId = null,
        ?string $templateId = null,
    ): string|array {
        $fallback  = $json ? [] : 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
        $startTime = microtime(true);

        try {
            if (empty($this->apiKey)) {
                Log::error('AI API key is not configured');
                $this->persistLog($action, $userId, $templateId, false, 'missing_api_key', 0);
                return $json ? [] : 'عذراً، لم يتم إعداد مفتاح الذكاء الاصطناعي.';
            }

            $payload = [
                'model'       => $this->model,
                'messages'    => $messages,
                'temperature' => $temperature,
                'max_tokens'  => $maxTokens,
            ];

            // Only add response_format when JSON is required — Groq rejects null value
            if ($json) {
                $payload['response_format'] = ['type' => 'json_object'];
            }

            $response  = Http::timeout(30)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type'  => 'application/json',
            ])->post($this->apiUrl, $payload);

            $latencyMs = (int) ((microtime(true) - $startTime) * 1000);

            if ($response->successful()) {
                $responseJson  = $response->json();
                $content       = $responseJson['choices'][0]['message']['content'] ?? null;
                $inputTokens   = $responseJson['usage']['prompt_tokens'] ?? null;
                $outputTokens  = $responseJson['usage']['completion_tokens'] ?? null;

                // [AI-PERSIST] Log successful request with token counts
                $this->persistLog($action, $userId, $templateId, true, null, $latencyMs, $inputTokens, $outputTokens);

                if ($json) {
                    return json_decode($content, true) ?? [];
                }
                return $content ?? 'عذراً، لم يتم الحصول على رد.';
            }

            $status = $response->status();
            Log::error('AI API Error', [
                'status'   => $status,
                'url'      => $this->apiUrl,
                'response' => substr($response->body(), 0, 500),
            ]);

            // [AI-PERSIST] Map HTTP status to a readable error code
            $errorCode = match (true) {
                $status === 429       => 'rate_limit',
                $status === 401       => 'auth_error',
                $status === 403       => 'forbidden',
                $status >= 500        => 'server_error',
                default               => "http_{$status}",
            };
            $this->persistLog($action, $userId, $templateId, false, $errorCode, $latencyMs);

            if ($status === 429) {
                return $json ? [] : '⚠️ تم تجاوز حد الاستخدام. يرجى المحاولة لاحقاً.';
            }
            if ($status === 401 || $status === 403) {
                return $json ? [] : 'مفتاح الذكاء الاصطناعي غير صالح.';
            }

            return $json ? [] : 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.';

        } catch (\Exception $e) {
            $latencyMs = (int) ((microtime(true) - $startTime) * 1000);
            Log::error('AI API Exception', ['error' => $e->getMessage()]);
            $this->persistLog($action, $userId, $templateId, false, 'exception', $latencyMs);
            return $fallback;
        }
    }

    /**
     * Write a log entry to ai_request_logs.
     * Non-throwing — logging errors must never break the AI response.
     *
     * [BUG-01 FIX] All ID parameters typed as ?string to match UUID PKs.
     */
    private function persistLog(
        string  $action,
        ?string $userId,
        ?string $templateId,
        bool    $success,
        ?string $errorCode    = null,
        int     $latencyMs    = 0,
        ?int    $inputTokens  = null,
        ?int    $outputTokens = null,
    ): void {
        try {
            AIRequestLog::create([
                'user_id'       => $userId,
                'action'        => $action,
                'template_id'   => $templateId,
                'success'       => $success,
                'error_code'    => $errorCode,
                'latency_ms'    => $latencyMs,
                'input_tokens'  => $inputTokens,
                'output_tokens' => $outputTokens,
                'model'         => $this->model,
                'ip_address'    => Request::ip(),
            ]);
        } catch (\Throwable $e) {
            // Silent fail — a logging error must not affect the AI response to the user
            Log::warning('Failed to persist AI request log: ' . $e->getMessage());
        }
    }
}
