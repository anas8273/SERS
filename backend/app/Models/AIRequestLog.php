<?php
// app/Models/AIRequestLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * AIRequestLog
 *
 * Persists every AI API call for admin metrics and abuse detection.
 *
 * [BUG-01 FIX] user_id and template_id are now typed as ?string (UUID, char 36)
 * instead of the previous ?int — which silently cast UUIDs to 0, making
 * every log row useless for per-user analytics.
 *
 * @property int         $id
 * @property string|null $user_id     UUID — char(36), matches users.id (HasUuids)
 * @property string      $action
 * @property string|null $template_id UUID — char(36), matches templates.id (HasUuids)
 * @property bool        $success
 * @property string|null $error_code
 * @property int|null    $latency_ms
 * @property int|null    $input_tokens
 * @property int|null    $output_tokens
 * @property string|null $model
 * @property string|null $locale
 * @property string|null $ip_address
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class AIRequestLog extends Model
{
    protected $table = 'ai_request_logs';

    protected $fillable = [
        'user_id',
        'action',
        'template_id',
        'success',
        'error_code',
        'latency_ms',
        'input_tokens',
        'output_tokens',
        'model',
        'locale',
        'ip_address',
    ];

    protected $casts = [
        'success'       => 'boolean',
        'latency_ms'    => 'integer',
        'input_tokens'  => 'integer',
        'output_tokens' => 'integer',
    ];

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    // ──────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────

    /** Only successful requests */
    public function scopeSuccessful($query)
    {
        return $query->where('success', true);
    }

    /** Only failed requests */
    public function scopeFailed($query)
    {
        return $query->where('success', false);
    }

    /** Requests in the last N days */
    public function scopeLastDays($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // ──────────────────────────────────────────────
    // Static helpers for clean logging
    // ──────────────────────────────────────────────

    /**
     * Log a successful AI request.
     *
     * @param string|null $userId    UUID of the authenticated user (null for guests)
     * @param string      $action    Action label, e.g. 'suggest', 'fill-all', 'chat'
     * @param string|null $templateId UUID of the related template (optional)
     *
     * Usage:
     *   AIRequestLog::logSuccess($userId, 'suggest', latency: 432, model: 'llama-3.3-70b-versatile');
     */
    public static function logSuccess(
        ?string $userId,
        string  $action,
        int     $latencyMs    = 0,
        ?string $templateId   = null,
        ?int    $inputTokens  = null,
        ?int    $outputTokens = null,
        ?string $model        = null,
        ?string $locale       = null,
        ?string $ipAddress    = null,
    ): self {
        return self::create([
            'user_id'       => $userId,
            'action'        => $action,
            'template_id'   => $templateId,
            'success'       => true,
            'latency_ms'    => $latencyMs,
            'input_tokens'  => $inputTokens,
            'output_tokens' => $outputTokens,
            'model'         => $model,
            'locale'        => $locale,
            'ip_address'    => $ipAddress,
        ]);
    }

    /**
     * Log a failed AI request.
     *
     * @param string|null $userId UUID of the authenticated user (null for guests)
     *
     * Usage:
     *   AIRequestLog::logFailure($userId, 'chat', 'rate_limit');
     */
    public static function logFailure(
        ?string $userId,
        string  $action,
        string  $errorCode  = 'unknown',
        int     $latencyMs  = 0,
        ?string $model      = null,
        ?string $ipAddress  = null,
    ): self {
        return self::create([
            'user_id'    => $userId,
            'action'     => $action,
            'success'    => false,
            'error_code' => $errorCode,
            'latency_ms' => $latencyMs,
            'model'      => $model,
            'ip_address' => $ipAddress,
        ]);
    }
}
