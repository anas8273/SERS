<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * User Model
 * 
 * Represents a user account with authentication, wallet, and role management.
 * Uses UUID as primary key for Firestore compatibility.
 * Updated to use templates instead of products.
 * 
 * @property string $id UUID primary key
 * @property string $email Unique email for authentication
 * @property string $password Hashed password
 * @property string $name Display name
 * @property string|null $phone Phone number (E.164 format)
 * @property string $role User role (user|admin)
 * @property string|null $firebase_uid Firebase Auth UID
 * @property float $wallet_balance Current wallet balance
 * @property bool $is_active Account activation status
 * @property \DateTime|null $email_verified_at Email verification timestamp
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 * @property \DateTime|null $deleted_at Soft delete timestamp
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUuids, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'firebase_uid',
        'wallet_balance',
        'is_active',
        'avatar_url',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'wallet_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get all orders placed by this user.
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get all wallet transactions for this user.
     */
    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    /**
     * Get all reviews written by this user.
     */
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get the user's template library (purchased templates).
     */
    public function library()
    {
        return $this->hasMany(UserLibrary::class);
    }

    /**
     * Get templates owned by this user through the library.
     */
    public function ownedTemplates()
    {
        return $this->belongsToMany(Template::class, 'user_libraries')
                    ->withPivot('order_id', 'purchased_at')
                    ->withTimestamps();
    }

    /**
     * Get user's wishlist items.
     */
    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    /**
     * Get wishlisted templates.
     */
    public function wishlistedTemplates()
    {
        return $this->belongsToMany(Template::class, 'wishlists')
                    ->withTimestamps();
    }

    /**
     * Get user's favorite templates.
     */
    public function favoriteTemplates()
    {
        return $this->belongsToMany(Template::class, 'favorite_templates')
                    ->withTimestamps();
    }

    /**
     * Get user's template data (filled templates).
     */
    public function templateData()
    {
        return $this->hasMany(UserTemplateData::class);
    }

    /**
     * Get user's evidences.
     */
    public function evidences()
    {
        return $this->hasMany(Evidence::class);
    }

    // ==================== SCOPES ====================

    /**
     * Scope to filter only active users.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter only admin users.
     */
    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    /**
     * Scope to filter only regular users.
     */
    public function scopeRegularUsers($query)
    {
        return $query->where('role', 'user');
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check if user has admin role.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user owns a specific template.
     */
    public function ownsTemplate(string $templateId): bool
    {
        return $this->library()->where('template_id', $templateId)->exists();
    }

    /**
     * Check if user has template in wishlist.
     */
    public function hasInWishlist(string $templateId): bool
    {
        return $this->wishlists()->where('template_id', $templateId)->exists();
    }

    /**
     * Check if user has template in favorites.
     */
    public function hasFavorited(string $templateId): bool
    {
        return FavoriteTemplate::hasTemplate($this->id, $templateId);
    }

    /**
     * Add funds to user's wallet.
     */
    public function addToWallet(float $amount, string $description = null, ?string $referenceId = null, ?string $referenceType = null): WalletTransaction
    {
        $balanceBefore = $this->wallet_balance;
        $balanceAfter = $balanceBefore + $amount;

        $this->update(['wallet_balance' => $balanceAfter]);

        return $this->walletTransactions()->create([
            'type' => 'deposit',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'reference_id' => $referenceId,
            'reference_type' => $referenceType,
            'description' => $description,
        ]);
    }

    /**
     * Deduct funds from user's wallet.
     */
    public function deductFromWallet(float $amount, string $type = 'purchase', string $description = null, ?string $referenceId = null, ?string $referenceType = null): WalletTransaction
    {
        $balanceBefore = $this->wallet_balance;
        $balanceAfter = $balanceBefore - $amount;

        $this->update(['wallet_balance' => $balanceAfter]);

        return $this->walletTransactions()->create([
            'type' => $type,
            'amount' => -$amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'reference_id' => $referenceId,
            'reference_type' => $referenceType,
            'description' => $description,
        ]);
    }
}
