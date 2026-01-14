<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Template Model
 * 
 * Represents both ready (downloadable) and interactive templates.
 * Uses UUID as primary key for consistency across the system.
 */
class Template extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'category_id',
        'name_ar',
        'name_en',
        'slug',
        'description_ar',
        'description_en',
        'type',
        'format',
        'price',
        'is_free',
        'thumbnail',
        'sort_order',
        'ready_file',
        'file_type',
        'is_active',
        'is_featured',
        'downloads_count',
        'uses_count',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'is_free' => 'boolean',
        'price' => 'decimal:2',
        'sort_order' => 'integer',
        'downloads_count' => 'integer',
        'uses_count' => 'integer',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'deleted_at',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the category that owns the template.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the section through category.
     */
    public function section()
    {
        return $this->hasOneThrough(
            Section::class,
            Category::class,
            'id',          // Foreign key on categories table
            'id',          // Foreign key on sections table
            'category_id', // Local key on templates table
            'section_id'   // Local key on categories table
        );
    }

    /**
     * Get the variants for the template.
     */
    public function variants()
    {
        return $this->hasMany(TemplateVariant::class)->orderBy('sort_order');
    }

    /**
     * Get the default variant.
     */
    public function defaultVariant()
    {
        return $this->hasOne(TemplateVariant::class)->where('is_default', true);
    }

    /**
     * Get the fields for the template (interactive only).
     */
    public function fields()
    {
        return $this->hasMany(TemplateField::class)->orderBy('sort_order');
    }

    /**
     * Get the user data for the template.
     */
    public function userData()
    {
        return $this->hasMany(UserTemplateData::class);
    }

    /**
     * Get the reviews for the template.
     */
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get approved reviews for the template.
     */
    public function approvedReviews()
    {
        return $this->hasMany(Review::class)->where('is_approved', true);
    }

    /**
     * Get the order items for the template.
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get the users who have this template in their library.
     */
    public function libraryUsers()
    {
        return $this->belongsToMany(User::class, 'user_libraries')
                    ->withPivot('purchased_at', 'order_id')
                    ->withTimestamps();
    }

    /**
     * Get the users who have wishlisted this template.
     */
    public function wishlistUsers()
    {
        return $this->belongsToMany(User::class, 'wishlists')
                    ->withTimestamps();
    }

    /**
     * Get the users who have favorited this template.
     */
    public function favoritedByUsers()
    {
        return $this->belongsToMany(User::class, 'favorite_templates')
                    ->withTimestamps();
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check if template is interactive.
     */
    public function isInteractive(): bool
    {
        return $this->type === 'interactive';
    }

    /**
     * Check if template is ready (downloadable).
     */
    public function isReady(): bool
    {
        return $this->type === 'ready';
    }

    /**
     * Check if template is free.
     */
    public function isFree(): bool
    {
        return $this->is_free || $this->price <= 0;
    }

    /**
     * Get average rating.
     */
    public function getAverageRatingAttribute(): float
    {
        return $this->approvedReviews()->avg('rating') ?? 0;
    }

    /**
     * Get reviews count.
     */
    public function getReviewsCountAttribute(): int
    {
        return $this->approvedReviews()->count();
    }

    /**
     * Increment downloads count.
     */
    public function incrementDownloads(): void
    {
        $this->increment('downloads_count');
    }

    /**
     * Increment uses count.
     */
    public function incrementUses(): void
    {
        $this->increment('uses_count');
    }

    // ==================== SCOPES ====================

    /**
     * Scope a query to only include active templates.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include featured templates.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope a query to only include interactive templates.
     */
    public function scopeInteractive($query)
    {
        return $query->where('type', 'interactive');
    }

    /**
     * Scope a query to only include ready templates.
     */
    public function scopeReady($query)
    {
        return $query->where('type', 'ready');
    }

    /**
     * Scope a query to only include free templates.
     */
    public function scopeFree($query)
    {
        return $query->where('is_free', true)->orWhere('price', '<=', 0);
    }

    /**
     * Scope a query to filter by category.
     */
    public function scopeInCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Scope a query to filter by section.
     */
    public function scopeInSection($query, $sectionId)
    {
        return $query->whereHas('category', function ($q) use ($sectionId) {
            $q->where('section_id', $sectionId);
        });
    }

    /**
     * Scope a query to search by name.
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name_ar', 'like', "%{$term}%")
              ->orWhere('name_en', 'like', "%{$term}%");
        });
    }

    /**
     * Scope a query to order by popularity.
     */
    public function scopePopular($query)
    {
        return $query->orderByDesc('downloads_count')
                     ->orderByDesc('uses_count');
    }
}
