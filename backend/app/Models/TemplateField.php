<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateField extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'name',
        'label_ar',
        'label_en',
        'type',
        'default_value',
        'placeholder_ar',
        'placeholder_en',
        'is_required',
        'pos_x',
        'pos_y',
        'width',
        'height',
        'font_size',
        'font_color',
        'font_family',
        'text_align',
        'ai_prompt',
        'sort_order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'pos_x' => 'integer',
        'pos_y' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'font_size' => 'integer',
    ];

    /**
     * Get the template that owns the field.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(InteractiveTemplate::class, 'template_id');
    }

    /**
     * Check if this field supports AI assistance.
     */
    public function hasAiSupport(): bool
    {
        return !empty($this->ai_prompt);
    }

    /**
     * Get the CSS style for this field.
     */
    public function getCssStyleAttribute(): array
    {
        return [
            'position' => 'absolute',
            'left' => $this->pos_x . 'px',
            'top' => $this->pos_y . 'px',
            'width' => $this->width . 'px',
            'height' => $this->height . 'px',
            'fontSize' => $this->font_size . 'px',
            'color' => $this->font_color,
            'fontFamily' => $this->font_family,
            'textAlign' => $this->text_align,
        ];
    }
}
