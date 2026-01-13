<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateDataVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_template_data_id',
        'version_number',
        'field_values',
        'change_summary',
    ];

    protected $casts = [
        'field_values' => 'array',
        'version_number' => 'integer',
    ];

    /**
     * Get the user template data that owns the version.
     */
    public function userTemplateData(): BelongsTo
    {
        return $this->belongsTo(UserTemplateData::class, 'user_template_data_id');
    }
}
