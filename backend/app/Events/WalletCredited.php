<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * WalletCredited — Broadcast event for wallet balance changes.
 *
 * [F-02] Fires when a user's wallet is credited (topup, referral, etc.).
 * Frontend updates the balance indicator in real-time.
 */
class WalletCredited implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int|string $userId,
        public readonly float $amount,
        public readonly float $newBalance,
        public readonly string $description,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'wallet.credited';
    }

    public function broadcastWith(): array
    {
        return [
            'amount'      => $this->amount,
            'new_balance' => $this->newBalance,
            'description' => $this->description,
            'message'     => 'تم إضافة ' . number_format($this->amount, 2) . ' ر.س لمحفظتك',
        ];
    }
}
