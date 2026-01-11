<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminOrderController extends Controller
{
    public function index()
    {
        $orders = Order::with(['user', 'items'])
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\OrderResource::collection($orders),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ]
        ]);
    }

    public function show($id)
    {
        $order = Order::with(['user', 'items'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => new \App\Http\Resources\OrderResource($order),
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,completed,cancelled,refunded',
        ]);

        try {
            $order = Order::findOrFail($id);
            $oldStatus = $order->status;
            $order->status = $request->status;
            
            // If completing the order, set paid_at timestamp
            if ($request->status === 'completed' && !$order->paid_at) {
                $order->paid_at = now();
            }
            
            $order->save();

            Log::info("Order status updated", [
                'order_id' => $id,
                'old_status' => $oldStatus,
                'new_status' => $request->status,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث حالة الطلب بنجاح',
                'data' => new \App\Http\Resources\OrderResource($order->fresh(['user', 'items'])),
            ]);
        } catch (\Throwable $e) {
            Log::error("Failed to update order status", [
                'order_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'فشل في تحديث حالة الطلب',
            ], 500);
        }
    }
}
