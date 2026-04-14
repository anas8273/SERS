<?php
// app/Mail/OrderCompletedMail.php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * OrderCompletedMail
 *
 * Sent to the user when an order is completed and templates are ready to download.
 */
class OrderCompletedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Order $order
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'طلبك مكتمل — SERS 🎉',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-completed',
            with: [
                'order'     => $this->order,
                'user'      => $this->order->user,
                'items'     => $this->order->items()->with('template')->get(),
                'dashUrl'   => rtrim(config('app.url'), '/') . '/orders',
            ],
        );
    }
}
