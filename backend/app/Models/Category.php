<?php
// app/Models/Category.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Category Model
 * 
 * Represents product categories with multilingual support and hierarchical structure.
 * Categories can have parent/child relationships for nested navigation.
 * 
 * @property string $id UUID primary key
 * @property string $name_ar Arabic name
 * @property string $name_en English name
 * @property string $slug URL-friendly unique identifier
 * @property string|null $description_ar Arabic description
 * @property string|null $description_en English description
 * @property string|null $parent_id Parent category UUID (null for root)
 * @property string|null $icon Icon class or URL
 * @property int $sort_order Display order (0 = first)
 * @property bool $is_active Category visibility status
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 */
class Category extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     * All columns from migration except id and timestamps.
     */
    protected $fillable = [
        'name_ar',
        'name_en',
        'slug',
        'description_ar',
        'description_en',
        'parent_id',
        'icon',
        'sort_order',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get all products in this category.
     * FK: products.category_id -> categories.id (CASCADE on delete)
     */
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the parent category.
     * Self-referencing FK: categories.parent_id -> categories.id (SET NULL on delete)
     */
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * Get all child categories.
     * Self-referencing relationship for subcategories.
     */
    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    /**
     * Get all descendants (children, grandchildren, etc.) recursively.
     */
    public function descendants()
    {
        return $this->children()->with('descendants');
    }

    /**
     * Get all ancestors (parent, grandparent, etc.) recursively.
     */
    public function ancestors()
    {
        return $this->parent()->with('ancestors');
    }

    // ==================== SCOPES ====================

    /**
     * Scope to filter only active categories.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only root categories (no parent).
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope to order by sort_order.
     */
    public function scopeSorted($query)
    {
        return $query->orderBy('sort_order');
    }

    // ==================== ACCESSORS ====================

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
    public function getDescriptionAttribute(): ?string
    {
        return app()->getLocale() === 'ar' ? $this->description_ar : $this->description_en;
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check if this category is a root category.
     */
    public function isRoot(): bool
    {
        return is_null($this->parent_id);
    }

    /**
     * Check if this category has children.
     */
    public function hasChildren(): bool
    {
        return $this->children()->exists();
    }

    /**
     * Get the full path of category names.
     */
    public function getPath(): array
    {
        $path = [$this->name];
        $current = $this;

        while ($current->parent) {
            $current = $current->parent;
            array_unshift($path, $current->name);
        }

        return $path;
    }
}