<?php
// app/Mail/WithdrawalStatusMail.php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * WithdrawalStatusMail
 *
 * Sent to the user when their withdrawal request is approved or rejected.
 */
class WithdrawalStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param object $withdrawal  The withdrawal_requests row
     * @param string $status      'completed' | 'rejected'
     * @param string $adminNotes  Admin's note/rejection reason
     */
    public function __construct(
        public readonly object $withdrawal,
        public readonly string $status,
        public readonly string $adminNotes = ''
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->status === 'completed'
            ? 'تمت الموافقة على طلب السحب — SERS ✅'
            : 'تم رفض طلب السحب — SERS ❌';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.withdrawal-status',
            with: [
                'withdrawal' => $this->withdrawal,
                'status'     => $this->status,
                'adminNotes' => $this->adminNotes,
                'dashUrl'    => rtrim(config('app.url'), '/') . '/referrals',
                'amount'     => number_format((float) $this->withdrawal->amount, 2),
            ],
        );
    }
}
