<?php
// app/Http/Controllers/Api/PaymentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class PaymentController extends Controller
{
    public function __construct(
        protected PurchaseService $purchaseService
    ) {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * إنشاء Payment Intent لـ Stripe
     */
    public function createPaymentIntent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|uuid|exists:orders,id',
        ]);

        $order = Order::where('id', $validated['order_id'])
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->firstOrFail();

        try {
            $paymentIntent = PaymentIntent::create([
                'amount' => (int) ($order->total * 100), // Stripe يستخدم السنتات
                'currency' => 'sar', // الريال السعودي
                'metadata' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'user_id' => $order->user_id,
                ],
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'client_secret' => $paymentIntent->client_secret,
                    'payment_intent_id' => $paymentIntent->id,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء عملية الدفع',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * تأكيد نجاح الدفع (Webhook من Stripe)
     */
    public function handleStripeWebhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $sigHeader,
                $webhookSecret
            );

            if ($event->type === 'payment_intent.succeeded') {
                $paymentIntent = $event->data->object;
                $orderId = $paymentIntent->metadata->order_id;

                $order = Order::findOrFail($orderId);

                $this->purchaseService->completePayment(
                    $order,
                    $paymentIntent->id,
                    'stripe',
                    [
                        'payment_intent_id' => $paymentIntent->id,
                        'amount' => $paymentIntent->amount,
                        'currency' => $paymentIntent->currency,
                    ]
                );
            }

            if ($event->type === 'payment_intent.payment_failed') {
                $paymentIntent = $event->data->object;
                $orderId = $paymentIntent->metadata->order_id;

                $order = Order::findOrFail($orderId);

                $this->purchaseService->handlePaymentFailure(
                    $order,
                    $paymentIntent->last_payment_error?->message ?? 'Unknown error'
                );
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}