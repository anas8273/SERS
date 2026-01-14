<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Section Model
 * 
 * Represents top-level grouping for categories.
 * Uses UUID as primary key for consistency across the system.
 */
class Section extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name_ar',
        'name_en',
        'slug',
        'description_ar',
        'description_en',
        'icon',
        'color',
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
     * Get the categories for the section.
     */
    public function categories()
    {
        return $this->hasMany(Category::class)->orderBy('sort_order');
    }

    /**
     * Get root categories (no parent) for the section.
     */
    public function rootCategories()
    {
        return $this->hasMany(Category::class)
                    ->whereNull('parent_id')
                    ->orderBy('sort_order');
    }

    /**
     * Get all templates through categories.
     */
    public function templates()
    {
        return $this->hasManyThrough(Template::class, Category::class);
    }

    /**
     * Get active templates through categories.
     */
    public function activeTemplates()
    {
        return $this->hasManyThrough(Template::class, Category::class)
                    ->where('templates.is_active', true);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get templates count.
     */
    public function getTemplatesCountAttribute(): int
    {
        return $this->templates()->count();
    }

    /**
     * Get categories count.
     */
    public function getCategoriesCountAttribute(): int
    {
        return $this->categories()->count();
    }

    // ==================== SCOPES ====================

    /**
     * Scope a query to only include active sections.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to order by sort_order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
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
}
