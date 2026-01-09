<?php
// app/Models/Outbox.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Outbox Model
 * 
 * Implements the Transactional Outbox Pattern for reliable event processing.
 * Used for asynchronous Firestore synchronization with retry support.
 * 
 * @property string $id UUID primary key
 * @property string $event_type Event type (e.g., order.completed, record.created)
 * @property string $aggregate_type Entity type (e.g., Order, Product)
 * @property string $aggregate_id Related entity UUID
 * @property array $payload Event data to be synchronized
 * @property string $status Processing status (pending|processing|completed|failed)
 * @property int $attempts Processing attempts count
 * @property int $max_attempts Maximum retry attempts
 * @property string|null $last_error Last processing error message
 * @property \DateTime|null $processed_at When event was successfully processed
 * @property \DateTime|null $next_retry_at Scheduled retry timestamp
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 */
class Outbox extends Model
{
    use HasFactory, HasUuids;

    /**
     * The table associated with the model.
     */
    protected $table = 'outbox';

    /**
     * Status constants.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    /**
     * Default max attempts.
     */
    public const DEFAULT_MAX_ATTEMPTS = 5;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'event_type',
        'aggregate_type',
        'aggregate_id',
        'payload',
        'status',
        'attempts',
        'max_attempts',
        'last_error',
        'processed_at',
        'next_retry_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'payload' => 'array',
        'attempts' => 'integer',
        'max_attempts' => 'integer',
        'processed_at' => 'datetime',
        'next_retry_at' => 'datetime',
    ];

    // ==================== STATIC METHODS ====================

    /**
     * Dispatch a new event to the outbox.
     * Creates a pending outbox entry for later processing.
     */
    public static function dispatch(string $eventType, string $aggregateType, string $aggregateId, array $payload): self
    {
        return self::create([
            'event_type' => $eventType,
            'aggregate_type' => $aggregateType,
            'aggregate_id' => $aggregateId,
            'payload' => $payload,
            'status' => self::STATUS_PENDING,
            'max_attempts' => self::DEFAULT_MAX_ATTEMPTS,
        ]);
    }

    // ==================== INSTANCE METHODS ====================

    /**
     * Mark event as currently being processed.
     */
    public function markAsProcessing(): void
    {
        $this->update(['status' => self::STATUS_PROCESSING]);
    }

    /**
     * Mark event as successfully completed.
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'processed_at' => now(),
            'last_error' => null,
        ]);
    }

    /**
     * Mark event as failed with exponential backoff retry.
     */
    public function markAsFailed(string $error): void
    {
        $this->increment('attempts');
        
        // Exponential backoff: 2^attempts minutes (2, 4, 8, 16, 32...)
        $nextRetry = now()->addMinutes(pow(2, $this->attempts));
        
        $this->update([
            'status' => $this->attempts >= $this->max_attempts 
                ? self::STATUS_FAILED 
                : self::STATUS_PENDING,
            'last_error' => $error,
            'next_retry_at' => $nextRetry,
        ]);
    }

    /**
     * Reset for manual retry.
     */
    public function resetForRetry(): void
    {
        $this->update([
            'status' => self::STATUS_PENDING,
            'attempts' => 0,
            'last_error' => null,
            'next_retry_at' => null,
        ]);
    }

    // ==================== SCOPES ====================

    /**
     * Scope to get pending events ready for processing.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING)
                     ->where(function ($q) {
                         $q->whereNull('next_retry_at')
                           ->orWhere('next_retry_at', '<=', now());
                     });
    }

    /**
     * Scope to get completed events.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope to get permanently failed events.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    /**
     * Scope to get events currently being processed.
     */
    public function scopeProcessing($query)
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    /**
     * Scope to filter by event type.
     */
    public function scopeOfEventType($query, string $type)
    {
        return $query->where('event_type', $type);
    }

    /**
     * Scope to filter by aggregate.
     */
    public function scopeForAggregate($query, string $type, string $id)
    {
        return $query->where('aggregate_type', $type)
                     ->where('aggregate_id', $id);
    }

    /**
     * Scope to order by oldest first (FIFO processing).
     */
    public function scopeOldestFirst($query)
    {
        return $query->orderBy('created_at', 'asc');
    }

    // ==================== ACCESSORS ====================

    /**
     * Check if event can be retried.
     */
    public function getCanRetryAttribute(): bool
    {
        return $this->attempts < $this->max_attempts;
    }

    /**
     * Check if event has permanently failed.
     */
    public function getHasFailedPermanentlyAttribute(): bool
    {
        return $this->status === self::STATUS_FAILED 
            && $this->attempts >= $this->max_attempts;
    }

    /**
     * Get retry count remaining.
     */
    public function getRetriesRemainingAttribute(): int
    {
        return max(0, $this->max_attempts - $this->attempts);
    }
}