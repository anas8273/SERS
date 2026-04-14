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
     * Resolve the model for route model binding.
     * Tries slug first (frontend), then id (admin panel).
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where('slug', $value)->first()
            ?? $this->where('id', $value)->first();
    }

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'category_id',
        'section_id',
        'service_category_id',
        'name_ar',
        'slug',
        'description_ar',
        'type',
        'format',
        'price',
        'discount_price',
        'thumbnail',
        'sort_order',
        'ready_file',
        'external_link',
        'file_type',
        'is_active',
        'is_featured',
        'is_free',
        'downloads_count',
        'sales_count',
        'uses_count',
        'tags',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'is_free' => 'boolean',
        'price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'sort_order' => 'integer',
        'downloads_count' => 'integer',
        'sales_count' => 'integer',
        'uses_count' => 'integer',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'deleted_at',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = [
        'thumbnail_url',
    ];

    // ==================== ACCESSORS ====================

    /**
     * Get the full URL for the thumbnail image.
     * Returns a relative /storage/... path so the Next.js proxy can serve it.
     * If the thumbnail is already a full external URL (Firebase, S3, etc.), return as-is.
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        if (!$this->thumbnail) {
            return null;
        }

        // If already a full external URL, return as-is
        if (str_starts_with($this->thumbnail, 'http')) {
            return $this->thumbnail;
        }

        // Return relative path — Next.js rewrites /storage/* → backend/storage/*
        // This avoids CORS issues and works in both dev and production
        return '/storage/' . ltrim($this->thumbnail, '/');
    }

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the section (MySQL) that the template belongs to.
     * Uses direct section_id FK column on templates table.
     */
    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    /**
     * Get the MySQL category (deprecated — kept for backward compatibility).
     * Note: category_id now stores Firestore document IDs, not MySQL UUIDs.
     * This relationship will return null for templates with Firestore category_id.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
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
     * Get the effective price (with discount if applicable).
     */
    public function getEffectivePrice(): float
    {
        return (float) ($this->discount_price ?? $this->price ?? 0);
    }

    /**
     * Get average rating.
     * [PERF] Uses pre-loaded withAvg() data if available, avoiding N+1 queries.
     */
    public function getAverageRatingAttribute(): float
    {
        // If withAvg('approvedReviews', 'rating') was used, use the pre-computed value
        if (array_key_exists('approved_reviews_avg_rating', $this->attributes)) {
            return (float) ($this->attributes['approved_reviews_avg_rating'] ?? 0);
        }
        // Fallback: single query (only fires when accessed individually, not in lists)
        return (float) ($this->approvedReviews()->avg('rating') ?? 0);
    }

    /**
     * Get reviews count.
     * [PERF] Uses pre-loaded withCount() data if available, avoiding N+1 queries.
     */
    public function getReviewsCountAttribute(): int
    {
        // If withCount('approvedReviews') was used, use the pre-computed value
        if (array_key_exists('approved_reviews_count', $this->attributes)) {
            return (int) $this->attributes['approved_reviews_count'];
        }
        // Fallback: single query (only fires when accessed individually)
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
     * Scope a query to filter by price range.
     */
    public function scopeInPriceRange($query, $min = null, $max = null)
    {
        if ($min !== null) $query->where('price', '>=', $min);
        if ($max !== null) $query->where('price', '<=', $max);
        return $query;
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
        // Uses direct section_id FK — category relationship is deprecated (stores Firestore IDs)
        return $query->where('section_id', $sectionId);
    }

    /**
     * Scope a query to search by name.
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name_ar', 'like', "%{$term}%")
              ->orWhere('description_ar', 'like', "%{$term}%");
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
