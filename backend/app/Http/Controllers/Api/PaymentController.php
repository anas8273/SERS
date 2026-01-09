<?php
// app/Http/Controllers/Api/PaymentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Webhook;

/**
 * PaymentController
 * 
 * Handles Stripe payment integration:
 * - Creating payment intents
 * - Processing webhooks
 * 
 * @package App\Http\Controllers\Api
 */
class PaymentController extends Controller
{
    public function __construct(
        protected PurchaseService $purchaseService
    ) {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Create a Stripe Payment Intent.
     * 
     * POST /api/payments/create-intent
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function createPaymentIntent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|uuid|exists:orders,id',
        ], [
            'order_id.required' => 'معرف الطلب مطلوب',
            'order_id.exists' => 'الطلب غير موجود',
        ]);

        // Find the order and verify ownership
        $order = Order::where('id', $validated['order_id'])
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'الطلب غير موجود أو تم دفعه مسبقاً',
                'error' => 'order_not_found',
            ], 404);
        }

        try {
            // Create Stripe Payment Intent
            $paymentIntent = PaymentIntent::create([
                'amount' => (int) ($order->total * 100), // Convert to halalas (cents)
                'currency' => 'sar', // Saudi Riyal
                'metadata' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'user_id' => $order->user_id,
                ],
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
            ]);

            Log::info("Payment intent created", [
                'order_id' => $order->id,
                'payment_intent_id' => $paymentIntent->id,
                'amount' => $order->total,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء نية الدفع بنجاح',
                'data' => [
                    'client_secret' => $paymentIntent->client_secret,
                    'payment_intent_id' => $paymentIntent->id,
                    'amount' => $order->total,
                    'currency' => 'SAR',
                ],
            ]);

        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error("Stripe API error", [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في بوابة الدفع',
                'error' => 'stripe_error',
            ], 500);

        } catch (\Throwable $e) {
            Log::error("Payment intent creation failed", [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء عملية الدفع',
                'error' => 'payment_error',
            ], 500);
        }
    }

    /**
     * Handle Stripe webhook events.
     * 
     * POST /api/webhooks/stripe
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function handleStripeWebhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        try {
            // Verify webhook signature
            $event = Webhook::constructEvent(
                $payload,
                $sigHeader,
                $webhookSecret
            );

            Log::info("Stripe webhook received", [
                'type' => $event->type,
                'id' => $event->id,
            ]);

            // Handle the event
            switch ($event->type) {
                case 'payment_intent.succeeded':
                    $this->handlePaymentSucceeded($event->data->object);
                    break;

                case 'payment_intent.payment_failed':
                    $this->handlePaymentFailed($event->data->object);
                    break;

                default:
                    Log::info("Unhandled Stripe event", ['type' => $event->type]);
            }

            return response()->json(['success' => true]);

        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::warning("Invalid Stripe webhook signature", [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'invalid_signature',
            ], 400);

        } catch (\Throwable $e) {
            Log::error("Stripe webhook error", [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Handle successful payment.
     * 
     * @param object $paymentIntent
     * @return void
     */
    protected function handlePaymentSucceeded(object $paymentIntent): void
    {
        $orderId = $paymentIntent->metadata->order_id ?? null;

        if (!$orderId) {
            Log::warning("Payment succeeded but no order_id in metadata", [
                'payment_intent_id' => $paymentIntent->id,
            ]);
            return;
        }

        $order = Order::find($orderId);

        if (!$order) {
            Log::warning("Order not found for payment", [
                'order_id' => $orderId,
                'payment_intent_id' => $paymentIntent->id,
            ]);
            return;
        }

        // Skip if already paid
        if ($order->status === 'paid') {
            Log::info("Order already paid, skipping", ['order_id' => $orderId]);
            return;
        }

        // Complete the payment
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

        Log::info("Payment completed successfully", [
            'order_id' => $orderId,
            'payment_intent_id' => $paymentIntent->id,
        ]);
    }

    /**
     * Handle failed payment.
     * 
     * @param object $paymentIntent
     * @return void
     */
    protected function handlePaymentFailed(object $paymentIntent): void
    {
        $orderId = $paymentIntent->metadata->order_id ?? null;

        if (!$orderId) {
            return;
        }

        $order = Order::find($orderId);

        if (!$order) {
            return;
        }

        $errorMessage = $paymentIntent->last_payment_error->message ?? 'Unknown error';

        $this->purchaseService->handlePaymentFailure($order, $errorMessage);

        Log::warning("Payment failed", [
            'order_id' => $orderId,
            'error' => $errorMessage,
        ]);
    }
}
