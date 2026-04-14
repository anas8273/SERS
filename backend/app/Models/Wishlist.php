<?php
// app/Models/Wishlist.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Wishlist Model
 * 
 * Represents a user's wishlist item (template they want to purchase later).
 * Acts as a pivot between users and templates but with its own UUID.
 * Updated to use templates instead of products.
 * 
 * @property string $id UUID primary key
 * @property string $user_id FK to users
 * @property string $template_id FK to templates
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
        'template_id',
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
     * Get the template in this wishlist item.
     * FK: wishlists.template_id -> templates.id (CASCADE on delete)
     */
    public function template()
    {
        return $this->belongsTo(Template::class);
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

    // ==================== STATIC METHODS ====================

    /**
     * Add a template to user's wishlist.
     */
    public static function addTemplate(string $userId, string $templateId): self
    {
        return self::firstOrCreate([
            'user_id' => $userId,
            'template_id' => $templateId,
        ]);
    }

    /**
     * Remove a template from user's wishlist.
     */
    public static function removeTemplate(string $userId, string $templateId): bool
    {
        return self::where('user_id', $userId)
                   ->where('template_id', $templateId)
                   ->delete() > 0;
    }

    /**
     * Check if user has template in wishlist.
     */
    public static function hasTemplate(string $userId, string $templateId): bool
    {
        return self::where('user_id', $userId)
                   ->where('template_id', $templateId)
                   ->exists();
    }
}
