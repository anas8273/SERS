<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateDataVersion extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_template_data_id',
        'data',
        'note',
        'created_at',
    ];

    protected $casts = [
        'data' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Get the user template data that owns the version.
     */
    public function userTemplateData(): BelongsTo
    {
        return $this->belongsTo(UserTemplateData::class, 'user_template_data_id');
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
