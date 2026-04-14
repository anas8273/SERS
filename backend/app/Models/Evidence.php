<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Evidence Model
 * 
 * Represents supporting documents/files for templates.
 * Uses UUID as primary key for consistency across the system.
 */
class Evidence extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'user_template_data_id',
        'name',
        'description',
        'type',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'link',
        'qr_code',
        'barcode',
        'code_content',
        'sort_order',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'file_size' => 'integer',
        'sort_order' => 'integer',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'deleted_at',
    ];

    // ==================== RELATIONSHIPS ====================

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

    // ==================== ACCESSORS ====================

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
     * Get the full URL for the barcode.
     */
    public function getBarcodeUrlAttribute(): ?string
    {
        return $this->barcode 
            ? asset('storage/' . $this->barcode) 
            : null;
    }

    /**
     * Get human-readable file size.
     */
    public function getFileSizeHumanAttribute(): ?string
    {
        if (!$this->file_size) {
            return null;
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $this->file_size;
        $unit = 0;

        while ($size >= 1024 && $unit < count($units) - 1) {
            $size /= 1024;
            $unit++;
        }

        return round($size, 2) . ' ' . $units[$unit];
    }

    // ==================== SCOPES ====================

    /**
     * Scope a query to filter by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include active evidences.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to order by sort_order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Scope a query to filter by user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ==================== HELPER METHODS ====================

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
     * Check if evidence is a QR code.
     */
    public function isQrCode(): bool
    {
        return $this->type === 'qrcode';
    }

    /**
     * Check if evidence is a barcode.
     */
    public function isBarcode(): bool
    {
        return $this->type === 'barcode';
    }

    /**
     * Check if evidence has a QR code.
     */
    public function hasQrCode(): bool
    {
        return !empty($this->qr_code);
    }

    /**
     * Check if evidence has a barcode.
     */
    public function hasBarcode(): bool
    {
        return !empty($this->barcode);
    }

    /**
     * Check if evidence has a file.
     */
    public function hasFile(): bool
    {
        return !empty($this->file_path);
    }
}
