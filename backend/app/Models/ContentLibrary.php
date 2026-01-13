<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentLibrary extends Model
{
    use HasFactory;

    protected $table = 'content_library';

    protected $fillable = [
        'user_id',
        'title',
        'type',
        'content',
        'file_path',
        'is_favorite',
        'usage_count',
    ];

    protected $casts = [
        'is_favorite' => 'boolean',
        'usage_count' => 'integer',
    ];

    /**
     * Get the user that owns the content.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full URL for the file.
     */
    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? asset('storage/' . $this->file_path) : null;
    }

    /**
     * Increment usage count.
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Toggle favorite status.
     */
    public function toggleFavorite(): bool
    {
        $this->is_favorite = !$this->is_favorite;
        $this->save();
        return $this->is_favorite;
    }

    /**
     * Scope a query to only include favorites.
     */
    public function scopeFavorites($query)
    {
        return $query->where('is_favorite', true);
    }

    /**
     * Scope a query to filter by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to order by most used.
     */
    public function scopeMostUsed($query)
    {
        return $query->orderBy('usage_count', 'desc');
    }
}
