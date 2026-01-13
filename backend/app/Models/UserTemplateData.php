<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserTemplateData extends Model
{
    use HasFactory;

    protected $table = 'user_template_data';

    protected $fillable = [
        'user_id',
        'template_id',
        'variant_id',
        'title',
        'data',
        'status',
        'is_paid',
        'exported_file',
    ];

    protected $casts = [
        'data' => 'array',
        'is_paid' => 'boolean',
    ];

    /**
     * Get the user that owns the data.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the template.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Get the selected variant.
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(TemplateVariant::class, 'variant_id');
    }

    /**
     * Get the version history.
     */
    public function versions(): HasMany
    {
        return $this->hasMany(TemplateDataVersion::class, 'user_template_data_id')
            ->orderBy('created_at', 'desc');
    }

    /**
     * Get the evidences attached to this template data.
     */
    public function evidences(): HasMany
    {
        return $this->hasMany(Evidence::class, 'user_template_data_id');
    }

    /**
     * Check if data is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if data is draft.
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Create a new version.
     */
    public function saveVersion(?string $note = null): TemplateDataVersion
    {
        return $this->versions()->create([
            'data' => $this->data,
            'note' => $note,
        ]);
    }

    /**
     * Restore from a specific version.
     */
    public function restoreFromVersion(TemplateDataVersion $version): bool
    {
        $this->data = $version->data;
        return $this->save();
    }

    /**
     * Scope a query to only include drafts.
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Scope a query to only include completed.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}
