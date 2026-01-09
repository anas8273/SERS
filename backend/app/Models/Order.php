<?php
// app/Models/Order.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Order Model
 * 
 * Represents a customer purchase order containing multiple items.
 * Tracks payment status, financials, and order lifecycle.
 * 
 * @property string $id UUID primary key
 * @property string $order_number Human-readable order number
 * @property string $user_id FK to users
 * @property float $subtotal Sum of items before discounts
 * @property float $discount Total discount applied
 * @property float $tax Tax amount
 * @property float $total Final order total
 * @property string $status Order status (pending|processing|completed|failed|refunded|cancelled)
 * @property string|null $payment_method Payment gateway (stripe|paypal|wallet)
 * @property string|null $payment_id External payment transaction ID
 * @property array|null $payment_details Payment gateway response data
 * @property \DateTime|null $paid_at Payment confirmation timestamp
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 * @property \DateTime|null $deleted_at Soft delete timestamp
 */
class Order extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * Valid order status values.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Valid payment methods.
     */
    public const PAYMENT_STRIPE = 'stripe';
    public const PAYMENT_PAYPAL = 'paypal';
    public const PAYMENT_WALLET = 'wallet';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'order_number',
        'user_id',
        'subtotal',
        'discount',
        'tax',
        'total',
        'status',
        'payment_method',
        'payment_id',
        'payment_details',
        'paid_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'payment_details' => 'array',
        'paid_at' => 'datetime',
    ];

    // ==================== BOOT ====================

    /**
     * Bootstrap the model.
     * Auto-generate order number on creation.
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = 'ORD-' . date('Y') . '-' . strtoupper(uniqid());
            }
        });
    }

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the user who placed this order.
     * FK: orders.user_id -> users.id (CASCADE on delete)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all items in this order.
     * FK: order_items.order_id -> orders.id (CASCADE on delete)
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get all reviews associated with this order.
     * FK: reviews.order_id -> orders.id (RESTRICT on delete)
     */
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get library entries created from this order.
     * FK: user_libraries.order_id -> orders.id (RESTRICT on delete)
     */
    public function libraryEntries()
    {
        return $this->hasMany(UserLibrary::class);
    }

    /**
     * Get wallet transactions related to this order.
     * Polymorphic reference via reference_id and reference_type.
     */
    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class, 'reference_id')
                    ->where('reference_type', 'Order');
    }

    // ==================== METHODS ====================

    /**
     * Mark order as paid.
     */
    public function markAsPaid(string $paymentId, string $paymentMethod, array $details = []): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'payment_id' => $paymentId,
            'payment_method' => $paymentMethod,
            'payment_details' => $details,
            'paid_at' => now(),
        ]);
    }

    /**
     * Mark order as failed.
     */
    public function markAsFailed(string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'payment_details' => array_merge($this->payment_details ?? [], [
                'failure_reason' => $reason,
                'failed_at' => now()->toISOString(),
            ]),
        ]);
    }

    /**
     * Mark order as processing.
     */
    public function markAsProcessing(): void
    {
        $this->update(['status' => self::STATUS_PROCESSING]);
    }

    /**
     * Mark order as refunded.
     */
    public function markAsRefunded(): void
    {
        $this->update(['status' => self::STATUS_REFUNDED]);
    }

    /**
     * Mark order as cancelled.
     */
    public function markAsCancelled(): void
    {
        $this->update(['status' => self::STATUS_CANCELLED]);
    }

    // ==================== SCOPES ====================

    /**
     * Scope to filter completed orders.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope to filter pending orders.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope to filter processing orders.
     */
    public function scopeProcessing($query)
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    /**
     * Scope to filter failed orders.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    /**
     * Scope to filter by payment method.
     */
    public function scopeByPaymentMethod($query, string $method)
    {
        return $query->where('payment_method', $method);
    }

    /**
     * Scope to filter orders in date range.
     */
    public function scopeCreatedBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    // ==================== ACCESSORS ====================

    /**
     * Check if order is paid.
     */
    public function getIsPaidAttribute(): bool
    {
        return $this->status === self::STATUS_COMPLETED && !is_null($this->paid_at);
    }

    /**
     * Check if order can be refunded.
     */
    public function getIsRefundableAttribute(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }
}