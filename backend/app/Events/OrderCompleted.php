<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * OrderCompleted — Broadcast event for real-time notifications.
 *
 * [F-02] Fires when an order is completed (payment confirmed).
 * Broadcasts to the user's private channel so the frontend can
 * show a real-time toast notification without polling.
 *
 * Usage:
 *   event(new OrderCompleted($order));
 *
 * Frontend listener (Echo):
 *   Echo.private(`user.${userId}`)
 *       .listen('OrderCompleted', (e) => { toast.success(e.message); });
 *
 * Requires:
 *   - Laravel Echo + Pusher/Soketi/Reverb driver configured
 *   - BROADCAST_CONNECTION set in .env
 */
class OrderCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Order $order,
    ) {}

    /**
     * Get the channels the event should broadcast on.
     * Private channel ensures only the order owner receives it.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->order->user_id),
        ];
    }

    /**
     * Broadcast event name (frontend receives this).
     */
    public function broadcastAs(): string
    {
        return 'order.completed';
    }

    /**
     * Data sent with the event (minimal — no sensitive info).
     */
    public function broadcastWith(): array
    {
        return [
            'order_id'     => $this->order->id,
            'order_number' => $this->order->order_number,
            'total'        => (float) $this->order->total,
            'items_count'  => $this->order->items()->count(),
            'message'      => 'تم إكمال طلبك بنجاح! 🎉',
        ];
    }
}
