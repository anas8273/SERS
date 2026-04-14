<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * FavoriteTemplate Model
 * 
 * Represents a user's favorite template.
 * Uses UUID as primary key for consistency across the system.
 */
class FavoriteTemplate extends Model
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
     * Get the user that owns the favorite.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the template.
     */
    public function template(): BelongsTo
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
     * Add a template to user's favorites.
     */
    public static function addTemplate(string $userId, string $templateId): self
    {
        return self::firstOrCreate([
            'user_id' => $userId,
            'template_id' => $templateId,
        ]);
    }

    /**
     * Remove a template from user's favorites.
     */
    public static function removeTemplate(string $userId, string $templateId): bool
    {
        return self::where('user_id', $userId)
                   ->where('template_id', $templateId)
                   ->delete() > 0;
    }

    /**
     * Check if user has template in favorites.
     */
    public static function hasTemplate(string $userId, string $templateId): bool
    {
        return self::where('user_id', $userId)
                   ->where('template_id', $templateId)
                   ->exists();
    }

    /**
     * Toggle favorite status.
     */
    public static function toggleTemplate(string $userId, string $templateId): bool
    {
        if (self::hasTemplate($userId, $templateId)) {
            self::removeTemplate($userId, $templateId);
            return false; // Not favorited anymore
        } else {
            self::addTemplate($userId, $templateId);
            return true; // Now favorited
        }
    }
}
