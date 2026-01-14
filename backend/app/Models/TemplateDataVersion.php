<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TemplateDataVersion Model
 * 
 * Represents version history for user template data.
 * Uses UUID as primary key for consistency across the system.
 */
class TemplateDataVersion extends Model
{
    use HasFactory, HasUuids;

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_template_data_id',
        'version_number',
        'data',
        'note',
        'change_type',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'data' => 'array',
        'version_number' => 'integer',
        'created_at' => 'datetime',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the user template data that owns the version.
     */
    public function userTemplateData(): BelongsTo
    {
        return $this->belongsTo(UserTemplateData::class, 'user_template_data_id');
    }

    // ==================== SCOPES ====================

    /**
     * Scope a query to order by version number descending.
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('version_number', 'desc');
    }

    /**
     * Scope a query to filter by change type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('change_type', $type);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check if this is an auto-save version.
     */
    public function isAutoSave(): bool
    {
        return $this->change_type === 'auto_save';
    }

    /**
     * Check if this is an AI-filled version.
     */
    public function isAiFill(): bool
    {
        return $this->change_type === 'ai_fill';
    }

    /**
     * Get the changes compared to another version.
     */
    public function getChangesFrom(?TemplateDataVersion $other): array
    {
        if (!$other) {
            return array_keys($this->data ?? []);
        }

        $changes = [];
        $currentData = $this->data ?? [];
        $previousData = $other->data ?? [];

        // Find changed and new fields
        foreach ($currentData as $key => $value) {
            if (!isset($previousData[$key]) || $previousData[$key] !== $value) {
                $changes[] = $key;
            }
        }

        // Find removed fields
        foreach ($previousData as $key => $value) {
            if (!isset($currentData[$key])) {
                $changes[] = $key;
            }
        }

        return array_unique($changes);
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->created_at = $model->freshTimestamp();
        });
    }
}
