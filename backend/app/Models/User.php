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
     * Matches migration columns that should be user-fillable.
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
    ];

    /**
     * The attributes that should be hidden for serialization.
     * Sensitive data that should never be exposed in API responses.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     * Ensures proper type handling for database columns.
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
     * FK: orders.user_id -> users.id (CASCADE on delete)
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get all wallet transactions for this user.
     * FK: wallet_transactions.user_id -> users.id (RESTRICT on delete)
     */
    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    /**
     * Get all reviews written by this user.
     * FK: reviews.user_id -> users.id (RESTRICT on delete)
     */
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get the user's product library (purchased products).
     * FK: user_libraries.user_id -> users.id (RESTRICT on delete)
     */
    public function library()
    {
        return $this->hasMany(UserLibrary::class);
    }

    /**
     * Get products owned by this user through the library.
     * Many-to-many through user_libraries pivot table.
     */
    public function ownedProducts()
    {
        return $this->belongsToMany(Product::class, 'user_libraries')
                    ->withPivot('order_id', 'purchased_at')
                    ->withTimestamps();
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
     * Check if user owns a specific product.
     */
    public function ownsProduct(string $productId): bool
    {
        return $this->library()->where('product_id', $productId)->exists();
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