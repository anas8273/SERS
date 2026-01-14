<?php
// app/Http/Controllers/OrderController.php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * OrderController
 * 
 * Handles order operations.
 * Updated to use templates instead of products.
 */
class OrderController extends Controller
{
    public function __construct(
        protected PurchaseService $purchaseService
    ) {}

    /**
     * عرض طلبات المستخدم
     */
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with('items.template')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($orders),
        ]);
    }

    /**
     * عرض طلب واحد
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $order = $request->user()
            ->orders()
            ->with('items.template')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * إنشاء طلب جديد
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.template_id' => 'required|uuid|exists:templates,id',
        ]);

        $order = $this->purchaseService->createOrder(
            $request->user(),
            $validated['items']
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الطلب بنجاح',
            'data' => new OrderResource($order->load('items.template')),
        ], 201);
    }
}
