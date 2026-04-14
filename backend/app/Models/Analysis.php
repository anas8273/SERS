<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Analysis extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'analyses';

    protected $fillable = [
        'user_id',
        'subject',
        'grade',
        'results',
        'ai_recommendations',
        'type',
        'title',
    ];

    protected $casts = [
        'results' => 'array',
    ];

    /**
     * Get the user that owns this analysis.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
