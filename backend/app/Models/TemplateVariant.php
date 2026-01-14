<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * TemplateVariant Model
 * 
 * Represents different design options for templates.
 * Uses UUID as primary key for consistency across the system.
 */
class TemplateVariant extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'template_id',
        'name_ar',
        'name_en',
        'design_image',
        'background_image',
        'sort_order',
        'is_default',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the template that owns the variant.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Get the fields specific to this variant.
     */
    public function fields(): HasMany
    {
        return $this->hasMany(TemplateField::class, 'variant_id')->orderBy('sort_order');
    }

    /**
     * Get the user data using this variant.
     */
    public function userData(): HasMany
    {
        return $this->hasMany(UserTemplateData::class, 'variant_id');
    }

    // ==================== ACCESSORS ====================

    /**
     * Get the localized name based on app locale.
     */
    public function getNameAttribute(): string
    {
        return app()->getLocale() === 'ar' ? $this->name_ar : ($this->name_en ?? $this->name_ar);
    }

    /**
     * Get the full URL for the design image.
     */
    public function getDesignImageUrlAttribute(): string
    {
        return $this->design_image 
            ? asset('storage/' . $this->design_image) 
            : '';
    }

    /**
     * Get the full URL for the background image.
     */
    public function getBackgroundImageUrlAttribute(): string
    {
        return $this->background_image 
            ? asset('storage/' . $this->background_image) 
            : '';
    }

    // ==================== SCOPES ====================

    /**
     * Scope a query to only include active variants.
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

    // ==================== HELPER METHODS ====================

    /**
     * Set this variant as the default for its template.
     */
    public function setAsDefault(): void
    {
        // Remove default from other variants
        self::where('template_id', $this->template_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);
        
        // Set this as default
        $this->update(['is_default' => true]);
    }
}
