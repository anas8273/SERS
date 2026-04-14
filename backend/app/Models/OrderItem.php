<?php
// app/Models/OrderItem.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * OrderItem Model
 * 
 * Represents a single item in an order.
 * Stores a snapshot of template details at purchase time.
 * Tracks Firestore sync status for interactive templates.
 * Updated to use templates instead of products.
 * 
 * @property string $id UUID primary key
 * @property string $order_id FK to orders
 * @property string $template_id FK to templates
 * @property float $price Price paid at time of purchase
 * @property string $template_name Template name at time of purchase
 * @property string $template_type Template type at purchase (ready|interactive)
 * @property string|null $firestore_record_id Firestore document ID after sync
 * @property string $sync_status Firestore sync status (pending|synced|failed)
 * @property int $sync_attempts Number of sync attempts
 * @property string|null $sync_error Last sync error message
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 */
class OrderItem extends Model
{
    use HasFactory, HasUuids;

    /**
     * Sync status constants.
     */
    public const SYNC_PENDING = 'pending';
    public const SYNC_SYNCED = 'synced';
    public const SYNC_FAILED = 'failed';

    /**
     * Maximum sync attempts before giving up.
     */
    public const MAX_SYNC_ATTEMPTS = 5;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'order_id',
        'template_id',
        'price',
        'template_name',
        'template_type',
        'firestore_record_id',
        'sync_status',
        'sync_attempts',
        'sync_error',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'price' => 'decimal:2',
        'sync_attempts' => 'integer',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the order this item belongs to.
     * FK: order_items.order_id -> orders.id (CASCADE on delete)
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the template for this item.
     * FK: order_items.template_id -> templates.id (RESTRICT on delete)
     */
    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    // ==================== METHODS ====================

    /**
     * Mark item as synced to Firestore.
     */
    public function markAsSynced(string $firestoreRecordId): void
    {
        $this->update([
            'sync_status' => self::SYNC_SYNCED,
            'firestore_record_id' => $firestoreRecordId,
            'sync_error' => null,
        ]);
    }

    /**
     * Mark sync as failed.
     */
    public function markSyncFailed(string $error): void
    {
        $this->increment('sync_attempts');
        
        $this->update([
            'sync_status' => $this->sync_attempts >= self::MAX_SYNC_ATTEMPTS 
                ? self::SYNC_FAILED 
                : self::SYNC_PENDING,
            'sync_error' => $error,
        ]);
    }

    /**
     * Reset sync status for retry.
     */
    public function resetSync(): void
    {
        $this->update([
            'sync_status' => self::SYNC_PENDING,
            'sync_attempts' => 0,
            'sync_error' => null,
        ]);
    }

    // ==================== SCOPES ====================

    /**
     * Scope to get items pending sync (pending or failed with retries remaining).
     */
    public function scopePendingSync($query)
    {
        return $query->where(function ($q) {
            $q->where('sync_status', self::SYNC_PENDING)
              ->orWhere(function ($sub) {
                  $sub->where('sync_status', self::SYNC_FAILED)
                      ->where('sync_attempts', '<', self::MAX_SYNC_ATTEMPTS);
              });
        });
    }

    /**
     * Scope to get successfully synced items.
     */
    public function scopeSynced($query)
    {
        return $query->where('sync_status', self::SYNC_SYNCED);
    }

    /**
     * Scope to get permanently failed items.
     */
    public function scopeFailedPermanently($query)
    {
        return $query->where('sync_status', self::SYNC_FAILED)
                     ->where('sync_attempts', '>=', self::MAX_SYNC_ATTEMPTS);
    }

    /**
     * Scope to filter interactive items.
     */
    public function scopeInteractive($query)
    {
        return $query->where('template_type', 'interactive');
    }

    /**
     * Scope to filter ready (downloadable) items.
     */
    public function scopeReady($query)
    {
        return $query->where('template_type', 'ready');
    }

    // ==================== ACCESSORS ====================

    /**
     * Check if item is synced.
     */
    public function getIsSyncedAttribute(): bool
    {
        return $this->sync_status === self::SYNC_SYNCED;
    }

    /**
     * Check if item needs sync (interactive templates only).
     */
    public function getNeedsSyncAttribute(): bool
    {
        return $this->template_type === 'interactive' && !$this->is_synced;
    }

    /**
     * Check if sync has permanently failed.
     */
    public function getHasFailedPermanentlyAttribute(): bool
    {
        return $this->sync_status === self::SYNC_FAILED 
            && $this->sync_attempts >= self::MAX_SYNC_ATTEMPTS;
    }
}
