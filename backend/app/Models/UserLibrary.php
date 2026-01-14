<?php
// app/Models/UserLibrary.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * UserLibrary Model
 * 
 * Represents a user's digital library of purchased templates.
 * Links users to their owned templates with purchase tracking.
 * Updated to use templates instead of products.
 * 
 * @property string $id UUID primary key
 * @property string $user_id FK to users (library owner)
 * @property string $template_id FK to templates (owned template)
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
        'template_id',
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
     * Get the template in this library entry.
     * FK: user_libraries.template_id -> templates.id (RESTRICT on delete)
     */
    public function template()
    {
        return $this->belongsTo(Template::class);
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
     * Scope to filter by template.
     */
    public function scopeForTemplate($query, string $templateId)
    {
        return $query->where('template_id', $templateId);
    }

    /**
     * Scope to order by most recently purchased.
     */
    public function scopeRecent($query)
    {
        return $query->orderBy('purchased_at', 'desc');
    }

    /**
     * Scope to filter ready (downloadable) templates.
     */
    public function scopeReady($query)
    {
        return $query->whereHas('template', function ($q) {
            $q->where('type', 'ready');
        });
    }

    /**
     * Scope to filter interactive templates.
     */
    public function scopeInteractive($query)
    {
        return $query->whereHas('template', function ($q) {
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
     * Add a template to a user's library from an order.
     */
    public static function addTemplate(string $userId, string $templateId, string $orderId): self
    {
        return self::firstOrCreate(
            [
                'user_id' => $userId,
                'template_id' => $templateId,
            ],
            [
                'order_id' => $orderId,
                'purchased_at' => now(),
            ]
        );
    }

    /**
     * Check if user owns a template.
     */
    public static function userOwnsTemplate(string $userId, string $templateId): bool
    {
        return self::where('user_id', $userId)
                   ->where('template_id', $templateId)
                   ->exists();
    }
}
