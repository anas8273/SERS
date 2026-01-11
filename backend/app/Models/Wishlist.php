<?php
// app/Models/Wishlist.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Wishlist Model
 * 
 * Represents a user's wishlist item (product they want to purchase later).
 * Acts as a pivot between users and products but with its own UUID.
 * 
 * @property string $id UUID primary key
 * @property string $user_id FK to users
 * @property string $product_id FK to products
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 */
class Wishlist extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'product_id',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the user who owns this wishlist item.
     * FK: wishlists.user_id -> users.id (CASCADE on delete)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the product in this wishlist item.
     * FK: wishlists.product_id -> products.id (CASCADE on delete)
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
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
}
