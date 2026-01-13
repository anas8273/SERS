<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class InteractiveTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'thumbnail_path',
        'is_active',
        'is_free',
        'price',
        'downloads_count',
        'views_count',
        'tags',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_free' => 'boolean',
        'price' => 'decimal:2',
        'tags' => 'array',
    ];

    /**
     * Get the category that owns the template.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the variants for the template.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(TemplateVariant::class, 'template_id')->orderBy('sort_order');
    }

    /**
     * Get the fields for the template.
     */
    public function fields(): HasMany
    {
        return $this->hasMany(TemplateField::class, 'template_id')->orderBy('sort_order');
    }

    /**
     * Get the user data for the template.
     */
    public function userData(): HasMany
    {
        return $this->hasMany(UserTemplateData::class, 'template_id');
    }

    /**
     * Get the users who favorited this template.
     */
    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorite_templates', 'template_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Get the default variant.
     */
    public function defaultVariant()
    {
        return $this->variants()->where('is_default', true)->first() 
            ?? $this->variants()->first();
    }

    /**
     * Increment views count.
     */
    public function incrementViews(): void
    {
        $this->increment('views_count');
    }

    /**
     * Increment downloads count.
     */
    public function incrementDownloads(): void
    {
        $this->increment('downloads_count');
    }

    /**
     * Scope a query to only include active templates.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include free templates.
     */
    public function scopeFree($query)
    {
        return $query->where('is_free', true);
    }
}
