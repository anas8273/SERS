<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIConversation extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ai_conversations';

    protected $fillable = [
        'user_id',
        'title',
        'messages',
        'context_type',
        'context_id',
    ];

    protected $casts = [
        'messages' => 'array',
    ];

    /**
     * Get the user that owns this conversation.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Add a message to the conversation.
     */
    public function addMessage(string $role, string $content): void
    {
        $messages = $this->messages ?? [];
        $messages[] = [
            'role' => $role,
            'content' => $content,
            'timestamp' => now()->toISOString(),
        ];
        $this->update(['messages' => $messages]);
    }

    /**
     * Get the total number of messages.
     */
    public function getMessagesCount(): int
    {
        return count($this->messages ?? []);
    }

    /**
     * Generate a title from the first user message.
     */
    public function generateTitle(): string
    {
        $messages = $this->messages ?? [];
        foreach ($messages as $message) {
            if ($message['role'] === 'user') {
                return mb_substr($message['content'], 0, 100);
            }
        }
        return 'محادثة جديدة';
    }
}
