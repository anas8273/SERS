<?php
// app/Http/Controllers/Api/OrderController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * OrderController
 * 
 * Handles order listing, creation, and retrieval.
 * Integrates with PurchaseService for order processing.
 * Updated to use templates instead of products.
 * 
 * @package App\Http\Controllers\Api
 */
class OrderController extends Controller
{
    public function __construct(
        protected PurchaseService $purchaseService
    ) {}

    /**
     * List user's orders.
     * 
     * GET /api/orders
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with('items.template:id,name_ar,name_en,thumbnail_url,type')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($orders),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Get a single order by ID.
     * 
     * GET /api/orders/{id}
     * 
     * @param Request $request
     * @param string $id Order UUID
     * @return JsonResponse
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
                'error' => 'not_found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Create a new order.
     * 
     * POST /api/orders
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.template_id' => 'required|uuid|exists:templates,id',
        ], [
            'items.required' => 'يجب إضافة قالب واحد على الأقل',
            'items.min' => 'يجب إضافة قالب واحد على الأقل',
            'items.*.template_id.required' => 'معرف القالب مطلوب',
            'items.*.template_id.exists' => 'القالب غير موجود',
        ]);

        try {
            $order = $this->purchaseService->createOrder(
                $request->user(),
                $validated['items']
            );

            Log::info("Order created", [
                'order_id' => $order->id,
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الطلب بنجاح',
                'data' => new OrderResource($order->load('items.template')),
            ], 201);

        } catch (\Throwable $e) {
            Log::error("Failed to create order", [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء الطلب',
                'error' => 'create_error',
            ], 500);
        }
    }

    /**
     * Simulate payment for an order (For testing/demo purposes).
     * 
     * POST /api/orders/{id}/pay
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function pay(Request $request, string $id): JsonResponse
    {
        $order = $request->user()->orders()->findOrFail($id);

        if ($order->status === 'completed') {
            return response()->json([
                'success' => true,
                'message' => 'الطلب مدفوع مسبقاً',
                'data' => new OrderResource($order),
            ]);
        }

        try {
            // Simulate a payment ID
            $paymentId = 'PAY-' . strtoupper(uniqid());
            
            $this->purchaseService->completePayment(
                $order,
                $paymentId,
                'credit_card', // Default to credit card for demo
                ['simulated' => true]
            );

            return response()->json([
                'success' => true,
                'message' => 'تم الدفع بنجاح',
                'data' => new OrderResource($order->fresh('items.template')),
            ]);

        } catch (\Throwable $e) {
            Log::error("Failed to pay order", [
                'order_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'فشلت عملية الدفع',
                'error' => 'payment_error',
            ], 500);
        }
    }
}
