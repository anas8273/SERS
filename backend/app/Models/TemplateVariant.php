<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'name_ar',
        'name_en',
        'background_image_path',
        'thumbnail_path',
        'width',
        'height',
        'is_default',
        'sort_order',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'width' => 'integer',
        'height' => 'integer',
    ];

    /**
     * Get the template that owns the variant.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(InteractiveTemplate::class, 'template_id');
    }

    /**
     * Get the full URL for the background image.
     */
    public function getBackgroundImageUrlAttribute(): string
    {
        return $this->background_image_path 
            ? asset('storage/' . $this->background_image_path) 
            : '';
    }

    /**
     * Get the full URL for the thumbnail.
     */
    public function getThumbnailUrlAttribute(): string
    {
        return $this->thumbnail_path 
            ? asset('storage/' . $this->thumbnail_path) 
            : $this->background_image_url;
    }
}
