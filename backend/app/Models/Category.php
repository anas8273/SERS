<?php
// app/Models/Category.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Category Model
 * 
 * Represents template categories with multilingual support and hierarchical structure.
 * Categories belong to sections and can have parent/child relationships for nested navigation.
 * Uses UUID as primary key for consistency across the system.
 * 
 * @property string $id UUID primary key
 * @property string $section_id FK to sections table
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
     */
    protected $fillable = [
        'section_id',
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
     * Get the section that owns the category.
     */
    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    /**
     * Get the templates for the category.
     */
    public function templates()
    {
        return $this->hasMany(Template::class)->orderBy('sort_order');
    }

    /**
     * Get active templates for the category.
     */
    public function activeTemplates()
    {
        return $this->hasMany(Template::class)
                    ->where('is_active', true)
                    ->orderBy('sort_order');
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
        return $this->hasMany(Category::class, 'parent_id')->orderBy('sort_order');
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
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Scope to filter by section.
     */
    public function scopeInSection($query, $sectionId)
    {
        return $query->where('section_id', $sectionId);
    }

    /**
     * Scope to search by name.
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name_ar', 'like', "%{$term}%")
              ->orWhere('name_en', 'like', "%{$term}%");
        });
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

    /**
     * Get templates count.
     */
    public function getTemplatesCountAttribute(): int
    {
        return $this->templates()->count();
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
     * Check if this category has templates.
     */
    public function hasTemplates(): bool
    {
        return $this->templates()->exists();
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

    /**
     * Get breadcrumb path including section.
     */
    public function getBreadcrumb(): array
    {
        $breadcrumb = [];
        
        // Add section
        if ($this->section) {
            $breadcrumb[] = [
                'id' => $this->section->id,
                'name' => $this->section->name_ar,
                'type' => 'section',
            ];
        }
        
        // Add category path
        $path = $this->getPath();
        foreach ($path as $name) {
            $breadcrumb[] = [
                'name' => $name,
                'type' => 'category',
            ];
        }
        
        return $breadcrumb;
    }
}
