<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomRequestVote extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'custom_request_id',
    ];

    /**
     * Get the user that owns the vote.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the custom request.
     */
    public function customRequest(): BelongsTo
    {
        return $this->belongsTo(CustomRequest::class);
    }
}
