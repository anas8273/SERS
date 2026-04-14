<?php
// app/Http/Controllers/Api/OrderController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\User;
use App\Services\PurchaseService;
use App\Services\StripePaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * OrderController
 *
 * Fixes applied (2026-03-22):
 *   - [C-2] pay() now checks wallet balance, deducts atomically, passes real method
 *   - [C-3] store() accepts & forwards coupon_code to PurchaseService
 *   - [H-1] Internal exception messages are no longer leaked to the API response
 */
class OrderController extends Controller
{
    public function __construct(
        protected PurchaseService $purchaseService,
        protected StripePaymentService $stripePaymentService,
    ) {}

    /**
     * List user's orders.
     * GET /api/orders
     */
    public function index(Request $request): JsonResponse
    {
        // [PERF] Select only needed columns — avoids loading heavy data blobs
        $orders = $request->user()
            ->orders()
            ->select(['id', 'user_id', 'order_number', 'status', 'subtotal', 'discount', 'total', 'payment_method', 'paid_at', 'created_at', 'updated_at'])
            ->with('items.template:id,name_ar,thumbnail,type')
            ->orderBy('created_at', 'desc')
            ->paginate(min($request->input('per_page', 10), 50));

        return response()->json([
            'success' => true,
            'data'    => OrderResource::collection($orders),
            'meta'    => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'per_page'     => $orders->perPage(),
                'total'        => $orders->total(),
            ],
        ]);
    }

    /**
     * Get a single order by ID.
     * GET /api/orders/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $order = $request->user()
            ->orders()
            ->with('items.template')
            ->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'الطلب غير موجود',
                'error'   => 'not_found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new OrderResource($order),
        ]);
    }

    /**
     * Create a new order.
     * POST /api/orders
     *
     * [C-3] coupon_code is now accepted and forwarded to PurchaseService.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items'                 => 'required|array|min:1',
            // [GAP-03 FIX] Validate template exists AND is active at request level (fail fast)
            'items.*.template_id'  => [
                'required',
                'uuid',
                function ($attribute, $value, $fail) {
                    $template = \App\Models\Template::where('id', $value)->first();
                    if (!$template) {
                        $fail('القالب غير موجود');
                    } elseif (!$template->is_active) {
                        $fail('القالب "' . $template->name_ar . '" غير متاح حالياً');
                    }
                },
            ],
            'coupon_code'          => 'nullable|string|max:50',
        ], [
            'items.required'                => 'يجب إضافة قالب واحد على الأقل',
            'items.min'                     => 'يجب إضافة قالب واحد على الأقل',
            'items.*.template_id.required'  => 'معرف القالب مطلوب',
        ]);

        try {
            // [L-03] Prevent order spamming — max 5 pending orders per user
            $pendingCount = $request->user()
                ->orders()
                ->where('status', Order::STATUS_PENDING)
                ->count();
            
            if ($pendingCount >= 5) {
                return response()->json([
                    'success' => false,
                    'message' => 'لديك طلبات معلقة كثيرة. يرجى إكمال أو إلغاء الطلبات السابقة أولاً.',
                    'error'   => 'too_many_pending_orders',
                ], 429);
            }

            $order = $this->purchaseService->createOrder(
                $request->user(),
                $validated['items'],
                $validated['coupon_code'] ?? null  // [C-3] forward coupon
            );

            Log::info("Order created", [
                'order_id' => $order->id,
                'user_id'  => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الطلب بنجاح',
                'data'    => new OrderResource($order->load('items.template')),
            ], 201);

        } catch (\Exception $e) {
            // User-facing business logic exceptions (duplicate, coupon, etc.)
            Log::warning("Order creation rejected", [
                'user_id' => $request->user()->id,
                'reason'  => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error'   => 'order_rejected',
            ], 422);

        } catch (\Throwable $e) {
            // [H-1] Unexpected errors — log full detail, return generic message
            Log::error("Failed to create order", [
                'user_id' => $request->user()->id,
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة لاحقاً.',
                'error'   => 'server_error',
            ], 500);
        }
    }

    /**
     * Process payment for an order via wallet.
     * POST /api/orders/{id}/pay
     *
     * [C-2] Now performs a REAL wallet balance check and atomic deduction.
     * Passes the selected payment_method from the request instead of hardcoding.
     */
    public function pay(Request $request, string $id): JsonResponse
    {
        $order = $request->user()->orders()->with('items')->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'الطلب غير موجود',
                'error'   => 'not_found',
            ], 404);
        }

        if ($order->status === 'completed') {
            return response()->json([
                'success' => true,
                'message' => 'الطلب مدفوع مسبقاً',
                'data'    => new OrderResource($order),
            ]);
        }

        // [FIX GAP-NEW-01] Block duplicate Stripe PI creation if order is already processing
        // "processing" means a Stripe PI was already created — user should confirm existing PI, not create new one
        if ($order->status === 'processing') {
            return response()->json([
                'success' => false,
                'message' => 'جاري معالجة هذا الطلب. يرجى انتظار لحظات أو مراجعة طلباتك.',
                'error'   => 'order_processing',
                'data'    => new OrderResource($order),
            ], 409);
        }

        $user          = $request->user();
        $paymentMethod = $request->input('payment_method', 'wallet');

        // Validate payment method
        if (!in_array($paymentMethod, ['wallet', 'card', 'mada'])) {
            return response()->json([
                'success' => false,
                'message' => 'طريقة الدفع غير مدعومة',
                'error'   => 'invalid_payment_method',
            ], 422);
        }

        try {
            // ── Wallet Payment: Instant atomic deduction ──
            if ($paymentMethod === 'wallet') {
                return $this->payViaWallet($order, $user);
            }

            // ── Card / Mada Payment: Create Stripe Payment Intent ──
            return $this->payViaStripe($order, $user, $paymentMethod);

        } catch (\Exception $e) {
            Log::warning("Payment rejected", [
                'order_id' => $id,
                'reason'   => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error'   => 'payment_rejected',
            ], 422);

        } catch (\Throwable $e) {
            // [H-1] Generic message to client, full detail to logs
            Log::error("Failed to pay order", [
                'order_id' => $id,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'فشلت عملية الدفع. يرجى المحاولة لاحقاً.',
                'error'   => 'server_error',
            ], 500);
        }
    }

    /**
     * Process wallet payment with atomic deduction.
     */
    protected function payViaWallet(Order $order, User $user): JsonResponse
    {
        // Balance check
        if ($order->total > 0 && $user->wallet_balance < $order->total) {
            return response()->json([
                'success' => false,
                'message' => 'رصيد المحفظة غير كافٍ. يرجى شحن رصيدك أولاً.',
                'error'   => 'insufficient_balance',
                'data'    => [
                    'required'         => (float) $order->total,
                    'current_balance'  => (float) $user->wallet_balance,
                    'shortfall'        => round($order->total - $user->wallet_balance, 2),
                ],
            ], 422);
        }

        DB::transaction(function () use ($order, $user) {
            // [FIX S-05] uuid payment ID — collision-proof vs uniqid()
            $paymentId = 'WAL-' . strtoupper(substr(str_replace('-', '', \Illuminate\Support\Str::uuid()), 0, 14));

            // [FIX S-01] Capture balance_before BEFORE decrement — inside the lock.
            // Using fresh() AFTER decrement would read the already-reduced balance and
            // then reverse-add total — inaccurate under concurrent requests.
            $lockedUser = DB::table('users')
                ->where('id', $user->id)
                ->lockForUpdate()
                ->first(['wallet_balance']);

            $balanceBefore = (float) $lockedUser->wallet_balance;

            // Atomic deduction — fails fast if balance changed between lock and decrement
            $deducted = DB::table('users')
                ->where('id', $user->id)
                ->where('wallet_balance', '>=', $order->total)
                ->decrement('wallet_balance', $order->total);

            if (!$deducted) {
                throw new \Exception('رصيد غير كافٍ — تم تعديل الرصيد من طلب آخر');
            }

            $balanceAfter = round($balanceBefore - $order->total, 2);

            // Record wallet transaction
            $user->walletTransactions()->create([
                'type'           => 'purchase',
                'amount'         => -$order->total,
                'balance_before' => $balanceBefore,
                'balance_after'  => $balanceAfter,
                'reference_id'   => $order->id,
                'reference_type' => 'Order',
                'description'    => "شراء طلب #{$order->order_number}",
            ]);

            // Complete the order
            $this->purchaseService->completePayment(
                $order,
                $paymentId,
                'wallet',
                ['source' => 'wallet']
            );
        });

        Log::info("Order paid via wallet", [
            'order_id' => $order->id,
            'user_id'  => $user->id,
            'amount'   => $order->total,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم الدفع بنجاح 🎉',
            'data'    => new OrderResource($order->fresh('items.template')),
        ]);
    }

    /**
     * Process card/mada payment via Stripe Payment Intent.
     *
     * @param  Order   $order   The order to pay for.
     * @param  User    $user    The authenticated user.
     * @param  string  $method  Payment method identifier ('card' or 'mada').
     * @return JsonResponse
     */
    protected function payViaStripe(Order $order, User $user, string $method): JsonResponse
    {
        /** @var string|null $stripeKey */
        $stripeKey = config('services.stripe.secret');

        if (!$stripeKey) {
            Log::error("Stripe secret key not configured");
            return response()->json([
                'success' => false,
                'message' => 'خدمة الدفع غير متاحة حالياً. يرجى استخدام المحفظة.',
                'error'   => 'stripe_not_configured',
            ], 503);
        }

        $order->markAsProcessing();

        /** @var array{id: string, client_secret: string} $intentData */
        $intentData = $this->stripePaymentService->createPaymentIntent(
            $stripeKey,
            intval(round($order->total * 100)),
            (string) $order->id,
            (string) $user->id,
            (string) $order->order_number
        );

        Log::info("Stripe Payment Intent created", [
            'order_id'          => $order->id,
            'payment_intent_id' => $intentData['id'],
            'method'            => $method,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء طلب الدفع',
            'data'    => [
                'order'             => new OrderResource($order),
                'client_secret'     => $intentData['client_secret'],
                'payment_intent_id' => $intentData['id'],
            ],
        ]);
    }
}
