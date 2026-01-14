<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TemplateField Model
 * 
 * Represents editable fields for interactive templates.
 * Uses UUID as primary key for consistency across the system.
 */
class TemplateField extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'template_id',
        'variant_id',
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
        'background_color',
        'text_align',
        'is_bold',
        'is_italic',
        'is_required',
        'min_length',
        'max_length',
        'validation_regex',
        'validation_message',
        'default_value',
        'placeholder_ar',
        'placeholder_en',
        'sort_order',
        'ai_fillable',
        'ai_prompt_hint',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
        'is_bold' => 'boolean',
        'is_italic' => 'boolean',
        'ai_fillable' => 'boolean',
        'position_x' => 'integer',
        'position_y' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'font_size' => 'integer',
        'min_length' => 'integer',
        'max_length' => 'integer',
        'sort_order' => 'integer',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the template that owns the field.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Get the variant that owns the field (optional).
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(TemplateVariant::class, 'variant_id');
    }

    // ==================== ACCESSORS ====================

    /**
     * Get the localized label based on app locale.
     */
    public function getLabelAttribute(): string
    {
        return app()->getLocale() === 'ar' ? $this->label_ar : $this->label_en;
    }

    /**
     * Get the localized placeholder based on app locale.
     */
    public function getPlaceholderAttribute(): ?string
    {
        return app()->getLocale() === 'ar' ? $this->placeholder_ar : $this->placeholder_en;
    }

    /**
     * Get the CSS style for this field.
     */
    public function getCssStyleAttribute(): array
    {
        $style = [
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

        if ($this->background_color) {
            $style['backgroundColor'] = $this->background_color;
        }

        if ($this->is_bold) {
            $style['fontWeight'] = 'bold';
        }

        if ($this->is_italic) {
            $style['fontStyle'] = 'italic';
        }

        return $style;
    }

    // ==================== SCOPES ====================

    /**
     * Scope a query to order by sort_order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Scope a query to only include required fields.
     */
    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    /**
     * Scope a query to only include AI-fillable fields.
     */
    public function scopeAiFillable($query)
    {
        return $query->where('ai_fillable', true);
    }

    /**
     * Scope a query to filter by type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check if this field supports AI assistance.
     */
    public function hasAiSupport(): bool
    {
        return $this->ai_fillable && !empty($this->ai_prompt_hint);
    }

    /**
     * Check if field is a text type.
     */
    public function isTextType(): bool
    {
        return in_array($this->type, ['text', 'textarea', 'number']);
    }

    /**
     * Check if field is an image type.
     */
    public function isImageType(): bool
    {
        return in_array($this->type, ['image', 'signature']);
    }

    /**
     * Check if field is a code type (QR/barcode).
     */
    public function isCodeType(): bool
    {
        return in_array($this->type, ['qrcode', 'barcode']);
    }

    /**
     * Check if field is a selection type.
     */
    public function isSelectionType(): bool
    {
        return in_array($this->type, ['select', 'checkbox']);
    }

    /**
     * Validate a value against this field's rules.
     */
    public function validateValue($value): array
    {
        $errors = [];

        // Required check
        if ($this->is_required && empty($value)) {
            $errors[] = $this->validation_message ?? 'هذا الحقل مطلوب';
            return $errors;
        }

        // Skip further validation if empty and not required
        if (empty($value)) {
            return $errors;
        }

        // Length checks for text types
        if ($this->isTextType()) {
            $length = mb_strlen($value);

            if ($this->min_length && $length < $this->min_length) {
                $errors[] = "الحد الأدنى للأحرف هو {$this->min_length}";
            }

            if ($this->max_length && $length > $this->max_length) {
                $errors[] = "الحد الأقصى للأحرف هو {$this->max_length}";
            }
        }

        // Regex validation
        if ($this->validation_regex && !preg_match($this->validation_regex, $value)) {
            $errors[] = $this->validation_message ?? 'القيمة غير صالحة';
        }

        return $errors;
    }
}
