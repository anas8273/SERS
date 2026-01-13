<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evidence extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_template_data_id',
        'name',
        'description',
        'type',
        'file_path',
        'link',
        'qr_code',
    ];

    /**
     * Get the user that owns the evidence.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user template data that owns the evidence.
     */
    public function userTemplateData(): BelongsTo
    {
        return $this->belongsTo(UserTemplateData::class, 'user_template_data_id');
    }

    /**
     * Get the full URL for the file.
     */
    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path 
            ? asset('storage/' . $this->file_path) 
            : null;
    }

    /**
     * Get the full URL for the QR code.
     */
    public function getQrCodeUrlAttribute(): ?string
    {
        return $this->qr_code 
            ? asset('storage/' . $this->qr_code) 
            : null;
    }

    /**
     * Check if evidence is an image.
     */
    public function isImage(): bool
    {
        return $this->type === 'image';
    }

    /**
     * Check if evidence is a file.
     */
    public function isFile(): bool
    {
        return $this->type === 'file';
    }

    /**
     * Check if evidence is a link.
     */
    public function isLink(): bool
    {
        return $this->type === 'link';
    }

    /**
     * Check if evidence has a QR code.
     */
    public function hasQrCode(): bool
    {
        return !empty($this->qr_code);
    }

    /**
     * Scope a query to filter by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
