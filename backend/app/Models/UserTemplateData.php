<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * UserTemplateData Model
 * 
 * Represents user's filled template data.
 * Uses UUID as primary key for consistency across the system.
 */
class UserTemplateData extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'user_template_data';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'template_id',
        'variant_id',
        'title',
        'data',
        'status',
        'exported_file',
        'exported_at',
        'firestore_doc_id',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'data' => 'array',
        'exported_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'deleted_at',
    ];

    // ==================== RELATIONSHIPS ====================

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
            ->orderBy('version_number', 'desc');
    }

    /**
     * Get the latest version.
     */
    public function latestVersion()
    {
        return $this->hasOne(TemplateDataVersion::class, 'user_template_data_id')
            ->latestOfMany('version_number');
    }

    /**
     * Get the evidences attached to this template data.
     */
    public function evidences(): HasMany
    {
        return $this->hasMany(Evidence::class, 'user_template_data_id')
            ->orderBy('sort_order');
    }

    // ==================== SCOPES ====================

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

    /**
     * Scope a query to only include exported.
     */
    public function scopeExported($query)
    {
        return $query->where('status', 'exported');
    }

    /**
     * Scope a query to filter by user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope a query to order by recent.
     */
    public function scopeRecent($query)
    {
        return $query->orderBy('updated_at', 'desc');
    }

    // ==================== HELPER METHODS ====================

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
     * Check if data has been exported.
     */
    public function isExported(): bool
    {
        return $this->status === 'exported' || !empty($this->exported_file);
    }

    /**
     * Create a new version.
     */
    public function saveVersion(?string $note = null, string $changeType = 'manual'): TemplateDataVersion
    {
        $latestVersion = $this->versions()->max('version_number') ?? 0;

        return $this->versions()->create([
            'version_number' => $latestVersion + 1,
            'data' => $this->data,
            'note' => $note,
            'change_type' => $changeType,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Restore from a specific version.
     */
    public function restoreFromVersion(TemplateDataVersion $version): bool
    {
        $this->data = $version->data;
        $saved = $this->save();

        if ($saved) {
            $this->saveVersion('استعادة من النسخة رقم ' . $version->version_number, 'manual');
        }

        return $saved;
    }

    /**
     * Mark as completed.
     */
    public function markAsCompleted(): bool
    {
        $this->status = 'completed';
        return $this->save();
    }

    /**
     * Mark as exported.
     */
    public function markAsExported(string $filePath): bool
    {
        $this->status = 'exported';
        $this->exported_file = $filePath;
        $this->exported_at = now();
        return $this->save();
    }

    /**
     * Get field value from data.
     */
    public function getFieldValue(string $fieldName, $default = null)
    {
        return $this->data[$fieldName] ?? $default;
    }

    /**
     * Set field value in data.
     */
    public function setFieldValue(string $fieldName, $value): void
    {
        $data = $this->data ?? [];
        $data[$fieldName] = $value;
        $this->data = $data;
    }

    /**
     * Get completion percentage.
     */
    public function getCompletionPercentage(): float
    {
        $template = $this->template;
        if (!$template) {
            return 0;
        }

        $requiredFields = $template->fields()->where('is_required', true)->count();
        if ($requiredFields === 0) {
            return 100;
        }

        $filledFields = 0;
        $data = $this->data ?? [];

        foreach ($template->fields()->where('is_required', true)->get() as $field) {
            if (!empty($data[$field->name])) {
                $filledFields++;
            }
        }

        return round(($filledFields / $requiredFields) * 100, 2);
    }
}
