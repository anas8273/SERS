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
 * Stores a snapshot of product details at purchase time.
 * Tracks Firestore sync status for interactive products.
 * 
 * @property string $id UUID primary key
 * @property string $order_id FK to orders
 * @property string $product_id FK to products
 * @property float $price Price paid at time of purchase
 * @property string $product_name Product name at time of purchase
 * @property string $product_type Product type at purchase (downloadable|interactive)
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
        'product_id',
        'price',
        'product_name',
        'product_type',
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
     * Get the product for this item.
     * FK: order_items.product_id -> products.id (RESTRICT on delete)
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
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
        return $query->where('product_type', 'interactive');
    }

    /**
     * Scope to filter downloadable items.
     */
    public function scopeDownloadable($query)
    {
        return $query->where('product_type', 'downloadable');
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
     * Check if item needs sync (interactive products only).
     */
    public function getNeedsSyncAttribute(): bool
    {
        return $this->product_type === 'interactive' && !$this->is_synced;
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