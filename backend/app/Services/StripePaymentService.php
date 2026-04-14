<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * StripePaymentService
 *
 * Calls the Stripe REST API directly via Laravel's HTTP client
 * to avoid IDE type-inference limitations from the Stripe PHP SDK.
 */
class StripePaymentService
{
    /**
     * Create a Stripe PaymentIntent and return its details.
     *
     * @param  string  $stripeKey    The Stripe secret API key.
     * @param  int     $amountCents  Amount in smallest currency unit (halalas).
     * @param  string  $orderId      The order UUID for metadata.
     * @param  string  $userId       The user UUID for metadata.
     * @param  string  $orderNumber  Human-readable order number for the description.
     * @return array{id: string, client_secret: string}
     *
     * @throws \RuntimeException If the Stripe API call fails.
     */
    public function createPaymentIntent(
        string $stripeKey,
        int $amountCents,
        string $orderId,
        string $userId,
        string $orderNumber
    ): array {
        $response = Http::withBasicAuth($stripeKey, '')
            ->asForm()
            ->post('https://api.stripe.com/v1/payment_intents', [
                'amount'                  => $amountCents,
                'currency'                => 'sar',
                'metadata[order_id]'      => $orderId,
                'metadata[user_id]'       => $userId,
                'metadata[type]'          => 'order_payment',
                'payment_method_types[0]' => 'card',
                'description'             => "SERS Order #{$orderNumber}",
            ]);

        if ($response->failed()) {
            Log::error('Stripe PaymentIntent creation failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \RuntimeException('فشل إنشاء طلب الدفع عبر Stripe');
        }

        $data = $response->json();

        return [
            'id'            => (string) $data['id'],
            'client_secret' => (string) $data['client_secret'],
        ];
    }
}
