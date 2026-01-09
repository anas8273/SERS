<?php
// app/Models/Product.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

/**
 * Product Model
 * 
 * Represents educational products (downloadable or interactive).
 * Supports multilingual content, file storage, and educational metadata.
 * 
 * @property string $id UUID primary key
 * @property string $name_ar Arabic product name
 * @property string $name_en English product name
 * @property string $slug URL-friendly unique identifier
 * @property string $description_ar Arabic description
 * @property string $description_en English description
 * @property float $price Original price (SAR)
 * @property float|null $discount_price Discounted price
 * @property string $type Product type (downloadable|interactive)
 * @property string $category_id FK to categories
 * @property string|null $thumbnail_url Product thumbnail URL
 * @property array|null $preview_images JSON array of preview image URLs
 * @property string|null $file_path Internal storage path (secure)
 * @property string|null $file_name Original filename for download
 * @property int|null $file_size File size in bytes
 * @property array|null $template_structure JSON template for interactive products
 * @property string|null $educational_stage Target educational stage
 * @property string|null $subject Subject/topic area
 * @property array|null $tags JSON array of searchable tags
 * @property int $downloads_count Total download count
 * @property float $average_rating Cached average rating (0.00-5.00)
 * @property int $reviews_count Cached review count
 * @property bool $is_featured Show in featured section
 * @property bool $is_active Product visibility status
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 * @property \DateTime|null $deleted_at Soft delete timestamp
 */
class Product extends Model
{
    use HasFactory, HasUuids, SoftDeletes, Searchable;

    /**
     * The attributes that are mass assignable.
     * Matches all migration columns that should be fillable.
     * Note: file_path, file_name, file_size match migration (not file_url)
     */
    protected $fillable = [
        'name_ar',
        'name_en',
        'slug',
        'description_ar',
        'description_en',
        'price',
        'discount_price',
        'type',
        'category_id',
        'thumbnail_url',
        'preview_images',
        'file_path',        // Internal storage path (secure)
        'file_name',        // Original filename for download
        'file_size',        // File size in bytes
        'template_structure',
        'educational_stage',
        'subject',
        'tags',
        'downloads_count',
        'average_rating',
        'reviews_count',
        'is_featured',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     * Ensures proper type handling for all column types.
     */
    protected $casts = [
        'price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'preview_images' => 'array',
        'template_structure' => 'array',
        'tags' => 'array',
        'file_size' => 'integer',
        'downloads_count' => 'integer',
        'average_rating' => 'decimal:2',
        'reviews_count' => 'integer',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * The attributes that should be hidden from arrays.
     * Security: Never expose internal file paths.
     */
    protected $hidden = [
        'file_path',
    ];

    // ==================== SCOUT SEARCH ====================

    /**
     * Get the indexable data array for MeiliSearch.
     */
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,
            'category_id' => $this->category_id,
            'type' => $this->type,
            'price' => (float) $this->price,
            'discount_price' => $this->discount_price ? (float) $this->discount_price : null,
            'educational_stage' => $this->educational_stage,
            'subject' => $this->subject,
            'tags' => $this->tags,
            'average_rating' => (float) $this->average_rating,
            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
        ];
    }

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the category this product belongs to.
     * FK: products.category_id -> categories.id (CASCADE on delete)
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get all order items containing this product.
     * FK: order_items.product_id -> products.id (RESTRICT on delete)
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get all reviews for this product.
     * FK: reviews.product_id -> products.id (RESTRICT on delete)
     */
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get all user library entries for this product.
     * FK: user_libraries.product_id -> products.id (RESTRICT on delete)
     */
    public function libraryEntries()
    {
        return $this->hasMany(UserLibrary::class);
    }

    /**
     * Get users who own this product through user_libraries.
     */
    public function owners()
    {
        return $this->belongsToMany(User::class, 'user_libraries')
                    ->withPivot('order_id', 'purchased_at')
                    ->withTimestamps();
    }

    // ==================== ACCESSORS ====================

    /**
     * Get the effective price (discounted if available).
     */
    public function getEffectivePriceAttribute(): float
    {
        return $this->discount_price ?? $this->price;
    }

    /**
     * Get the localized name based on app locale.
     */
    public function getNameAttribute(): string
    {
        return app()->getLocale() === 'ar' ? $this->name_ar : $this->name_en;
    }

    /**
     * Get the localized description based on app locale.
     */
    public function getDescriptionAttribute(): string
    {
        return app()->getLocale() === 'ar' ? $this->description_ar : $this->description_en;
    }

    /**
     * Check if product has a discount.
     */
    public function getHasDiscountAttribute(): bool
    {
        return !is_null($this->discount_price) && $this->discount_price < $this->price;
    }

    /**
     * Get discount percentage.
     */
    public function getDiscountPercentageAttribute(): ?float
    {
        if (!$this->has_discount) {
            return null;
        }
        return round((($this->price - $this->discount_price) / $this->price) * 100, 1);
    }

    // ==================== SCOPES ====================

    /**
     * Scope to filter only active products.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter only featured products.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope to filter interactive products.
     */
    public function scopeInteractive($query)
    {
        return $query->where('type', 'interactive');
    }

    /**
     * Scope to filter downloadable products.
     */
    public function scopeDownloadable($query)
    {
        return $query->where('type', 'downloadable');
    }

    /**
     * Scope to filter by educational stage.
     */
    public function scopeForStage($query, string $stage)
    {
        return $query->where('educational_stage', $stage);
    }

    /**
     * Scope to filter by subject.
     */
    public function scopeForSubject($query, string $subject)
    {
        return $query->where('subject', $subject);
    }

    /**
     * Scope to filter by price range.
     */
    public function scopePriceBetween($query, float $min, float $max)
    {
        return $query->whereBetween('price', [$min, $max]);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check if product is downloadable type.
     */
    public function isDownloadable(): bool
    {
        return $this->type === 'downloadable';
    }

    /**
     * Check if product is interactive type.
     */
    public function isInteractive(): bool
    {
        return $this->type === 'interactive';
    }

    /**
     * Increment download count.
     */
    public function incrementDownloads(): void
    {
        $this->increment('downloads_count');
    }

    /**
     * Recalculate and update average rating from reviews.
     */
    public function recalculateRating(): void
    {
        $stats = $this->reviews()
            ->where('is_approved', true)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as count')
            ->first();

        $this->update([
            'average_rating' => round($stats->avg_rating ?? 0, 2),
            'reviews_count' => $stats->count ?? 0,
        ]);
    }
}