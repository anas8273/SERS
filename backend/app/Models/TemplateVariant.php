<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'name_ar',
        'name_en',
        'design_image',
        'background_image',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    /**
     * Get the template that owns the variant.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Get the user data using this variant.
     */
    public function userData(): HasMany
    {
        return $this->hasMany(UserTemplateData::class, 'variant_id');
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
}
