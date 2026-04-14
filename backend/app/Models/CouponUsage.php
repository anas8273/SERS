<?php
// app/Models/CouponUsage.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * CouponUsage Model
 * 
 * Tracks individual usages of coupons by users on orders.
 * Enables per-user usage limit enforcement and usage analytics.
 * 
 * @property string $id UUID primary key
 * @property string $coupon_id FK to coupons
 * @property string $user_id FK to users
 * @property string $order_id FK to orders
 * @property float $discount_amount Discount applied
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 */
class CouponUsage extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'coupon_id',
        'user_id',
        'order_id',
        'discount_amount',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'discount_amount' => 'decimal:2',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the coupon that was used.
     */
    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    /**
     * Get the user who used the coupon.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the order where coupon was applied.
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
