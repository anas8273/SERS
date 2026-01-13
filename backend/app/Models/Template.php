<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'type',
        'format',
        'is_active',
        'is_featured',
        'price',
        'thumbnail',
        'ready_file',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'price' => 'decimal:2',
    ];

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
        return $this->hasOneThrough(Section::class, Category::class, 'id', 'id', 'category_id', 'section_id');
    }

    /**
     * Get the variants for the template.
     */
    public function variants()
    {
        return $this->hasMany(TemplateVariant::class);
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
        return $this->hasMany(TemplateField::class)->orderBy('order');
    }

    /**
     * Get the user data for the template.
     */
    public function userData()
    {
        return $this->hasMany(UserTemplateData::class);
    }

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
}
