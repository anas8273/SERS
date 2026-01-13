<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CustomRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'description',
        'attachments',
        'status',
        'admin_notes',
        'assigned_template_id',
        'votes_count',
    ];

    protected $casts = [
        'attachments' => 'array',
        'votes_count' => 'integer',
    ];

    /**
     * Get the user that owns the request.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the category.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the assigned template.
     */
    public function assignedTemplate(): BelongsTo
    {
        return $this->belongsTo(InteractiveTemplate::class, 'assigned_template_id');
    }

    /**
     * Get the votes for the request.
     */
    public function votes(): HasMany
    {
        return $this->hasMany(CustomRequestVote::class);
    }

    /**
     * Get the users who voted for this request.
     */
    public function voters(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'custom_request_votes')
            ->withTimestamps();
    }

    /**
     * Check if a user has voted for this request.
     */
    public function hasVotedBy(User $user): bool
    {
        return $this->votes()->where('user_id', $user->id)->exists();
    }

    /**
     * Add a vote from a user.
     */
    public function addVote(User $user): bool
    {
        if ($this->hasVotedBy($user)) {
            return false;
        }

        $this->votes()->create(['user_id' => $user->id]);
        $this->increment('votes_count');
        return true;
    }

    /**
     * Remove a vote from a user.
     */
    public function removeVote(User $user): bool
    {
        $deleted = $this->votes()->where('user_id', $user->id)->delete();

        if ($deleted) {
            $this->decrement('votes_count');
            return true;
        }

        return false;
    }

    /**
     * Scope a query to only include pending requests.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to order by votes.
     */
    public function scopePopular($query)
    {
        return $query->orderBy('votes_count', 'desc');
    }
}
