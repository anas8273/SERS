<?php
// app/Services/PurchaseService.php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outbox;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PurchaseService
{
    /**
     * إنشاء طلب جديد
     * يستخدم Database Transaction لضمان الذرية
     */
    public function createOrder(User $user, array $cartItems): Order
    {
        return DB::transaction(function () use ($user, $cartItems) {
            // حساب المجموع
            $subtotal = 0;
            $itemsData = [];

            foreach ($cartItems as $item) {
                $product = Product::findOrFail($item['product_id']);
                $price = $product->effective_price;
                $subtotal += $price;

                $itemsData[] = [
                    'product' => $product,
                    'price' => $price,
                ];
            }

            // إنشاء الطلب
            $order = Order::create([
                'user_id' => $user->id,
                'subtotal' => $subtotal,
                'discount' => 0,
                'tax' => 0,
                'total' => $subtotal,
                'status' => 'pending',
            ]);

            // إنشاء عناصر الطلب
            foreach ($itemsData as $itemData) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemData['product']->id,
                    'price' => $itemData['price'],
                    'product_name' => $itemData['product']->name_ar,
                    'product_type' => $itemData['product']->type,
                    'sync_status' => 'pending',
                ]);
            }

            Log::info("Order created: {$order->order_number}", [
                'user_id' => $user->id,
                'total' => $order->total,
                'items_count' => count($itemsData),
            ]);

            return $order->load('items.product');
        });
    }

    /**
     * إتمام عملية الدفع
     * هذه الدالة تُستدعى بعد نجاح الدفع من البوابة
     */
    public function completePayment(Order $order, string $paymentId, string $paymentMethod, array $paymentDetails = []): void
    {
        DB::transaction(function () use ($order, $paymentId, $paymentMethod, $paymentDetails) {
            // 1. تحديث حالة الطلب
            $order->markAsPaid($paymentId, $paymentMethod, $paymentDetails);

            // 2. تحديث عدد التحميلات للمنتجات
            foreach ($order->items as $item) {
                $item->product->increment('downloads_count');
            }

            // 3. إنشاء حدث في صندوق الصادر للمزامنة مع Firestore
            $this->createOutboxEvent($order);

            Log::info("Payment completed for order: {$order->order_number}", [
                'payment_id' => $paymentId,
                'payment_method' => $paymentMethod,
            ]);
        });
    }

    /**
     * إنشاء حدث في صندوق الصادر
     * هذا يضمن أن المزامنة ستحدث حتى لو فشلت في المحاولة الأولى
     */
    protected function createOutboxEvent(Order $order): void
    {
        $interactiveItems = $order->items()
            ->where('product_type', 'interactive')
            ->with('product')
            ->get();

        if ($interactiveItems->isEmpty()) {
            return; // لا توجد قوالب تفاعلية تحتاج مزامنة
        }

        $payload = [
            'order_id' => $order->id,
            'user_id' => $order->user_id,
            'items' => $interactiveItems->map(function ($item) {
                return [
                    'order_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_type' => $item->product_type,
                    'template_structure' => $item->product->template_structure,
                ];
            })->toArray(),
        ];

        Outbox::dispatch('order.completed', 'Order', $order->id, $payload);

        Log::info("Outbox event created for order: {$order->order_number}");
    }

    /**
     * التعامل مع فشل الدفع
     */
    public function handlePaymentFailure(Order $order, string $reason): void
    {
        $order->markAsFailed($reason);

        Log::warning("Payment failed for order: {$order->order_number}", [
            'reason' => $reason,
        ]);
    }
}