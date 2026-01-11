<?php
// app/Models/Coupon.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

/**
 * Coupon Model
 * 
 * Represents a discount coupon that can be applied to orders.
 * Supports percentage and fixed discounts with usage limits.
 * 
 * @property string $id UUID primary key
 * @property string $code Unique coupon code
 * @property string|null $description_ar Arabic description
 * @property string|null $description_en English description
 * @property string $discount_type 'percentage' or 'fixed'
 * @property float $discount_value Discount amount
 * @property float|null $max_discount Max discount for percentage type
 * @property float $min_order_amount Minimum order amount required
 * @property int|null $max_uses Maximum total uses
 * @property int $used_count Current usage count
 * @property int|null $max_uses_per_user Max uses per user
 * @property \DateTime|null $starts_at Validity start date
 * @property \DateTime|null $expires_at Validity end date
 * @property bool $is_active Coupon status
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 * @property \DateTime|null $deleted_at Soft delete timestamp
 */
class Coupon extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * Discount type constants.
     */
    public const TYPE_PERCENTAGE = 'percentage';
    public const TYPE_FIXED = 'fixed';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'code',
        'description_ar',
        'description_en',
        'discount_type',
        'discount_value',
        'max_discount',
        'min_order_amount',
        'max_uses',
        'used_count',
        'max_uses_per_user',
        'starts_at',
        'expires_at',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'discount_value' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'max_uses' => 'integer',
        'used_count' => 'integer',
        'max_uses_per_user' => 'integer',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get all usages of this coupon.
     */
    public function usages()
    {
        return $this->hasMany(CouponUsage::class);
    }

    // ==================== SCOPES ====================

    /**
     * Scope to filter only active coupons.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter valid coupons (active, within date range, not exceeded usage).
     */
    public function scopeValid($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('starts_at')
                  ->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', now());
            })
            ->where(function ($q) {
                $q->whereNull('max_uses')
                  ->orWhereColumn('used_count', '<', 'max_uses');
            });
    }

    // ==================== VALIDATION METHODS ====================

    /**
     * Check if coupon is currently valid.
     */
    public function isValid(): bool
    {
        // Must be active
        if (!$this->is_active) {
            return false;
        }

        // Check date range
        $now = now();
        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }
        if ($this->expires_at && $now->gt($this->expires_at)) {
            return false;
        }

        // Check total usage limit
        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            return false;
        }

        return true;
    }

    /**
     * Check if user can use this coupon.
     */
    public function canBeUsedBy(string $userId): bool
    {
        if (!$this->isValid()) {
            return false;
        }

        // Check per-user usage limit
        if ($this->max_uses_per_user !== null) {
            $userUsageCount = $this->usages()->where('user_id', $userId)->count();
            if ($userUsageCount >= $this->max_uses_per_user) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if coupon applies to order amount.
     */
    public function appliesTo(float $orderAmount): bool
    {
        return $orderAmount >= $this->min_order_amount;
    }

    /**
     * Calculate discount amount for a given order total.
     */
    public function calculateDiscount(float $orderTotal): float
    {
        if (!$this->appliesTo($orderTotal)) {
            return 0;
        }

        if ($this->discount_type === self::TYPE_PERCENTAGE) {
            $discount = $orderTotal * ($this->discount_value / 100);
            
            // Apply max discount cap if set
            if ($this->max_discount !== null && $discount > $this->max_discount) {
                $discount = $this->max_discount;
            }
        } else {
            // Fixed discount
            $discount = min($this->discount_value, $orderTotal);
        }

        return round($discount, 2);
    }

    /**
     * Record usage of this coupon.
     */
    public function recordUsage(string $userId, string $orderId, float $discountAmount): CouponUsage
    {
        $this->increment('used_count');

        return $this->usages()->create([
            'user_id' => $userId,
            'order_id' => $orderId,
            'discount_amount' => $discountAmount,
        ]);
    }

    // ==================== ACCESSORS ====================

    /**
     * Get localized description.
     */
    public function getDescriptionAttribute(): ?string
    {
        return app()->getLocale() === 'ar' ? $this->description_ar : $this->description_en;
    }

    /**
     * Get formatted discount display.
     */
    public function getFormattedDiscountAttribute(): string
    {
        if ($this->discount_type === self::TYPE_PERCENTAGE) {
            return $this->discount_value . '%';
        }
        return number_format($this->discount_value, 2) . ' ر.س';
    }
}
