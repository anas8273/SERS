<?php
// app/Models/UserLibrary.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * UserLibrary Model
 * 
 * Represents a user's digital library of purchased products.
 * Links users to their owned products with purchase tracking.
 * 
 * @property string $id UUID primary key
 * @property string $user_id FK to users (library owner)
 * @property string $product_id FK to products (owned product)
 * @property string $order_id FK to orders (purchase record)
 * @property \DateTime $purchased_at When the purchase was confirmed
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 */
class UserLibrary extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'product_id',
        'order_id',
        'purchased_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'purchased_at' => 'datetime',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the user who owns this library entry.
     * FK: user_libraries.user_id -> users.id (RESTRICT on delete)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the product in this library entry.
     * FK: user_libraries.product_id -> products.id (RESTRICT on delete)
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the order that created this library entry.
     * FK: user_libraries.order_id -> orders.id (RESTRICT on delete)
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // ==================== SCOPES ====================

    /**
     * Scope to filter by user.
     */
    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by product.
     */
    public function scopeForProduct($query, string $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope to order by most recently purchased.
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('purchased_at', 'desc');
    }

    /**
     * Scope to filter downloadable products.
     */
    public function scopeDownloadable($query)
    {
        return $query->whereHas('product', function ($q) {
            $q->where('type', 'downloadable');
        });
    }

    /**
     * Scope to filter interactive products.
     */
    public function scopeInteractive($query)
    {
        return $query->whereHas('product', function ($q) {
            $q->where('type', 'interactive');
        });
    }

    /**
     * Scope to filter purchases in date range.
     */
    public function scopePurchasedBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('purchased_at', [$startDate, $endDate]);
    }

    // ==================== STATIC METHODS ====================

    /**
     * Add a product to a user's library from an order.
     */
    public static function addProduct(string $userId, string $productId, string $orderId): self
    {
        return self::firstOrCreate(
            [
                'user_id' => $userId,
                'product_id' => $productId,
            ],
            [
                'order_id' => $orderId,
                'purchased_at' => now(),
            ]
        );
    }

    /**
     * Check if user owns a product.
     */
    public static function userOwnsProduct(string $userId, string $productId): bool
    {
        return self::where('user_id', $userId)
                   ->where('product_id', $productId)
                   ->exists();
    }
}