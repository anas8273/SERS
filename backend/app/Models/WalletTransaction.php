<?php
// app/Models/WalletTransaction.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * WalletTransaction Model
 * 
 * Represents a wallet transaction (deposit, withdrawal, purchase, refund).
 * Maintains full audit trail with before/after balances.
 * 
 * @property string $id UUID primary key
 * @property string $user_id FK to users (transaction owner)
 * @property string $type Transaction type (deposit|withdrawal|purchase|refund)
 * @property float $amount Transaction amount
 * @property float $balance_before Wallet balance before transaction
 * @property float $balance_after Wallet balance after transaction
 * @property string|null $reference_id Related entity UUID (e.g., Order ID)
 * @property string|null $reference_type Related entity type (e.g., Order)
 * @property string|null $description Human-readable description
 * @property \DateTime $created_at
 * @property \DateTime $updated_at
 */
class WalletTransaction extends Model
{
    use HasFactory, HasUuids;

    /**
     * Transaction type constants.
     */
    public const TYPE_DEPOSIT = 'deposit';
    public const TYPE_WITHDRAWAL = 'withdrawal';
    public const TYPE_PURCHASE = 'purchase';
    public const TYPE_REFUND = 'refund';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'balance_before',
        'balance_after',
        'reference_id',
        'reference_type',
        'description',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the user that owns this transaction.
     * FK: wallet_transactions.user_id -> users.id (RESTRICT on delete)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the related entity (polymorphic-like).
     * Uses reference_id and reference_type to lookup the related model.
     */
    public function reference()
    {
        if (!$this->reference_type || !$this->reference_id) {
            return null;
        }

        $modelMap = [
            'Order' => Order::class,
            'Refund' => Order::class, // Refunds also reference orders
        ];

        $modelClass = $modelMap[$this->reference_type] ?? null;
        
        return $modelClass ? $modelClass::find($this->reference_id) : null;
    }

    // ==================== SCOPES ====================

    /**
     * Scope to filter by transaction type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to filter deposits.
     */
    public function scopeDeposits($query)
    {
        return $query->where('type', self::TYPE_DEPOSIT);
    }

    /**
     * Scope to filter withdrawals.
     */
    public function scopeWithdrawals($query)
    {
        return $query->where('type', self::TYPE_WITHDRAWAL);
    }

    /**
     * Scope to filter purchases.
     */
    public function scopePurchases($query)
    {
        return $query->where('type', self::TYPE_PURCHASE);
    }

    /**
     * Scope to filter refunds.
     */
    public function scopeRefunds($query)
    {
        return $query->where('type', self::TYPE_REFUND);
    }

    /**
     * Scope to filter by reference.
     */
    public function scopeForReference($query, string $type, string $id)
    {
        return $query->where('reference_type', $type)
                     ->where('reference_id', $id);
    }

    /**
     * Scope to filter transactions in date range.
     */
    public function scopeCreatedBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope to order by most recent.
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    // ==================== ACCESSORS ====================

    /**
     * Check if this is a credit (money added).
     */
    public function getIsCreditAttribute(): bool
    {
        return in_array($this->type, [self::TYPE_DEPOSIT, self::TYPE_REFUND]);
    }

    /**
     * Check if this is a debit (money removed).
     */
    public function getIsDebitAttribute(): bool
    {
        return in_array($this->type, [self::TYPE_WITHDRAWAL, self::TYPE_PURCHASE]);
    }

    /**
     * Get the absolute amount.
     */
    public function getAbsoluteAmountAttribute(): float
    {
        return abs($this->amount);
    }
}