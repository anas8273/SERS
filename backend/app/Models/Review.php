<?php
// app/Models/Review.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Review Model
 * 
 * Represents a product review submitted by a user after purchase.
 * Links to user, product, and order for purchase verification.
 * 
 * @property string $id UUID primary key
 * @property string $user_id FK to users (reviewer)
 * @property string $product_id FK to products (reviewed product)
 * @property string $order_id FK to orders (purchase verification)
 * @property int $rating Rating 1-5 stars
 * @property string|null $comment User review text
 * @property bool $is_approved Admin approval status
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 * @property \DateTime|null $deleted_at Soft delete timestamp
 */
class Review extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'product_id',
        'order_id',
        'rating',
        'comment',
        'is_approved',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'rating' => 'integer',
        'is_approved' => 'boolean',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the user who wrote this review.
     * FK: reviews.user_id -> users.id (RESTRICT on delete)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the product being reviewed.
     * FK: reviews.product_id -> products.id (RESTRICT on delete)
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the order associated with this review.
     * FK: reviews.order_id -> orders.id (RESTRICT on delete)
     * This verifies the user actually purchased the product.
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // ==================== SCOPES ====================

    /**
     * Scope to filter only approved reviews.
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    /**
     * Scope to filter pending (unapproved) reviews.
     */
    public function scopePending($query)
    {
        return $query->where('is_approved', false);
    }

    /**
     * Scope to filter by rating.
     */
    public function scopeWithRating($query, int $rating)
    {
        return $query->where('rating', $rating);
    }

    /**
     * Scope to filter by minimum rating.
     */
    public function scopeMinRating($query, int $minRating)
    {
        return $query->where('rating', '>=', $minRating);
    }

    /**
     * Scope to order by most recent.
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    // ==================== METHODS ====================

    /**
     * Approve this review.
     */
    public function approve(): void
    {
        $this->update(['is_approved' => true]);
        
        // Recalculate product rating after approval
        $this->product->recalculateRating();
    }

    /**
     * Reject (unapprove) this review.
     */
    public function reject(): void
    {
        $this->update(['is_approved' => false]);
        
        // Recalculate product rating after rejection
        $this->product->recalculateRating();
    }

    // ==================== BOOT ====================

    /**
     * Bootstrap the model.
     * Recalculate product rating on create/update/delete.
     */
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($review) {
            if ($review->is_approved) {
                $review->product->recalculateRating();
            }
        });

        static::deleted(function ($review) {
            $review->product->recalculateRating();
        });
    }
}