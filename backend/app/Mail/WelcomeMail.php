<?php
// app/Mail/WelcomeMail.php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * WelcomeMail
 *
 * Sent to new users immediately after account creation.
 */
class WelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'أهلاً بك في SERS 🎓 — منصة السجلات التعليمية الذكية',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome',
            with: [
                'user'         => $this->user,
                'marketUrl'    => rtrim(config('app.url'), '/') . '/marketplace',
                'servicesUrl'  => rtrim(config('app.url'), '/') . '/services',
                'dashUrl'      => rtrim(config('app.url'), '/') . '/dashboard',
            ],
        );
    }
}
