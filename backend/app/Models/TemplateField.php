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
        'options',
        'position_x',
        'position_y',
        'width',
        'height',
        'font_size',
        'font_family',
        'color',
        'text_align',
        'is_required',
        'default_value',
        'ai_prompt',
        'order',
    ];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
        'position_x' => 'integer',
        'position_y' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'font_size' => 'integer',
        'order' => 'integer',
    ];

    /**
     * Get the template that owns the field.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Get the localized label based on app locale.
     */
    public function getLabelAttribute(): string
    {
        return app()->getLocale() === 'ar' ? $this->label_ar : $this->label_en;
    }

    /**
     * Check if this field supports AI assistance.
     */
    public function hasAiSupport(): bool
    {
        return !empty($this->ai_prompt);
    }

    /**
     * Check if field is a text type.
     */
    public function isTextType(): bool
    {
        return in_array($this->type, ['text', 'textarea']);
    }

    /**
     * Check if field is an image type.
     */
    public function isImageType(): bool
    {
        return in_array($this->type, ['image', 'signature']);
    }

    /**
     * Check if field is a QR code type.
     */
    public function isQRCodeType(): bool
    {
        return $this->type === 'qrcode';
    }

    /**
     * Get the CSS style for this field.
     */
    public function getCssStyleAttribute(): array
    {
        return [
            'position' => 'absolute',
            'left' => $this->position_x . 'px',
            'top' => $this->position_y . 'px',
            'width' => $this->width . 'px',
            'height' => $this->height . 'px',
            'fontSize' => $this->font_size . 'px',
            'color' => $this->color,
            'fontFamily' => $this->font_family,
            'textAlign' => $this->text_align,
        ];
    }
}
