<?php
// app/Http/Controllers/Api/PaymentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PurchaseService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        // [FIX] PHP 8.1+ on 32-bit systems: Stripe SDK uses `(int) round(microtime(true) * 1000)`
        // which overflows PHP_INT_MAX (2147483647) on 32-bit PHP, causing an ErrorException.
        // Suppress E_DEPRECATED *and* implicit float-to-int conversion warnings.
        if (PHP_INT_SIZE < 8) {
            error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_WARNING);
            // Also set a custom error handler to swallow the specific "not representable as int" error
            set_error_handler(function ($severity, $message) {
                if (str_contains($message, 'not representable as an int')) {
                    return true; // Swallow this specific error
                }
                return false; // Let other errors propagate normally
            }, E_ALL);
        }

        // [FIX S-04] Lazy Stripe initialization — only warn on missing key.
        // [AUDIT FIX] Was throwing RuntimeException which blocked ALL routes
        // (including wallet endpoints that don't need Stripe).
        $stripeKey = config('services.stripe.secret');
        if (empty($stripeKey)) {
            Log::warning('[SERS] Stripe secret key is not configured. Payment features will be unavailable.');
        } else {
            Stripe::setApiKey($stripeKey);
        }
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

        return $this->processOrderPaymentIntent($order);
    }

    /**
     * Build and return the Stripe PaymentIntent for an order.
     */
    private function processOrderPaymentIntent(Order $order): JsonResponse
    {
        try {
            /** @var \Stripe\PaymentIntent $paymentIntent */
            $paymentIntent = $this->buildStripeIntent(
                intval(round($order->total * 100)),
                'sar',
                [
                    'order_id'     => $order->id,
                    'order_number' => $order->order_number,
                    'user_id'      => $order->user_id,
                ]
            );

            Log::info("Payment intent created", [
                'order_id'          => $order->id,
                'payment_intent_id' => $paymentIntent->id,
                'amount'            => $order->total,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء نية الدفع بنجاح',
                'data' => [
                    'client_secret'    => $paymentIntent->client_secret,
                    'payment_intent_id' => $paymentIntent->id,
                    'amount'           => $order->total,
                    'currency'         => 'SAR',
                ],
            ]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error("Stripe API error", [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في بوابة الدفع',
                'error'   => 'stripe_error',
            ], 500);
        } catch (\Throwable $e) {
            Log::error("Payment intent creation failed", [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء عملية الدفع',
                'error'   => 'payment_error',
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
                'error' => 'webhook_processing_error',
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
        $metadata = $paymentIntent->metadata;

        // ── Wallet Top-Up ──
        if (($metadata->type ?? null) === 'wallet_topup') {
            $this->handleWalletTopupSucceeded($paymentIntent);
            return;
        }

        // ── Order Payment ──
        $orderId = $metadata->order_id ?? null;

        if (!$orderId) {
            Log::warning("Payment succeeded but no order_id in metadata", [
                'payment_intent_id' => $paymentIntent->id,
            ]);
            return;
        }

        // [C-2 FIX + BUG-03 FIX] Use lockForUpdate() AND run completePayment() inside
        // the same transaction — this prevents the race window where a duplicate webhook
        // could sneak in between the lock release and the order status update.
        DB::transaction(function () use ($orderId, $paymentIntent) {
            $order = Order::where('id', $orderId)->lockForUpdate()->first();

            if (!$order) {
                Log::warning("Order not found for payment", [
                    'order_id'          => $orderId,
                    'payment_intent_id' => $paymentIntent->id,
                ]);
                return;
            }

            // Skip if already completed (idempotency — safe under lock)
            if ($order->status === 'completed') {
                Log::info("Order already completed, skipping duplicate webhook", ['order_id' => $orderId]);
                return;
            }

            // Complete payment inside the locked transaction
            $this->purchaseService->completePayment(
                $order,
                $paymentIntent->id,
                'stripe',
                [
                    'payment_intent_id' => $paymentIntent->id,
                    'amount'            => $paymentIntent->amount,
                    'currency'          => $paymentIntent->currency,
                ]
            );
        });

        Log::info("Payment completed successfully", [
            'order_id'          => $orderId,
            'payment_intent_id' => $paymentIntent->id,
        ]);
    }

    /**
     * Handle successful wallet top-up payment.
     * Credits the user's wallet balance atomically.
     *
     * @param object $paymentIntent
     * @return void
     */
    protected function handleWalletTopupSucceeded(object $paymentIntent): void
    {
        $userId = $paymentIntent->metadata->user_id ?? null;
        $amount = (float) ($paymentIntent->metadata->amount ?? 0);

        if (!$userId || $amount <= 0) {
            Log::warning("Wallet topup webhook missing user_id or amount", [
                'payment_intent_id' => $paymentIntent->id,
            ]);
            return;
        }

        // [IDEMPOTENCY] Prevent double-credit from duplicate Stripe webhooks
        if (class_exists(\App\Models\WalletTransaction::class)) {
            $alreadyCredited = \App\Models\WalletTransaction::where('user_id', $userId)
                ->where('reference_type', 'StripeTopup')
                ->where('reference_id', $paymentIntent->id) // [L-07 FIX] Exact match on reference_id instead of LIKE
                ->exists();

            if ($alreadyCredited) {
                Log::info("Wallet topup already processed (idempotency skip)", [
                    'user_id' => $userId,
                    'payment_intent_id' => $paymentIntent->id,
                ]);
                return;
            }
        }

        $user = \App\Models\User::find($userId);
        if (!$user) {
            Log::warning("Wallet topup user not found", ['user_id' => $userId]);
            return;
        }

        try {
            // [DRY-02 FIX] Delegate to WalletService — shared atomic credit logic
            $walletService = app(WalletService::class);
            $result = $walletService->credit(
                $userId,
                $amount,
                'شحن رصيد عبر Stripe — ' . $paymentIntent->id,
                'StripeTopup',
                $paymentIntent->id
            );

            Log::info("Wallet topped up successfully", [
                'user_id'           => $userId,
                'amount'            => $amount,
                'payment_intent_id' => $paymentIntent->id,
                'new_balance'       => $result['balance_after'],
            ]);

        } catch (\Throwable $e) {
            Log::error("Wallet topup credit failed", [
                'user_id' => $userId,
                'amount'  => $amount,
                'error'   => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle failed payment.
     * 
     * @param object $paymentIntent
     * @return void
     */
    protected function handlePaymentFailed(object $paymentIntent): void
    {
        $metadata = $paymentIntent->metadata ?? (object) [];
        $errorMessage = $paymentIntent->last_payment_error->message ?? 'Unknown error';

        // [L-01 FIX] Handle wallet topup failure — log for audit trail
        if (($metadata->type ?? null) === 'wallet_topup') {
            $userId = $metadata->user_id ?? null;
            $amount = $metadata->amount ?? 0;
            Log::warning("Wallet topup payment failed", [
                'user_id'           => $userId,
                'amount'            => $amount,
                'payment_intent_id' => $paymentIntent->id,
                'error'             => $errorMessage,
            ]);
            return;
        }

        // Handle order payment failure (existing logic)
        $orderId = $metadata->order_id ?? null;

        if (!$orderId) {
            return;
        }

        $order = Order::find($orderId);

        if (!$order) {
            return;
        }

        $this->purchaseService->handlePaymentFailure($order, $errorMessage);

        Log::warning("Payment failed", [
            'order_id' => $orderId,
            'error' => $errorMessage,
        ]);
    }

    /**
     * GET /api/payments/wallet/balance
     * Returns the authenticated user's wallet balance.
     */
    public function walletBalance(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'balance' => (float) $user->wallet_balance,
                'currency' => 'SAR',
            ],
        ]);
    }

    /**
     * GET /api/payments/wallet/transactions
     * Returns paginated wallet transaction history — cached 30s.
     */
    public function walletTransactions(Request $request): JsonResponse
    {
        $user    = $request->user();
        $perPage = min($request->get('per_page', 10), 50);
        $page    = $request->get('page', 1);
        // Add bust=1 param to skip cache (used by frontend after top-up)
        $bust     = $request->boolean('bust');
        $cacheKey = "wallet_tx_{$user->id}_p{$page}_pp{$perPage}";

        if ($bust) {
            \Illuminate\Support\Facades\Cache::store('file')->forget($cacheKey);
        }

        try {
            $result = \Illuminate\Support\Facades\Cache::store('file')->remember($cacheKey, 30, function () use ($user, $perPage) {
                if (class_exists(\App\Models\WalletTransaction::class)) {
                    $transactions = \App\Models\WalletTransaction::where('user_id', $user->id)
                        ->orderBy('created_at', 'desc')
                        ->paginate($perPage);

                    return [
                        'data' => $transactions->items(),
                        'meta' => [
                            'current_page' => $transactions->currentPage(),
                            'last_page'    => $transactions->lastPage(),
                            'total'        => $transactions->total(),
                        ],
                    ];
                }

                $orders = Order::where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->select(['id', 'total', 'status', 'paid_at as created_at'])
                    ->orderBy('paid_at', 'desc')
                    ->paginate($perPage);

                return [
                    'data' => $orders->map(fn($o) => [
                        'id'          => $o->id,
                        'type'        => 'purchase',
                        'amount'      => -(float) $o->total,
                        'description' => 'شراء طلب #' . substr($o->id, 0, 8),
                        'created_at'  => $o->created_at,
                    ]),
                    'meta' => [
                        'current_page' => $orders->currentPage(),
                        'last_page'    => $orders->lastPage(),
                        'total'        => $orders->total(),
                    ],
                ];
            });

            return response()->json(['success' => true, ...$result]);

        } catch (\Exception $e) {
            Log::error('walletTransactions error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب معاملات المحفظة',
                'data'    => [],
                'meta'    => ['current_page' => 1, 'last_page' => 1, 'total' => 0],
            ], 500);
        }
    }

    /**
     * POST /api/payments/wallet/topup
     * Top up the wallet using a Stripe Payment Intent.
     * Uses Stripe TEST mode — accepts test cards like 4242 4242 4242 4242.
     */
    public function walletTopup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:10|max:10000',
        ], [
            'amount.min'  => 'الحد الأدنى للشحن 10 ر.س',
            'amount.max'  => 'الحد الأقصى للشحن 10,000 ر.س',
        ]);

        $user   = $request->user();
        $amount = (float) $validated['amount'];

        return $this->processWalletTopupIntent($user, $amount);
    }

    /**
     * Build and return the Stripe PaymentIntent for a wallet top-up.
     *
     * @param  \App\Models\User  $user
     * @param  float  $amount
     * @return JsonResponse
     */
    private function processWalletTopupIntent($user, float $amount): JsonResponse
    {
        try {
            /** @var \Stripe\PaymentIntent $paymentIntent */
            $paymentIntent = $this->buildStripeIntent(
                intval(round($amount * 100)),
                'sar',
                [
                    'type'    => 'wallet_topup',
                    'user_id' => $user->id,
                    'amount'  => $amount,
                ]
            );

            Log::info('Wallet topup intent created', [
                'user_id'           => $user->id,
                'amount'            => $amount,
                'payment_intent_id' => $paymentIntent->id,
            ]);

            return response()->json([
                'success' => true,
                'data'    => [
                    'client_secret'      => $paymentIntent->client_secret,
                    'payment_intent_id'  => $paymentIntent->id,
                    'amount'             => $amount,
                ],
            ]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('Stripe walletTopup error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في بوابة الدفع',
                'error'   => 'stripe_error',
            ], 500);
        }
    }

    /**
     * POST /api/payments/wallet/confirm-topup
     * 
     * Direct confirmation fallback — called by frontend after Stripe confirmCardPayment succeeds.
     * Checks the PaymentIntent status directly with Stripe API and credits the wallet immediately,
     * so the user doesn't have to wait for the webhook (which may be delayed or unavailable in dev).
     *
     * Uses the same idempotency guard as handleWalletTopupSucceeded() to prevent double-credit.
     */
    public function confirmTopup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        $user = $request->user();

        try {
            // Retrieve the PaymentIntent directly from Stripe
            $paymentIntent = $this->stripeCall(fn() => PaymentIntent::retrieve($validated['payment_intent_id']));

            // Verify it's a wallet topup for this user
            $metadata = $paymentIntent->metadata;
            if (($metadata->type ?? null) !== 'wallet_topup') {
                return response()->json([
                    'success' => false,
                    'message' => 'هذا الطلب ليس عملية شحن محفظة',
                ], 400);
            }

            if (($metadata->user_id ?? null) != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح',
                ], 403);
            }

            // Check payment status
            if ($paymentIntent->status !== 'succeeded') {
                return response()->json([
                    'success' => false,
                    'message' => 'لم يكتمل الدفع بعد',
                    'data' => ['status' => $paymentIntent->status],
                ], 400);
            }

            $amount = (float) ($metadata->amount ?? 0);
            if ($amount <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'مبلغ غير صالح',
                ], 400);
            }

            // [IDEMPOTENCY] Same check as webhook — skip if already credited
            if (class_exists(\App\Models\WalletTransaction::class)) {
                $alreadyCredited = \App\Models\WalletTransaction::where('user_id', $user->id)
                    ->where('reference_type', 'StripeTopup')
                    ->where('reference_id', $paymentIntent->id) // [L-07 FIX] Exact match
                    ->exists();

                if ($alreadyCredited) {
                    // Already processed (by webhook or previous confirm call)
                    return response()->json([
                        'success' => true,
                        'message' => 'تم شحن المحفظة مسبقاً',
                        'data' => [
                            'balance' => (float) $user->fresh()->wallet_balance,
                            'already_processed' => true,
                        ],
                    ]);
                }
            }

            // [DRY-02 FIX] Delegate to WalletService — shared atomic credit logic
            $walletService = app(WalletService::class);
            $result = $walletService->credit(
                $user->id,
                $amount,
                'شحن رصيد عبر Stripe — ' . $paymentIntent->id,
                'StripeTopup',
                $paymentIntent->id
            );

            $newBalance = $result['balance_after'];

            Log::info('Wallet topup confirmed directly', [
                'user_id' => $user->id,
                'amount'  => $amount,
                'payment_intent_id' => $paymentIntent->id,
                'new_balance' => $newBalance,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم شحن المحفظة بنجاح',
                'data' => [
                    'balance' => $newBalance,
                    'amount'  => $amount,
                ],
            ]);

        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('confirmTopup Stripe error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'فشل التحقق من حالة الدفع',
            ], 500);
        }
    }

    /**
     * POST /api/payments/wallet/transfer
     * Transfer balance from the authenticated user's wallet to another user.
     *
     * Request body: { recipient_email: string, amount: float, note?: string }
     */
    public function walletTransfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient_email' => 'required|email|exists:users,email',
            'amount'          => 'required|numeric|min:1|max:50000',
            'note'            => 'nullable|string|max:255',
        ], [
            'recipient_email.exists' => 'المستخدم المستلم غير موجود',
            'amount.min'             => 'الحد الأدنى للتحويل 1 ر.س',
            'amount.max'             => 'الحد الأقصى للتحويل 50,000 ر.س',
        ]);

        $sender    = $request->user();
        $recipient = \App\Models\User::where('email', $validated['recipient_email'])->first();

        // Prevent self-transfer
        if ($sender->id === $recipient->id) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكنك تحويل رصيد لنفسك',
                'error'   => 'self_transfer',
            ], 400);
        }

        // [SEC] Prevent transfer to inactive/deactivated accounts
        if (!$recipient->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'حساب المستلم غير نشط',
                'error'   => 'recipient_inactive',
            ], 422);
        }

        $amount = (float) $validated['amount'];

        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($sender, $recipient, $amount, $validated) {
                // [P-09 FIX] Lock both rows upfront in deterministic order to prevent deadlocks
                // and ensure accurate balance_before values in the ledger.
                // Lower ID first to avoid ABBA deadlock between concurrent transfers.
                $ids = [$sender->id, $recipient->id];
                sort($ids);
                $lockedUsers = \App\Models\User::whereIn('id', $ids)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $freshSender    = $lockedUsers[$sender->id];
                $freshRecipient = $lockedUsers[$recipient->id];

                $senderBalanceBefore    = (float) $freshSender->wallet_balance;
                $recipientBalanceBefore = (float) $freshRecipient->wallet_balance;

                if ($senderBalanceBefore < $amount) {
                    throw new \Exception('INSUFFICIENT_BALANCE');
                }

                // Atomic debit — sender
                $deducted = \App\Models\User::where('id', $sender->id)
                    ->where('wallet_balance', '>=', $amount)
                    ->decrement('wallet_balance', $amount);

                if (!$deducted) {
                    throw new \Exception('Concurrent transfer detected — balance changed');
                }

                // Credit recipient
                \App\Models\User::where('id', $recipient->id)->increment('wallet_balance', $amount);

                $note = $validated['note'] ?? null;

                $senderBalanceAfter    = $senderBalanceBefore - $amount;
                $recipientBalanceAfter = $recipientBalanceBefore + $amount;

                // Ledger entries — linked by shared transfer ID for audit trail
                if (class_exists(\App\Models\WalletTransaction::class)) {
                    $transferId = (string) \Illuminate\Support\Str::uuid();

                    \App\Models\WalletTransaction::create([
                        'user_id'        => $sender->id,
                        'type'           => 'withdrawal',
                        'amount'         => -$amount,
                        'balance_before' => $senderBalanceBefore,
                        'balance_after'  => $senderBalanceAfter,
                        'description'    => 'تحويل رصيد إلى ' . $recipient->name . ($note ? ' — ' . $note : ''),
                        'reference_type' => 'WalletTransfer',
                        'reference_id'   => $transferId,
                    ]);

                    \App\Models\WalletTransaction::create([
                        'user_id'        => $recipient->id,
                        'type'           => 'deposit',
                        'amount'         => $amount,
                        'balance_before' => $recipientBalanceBefore,
                        'balance_after'  => $recipientBalanceAfter,
                        'description'    => 'تحويل رصيد من ' . $sender->name . ($note ? ' — ' . $note : ''),
                        'reference_type' => 'WalletTransfer',
                        'reference_id'   => $transferId,
                    ]);
                }
            });

            // [PERF-01] Bust cache for both sender and recipient
            $walletService = app(WalletService::class);
            $walletService->bustTransactionCache($sender->id);
            $walletService->bustTransactionCache($recipient->id);

            Log::info('Wallet transfer completed', [
                'sender_id'    => $sender->id,
                'recipient_id' => $recipient->id,
                'amount'       => $amount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم التحويل بنجاح',
                'data'    => [
                    'amount'           => $amount,
                    'recipient_name'   => $recipient->name,
                    'new_balance'      => (float) $sender->fresh()->wallet_balance,
                ],
            ]);

        } catch (\Exception $e) {
            if ($e->getMessage() === 'INSUFFICIENT_BALANCE') {
                return response()->json([
                    'success' => false,
                    'message' => 'رصيد المحفظة غير كافٍ',
                    'error'   => 'insufficient_balance',
                ], 400);
            }
            Log::error('Wallet transfer error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التحويل، يرجى المحاولة لاحقاً',
                'error'   => 'transfer_error',
            ], 500);
        }
    }

    /**
     * Create a Stripe PaymentIntent with automatic payment methods.
     *
     * @param  int                  $amountInSmallestUnit
     * @param  string               $currency
     * @param  array<string,mixed>  $metadata
     * @return \Stripe\PaymentIntent
     */
    private function buildStripeIntent(int $amountInSmallestUnit, string $currency, array $metadata)
    {
        $params = [
            'amount'                    => $amountInSmallestUnit,
            'currency'                  => $currency,
            'metadata'                  => $metadata,
            'automatic_payment_methods' => ['enabled' => true],
        ];

        return $this->stripeCall(function () use ($params) {
            $intentClass = PaymentIntent::class;
            /** @var \Stripe\PaymentIntent */
            return $intentClass::create($params);
        });
    }

    /**
     * Execute a Stripe SDK call with 32-bit PHP compatibility.
     *
     * [FIX] PHP 8.1+ on 32-bit systems: Stripe SDK uses `(int) round(microtime(true) * 1000)`
     * internally for telemetry. On 32-bit PHP, this overflows PHP_INT_MAX (2,147,483,647)
     * and throws an ErrorException. This wrapper temporarily suppresses that specific error.
     *
     * @template T
     * @param  callable(): T  $callback
     * @return T
     */
    private function stripeCall(callable $callback): mixed
    {
        if (PHP_INT_SIZE >= 8) {
            return $callback();
        }

        // 32-bit PHP — install temporary error handler
        $prevHandler = set_error_handler(function ($severity, $message, $file, $line) use (&$prevHandler) {
            if (str_contains($message, 'not representable as an int')) {
                return true; // Harmless precision loss in Stripe telemetry timestamp
            }
            if ($prevHandler) {
                return call_user_func($prevHandler, $severity, $message, $file, $line);
            }
            return false;
        });

        try {
            return $callback();
        } finally {
            restore_error_handler();
        }
    }
}
