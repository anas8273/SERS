<?php
// app/Mail/EmailVerificationMail.php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email Verification Mail [E-02]
 *
 * Sent to new users after registration or when they request a new verification link.
 * Contains a tokenized verification URL that expires in 24 hours.
 */
class EmailVerificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     *
     * @param User   $user      The user to verify
     * @param string $verifyUrl Full verification URL with token
     */
    public function __construct(
        public readonly User $user,
        public readonly string $verifyUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'تأكيد البريد الإلكتروني — ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.email-verify',
            with: [
                'user'      => $this->user,
                'verifyUrl' => $this->verifyUrl,
                'appName'   => config('app.name', 'SERS'),
                'expiresIn' => '24 ساعة',
            ],
        );
    }
}
