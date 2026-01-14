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
 * Represents a template review submitted by a user after purchase.
 * Links to user, template, and order for purchase verification.
 * Updated to use templates instead of products.
 * 
 * @property string $id UUID primary key
 * @property string $user_id FK to users (reviewer)
 * @property string $template_id FK to templates (reviewed template)
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
        'template_id',
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
     * Get the template being reviewed.
     * FK: reviews.template_id -> templates.id (RESTRICT on delete)
     */
    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Get the order associated with this review.
     * FK: reviews.order_id -> orders.id (RESTRICT on delete)
     * This verifies the user actually purchased the template.
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
    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Scope to filter by template.
     */
    public function scopeForTemplate($query, $templateId)
    {
        return $query->where('template_id', $templateId);
    }

    // ==================== METHODS ====================

    /**
     * Approve this review.
     */
    public function approve(): void
    {
        $this->update(['is_approved' => true]);
    }

    /**
     * Reject (unapprove) this review.
     */
    public function reject(): void
    {
        $this->update(['is_approved' => false]);
    }
}
