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
        'instance_name',
        'field_values',
        'status',
        'is_paid',
        'exported_file_path',
    ];

    protected $casts = [
        'field_values' => 'array',
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
        return $this->belongsTo(InteractiveTemplate::class, 'template_id');
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
            ->orderBy('version_number', 'desc');
    }

    /**
     * Get the evidences attached to this template data.
     */
    public function evidences(): HasMany
    {
        return $this->hasMany(Evidence::class, 'user_template_data_id');
    }

    /**
     * Create a new version.
     */
    public function createVersion(string $changeSummary = null): TemplateDataVersion
    {
        $latestVersion = $this->versions()->max('version_number') ?? 0;

        return $this->versions()->create([
            'version_number' => $latestVersion + 1,
            'field_values' => $this->field_values,
            'change_summary' => $changeSummary,
        ]);
    }

    /**
     * Restore from a specific version.
     */
    public function restoreVersion(int $versionNumber): bool
    {
        $version = $this->versions()->where('version_number', $versionNumber)->first();

        if (!$version) {
            return false;
        }

        $this->update(['field_values' => $version->field_values]);
        return true;
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
