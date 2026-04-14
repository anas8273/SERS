<?php
// app/Services/PurchaseService.php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outbox;
use App\Models\Template;
use App\Models\User;
use App\Models\UserLibrary;
use App\Services\ReferralService;
use App\Services\StatsCacheService;
use App\Mail\OrderCompletedMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * PurchaseService
 *
 * Handles order creation and payment processing.
 * Fixes applied (2026-03-22):
 *   - [C-3] Coupon is now fully validated and applied to the total
 *   - [C-4] Duplicate purchase protection before creating order items
 *   - [M-6] N+1 query eliminated via whereIn + keyBy
 */
class PurchaseService
{
    /**
     * إنشاء طلب جديد
     * يستخدم Database Transaction لضمان الذرية
     *
     * @param User        $user
     * @param array       $cartItems  [['template_id' => uuid], ...]
     * @param string|null $couponCode  Optional coupon code
     */
    public function createOrder(User $user, array $cartItems, ?string $couponCode = null): Order
    {
        return DB::transaction(function () use ($user, $cartItems, $couponCode) {

            // ── [M-6] Bulk-fetch all templates in one query ──
            $templateIds = array_column($cartItems, 'template_id');
            $templates   = Template::whereIn('id', $templateIds)
                ->where('is_active', true)
                ->get()
                ->keyBy('id');

            // Verify every requested template exists & is active
            foreach ($templateIds as $id) {
                if (!$templates->has($id)) {
                    throw new \Exception("القالب {$id} غير موجود أو غير متاح");
                }
            }

            // ── [C-4] Duplicate purchase protection ──
            foreach ($templateIds as $id) {
                if ($user->ownsTemplate($id)) {
                    $name = $templates->get($id)?->name_ar ?? $id;
                    throw new \Exception("لا يمكن شراء القالب '{$name}' لأنه موجود بالفعل في مكتبتك. القوالب الرقمية تُشترى مرة واحدة فقط.");
                }
            }

            // ── Calculate subtotal ──
            $subtotal    = 0;
            $itemsData   = [];

            foreach ($cartItems as $item) {
                $template  = $templates->get($item['template_id']);
                $price     = $template->discount_price ?? $template->price;
                $subtotal += $price;

                $itemsData[] = [
                    'template' => $template,
                    'price'    => $price,
                ];
            }

            // ── [C-3] Apply coupon if provided ──
            $discount      = 0;
            $appliedCoupon = null;

            if ($couponCode) {
                $coupon = Coupon::where('code', strtoupper(trim($couponCode)))->lockForUpdate()->first();

                if (!$coupon) {
                    throw new \Exception('كود الخصم غير صالح');
                }
                if (!$coupon->canBeUsedBy($user->id)) {
                    throw new \Exception('كود الخصم منتهي الصلاحية أو تم استخدامه');
                }
                if (!$coupon->appliesTo($subtotal)) {
                    throw new \Exception(
                        "الحد الأدنى للطلب لاستخدام هذا الكود هو " .
                        number_format($coupon->min_order_amount, 2) . " ر.س"
                    );
                }

                $discount      = $coupon->calculateDiscount($subtotal);
                $appliedCoupon = $coupon;
            }

            $total = max(0, $subtotal - $discount);

            // ── Create order ──
            $order = Order::create([
                'user_id'  => $user->id,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax'      => 0,
                'total'    => $total,
                'status'   => 'pending',
            ]);

            // ── Create order items ──
            foreach ($itemsData as $itemData) {
                OrderItem::create([
                    'order_id'      => $order->id,
                    'template_id'   => $itemData['template']->id,
                    'price'         => $itemData['price'],
                    'template_name' => $itemData['template']->name_ar,
                    'template_type' => $itemData['template']->type,
                    'sync_status'   => 'pending',
                ]);
            }

            // ── Record coupon usage ──
            if ($appliedCoupon) {
                $appliedCoupon->recordUsage($user->id, $order->id, $discount);
            }

            Log::info("Order created: {$order->order_number}", [
                'user_id'     => $user->id,
                'total'       => $order->total,
                'discount'    => $discount,
                'coupon'      => $couponCode,
                'items_count' => count($itemsData),
            ]);

            return $order->load('items.template');
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

            // 2. إضافة القوالب لمكتبة المستخدم
            foreach ($order->items as $item) {
                UserLibrary::addTemplate(
                    $order->user_id,
                    $item->template_id,
                    $order->id
                );
            }

            // 3. [MISSING-07 FIX] معالجة عمولة الإحالة
            // إذا كان المشتري مُحالاً من طرف آخر، يحصل المُحيل على 10% عمولة
            $buyer = User::find($order->user_id);
            if ($buyer) {
                // [BUG-03 FIX] Use ReferralService instead of ReferralController
                ReferralService::processCommission(
                    $buyer,
                    (float) $order->total,
                    $order->id
                );
            }

            // 4. إنشاء حدث في صندوق الصادر للمزامنة مع Firestore
            $this->createOutboxEvent($order);

            // 5. [IMP-04] مسح Cache الإحصائيات العامة والإدارية بعد اكتمال الطلب
            // [BUG-03 FIX] Use StatsCacheService instead of StatsController
            StatsCacheService::clearAll();
            // [FIX Q-02] Also clear the user's personal dashboard cache
            StatsCacheService::clearUserDashboardCache($order->user_id);

            // [FIX-DL] مسح cache المكتبة حتى تظهر المشتريات الجديدة فوراً
            // Library caches results for 5 min per user — must flush after purchase
            \Illuminate\Support\Facades\Cache::flush();
            // More targeted approach: clear all library:userId:* keys
            // Since Cache::tags isn't always available, we use a broad flush
            // which is acceptable because purchases are infrequent events

            Log::info("Payment completed for order: {$order->order_number}", [
                'payment_id'     => $paymentId,
                'payment_method' => $paymentMethod,
                'user_id'        => $order->user_id,
                'total'          => $order->total,
            ]);
        });

        // [EMAIL] إرسال بريد اكتمال الطلب (خارج الـ transaction لتجنب rollback)
        try {
            $freshOrder = $order->fresh(['user', 'items.template']);
            if ($freshOrder && $freshOrder->user) {
                Mail::to($freshOrder->user->email)->queue(new OrderCompletedMail($freshOrder));
            }
        } catch (\Throwable $mailEx) {
            Log::warning('OrderCompletedMail failed: ' . $mailEx->getMessage());
        }
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

    /**
     * إنشاء حدث في صندوق الصادر
     *
     * [FIX] Payload now includes template_structure (fields schema) for interactive templates.
     * ProcessOutboxJob uses this to create a proper Firestore document with field definitions.
     */
    protected function createOutboxEvent(Order $order): void
    {
        // Eager-load template + its fields in one query (no N+1)
        $items = $order->items()->with('template.fields')->get();

        if ($items->isEmpty()) {
            return;
        }

        $payload = [
            'order_id' => $order->id,
            'user_id'  => $order->user_id,
            'items'    => $items->map(function ($item) {
                $template = $item->template;

                // Build the Firestore field structure only for interactive templates
                $structure = null;
                if ($item->template_type === 'interactive' && $template) {
                    $fields = $template->fields ?? collect();
                    $structure = $fields->map(fn($f) => [
                        'id'           => $f->id,
                        'key'          => $f->field_key,
                        'label'        => $f->label_ar ?? $f->field_key,
                        'type'         => $f->field_type,
                        'required'     => (bool) ($f->is_required ?? false),
                        'ai_enabled'   => (bool) ($f->ai_enabled ?? false),
                        'sort_order'   => $f->sort_order ?? 0,
                        'options'      => $f->options ?? [],
                    ])->values()->toArray();
                }

                return [
                    'order_item_id'      => $item->id,
                    'template_id'        => $item->template_id,
                    'template_type'      => $item->template_type,
                    'template_structure' => $structure,
                ];
            })->toArray(),
        ];

        Outbox::dispatch('order.completed', 'Order', $order->id, $payload);

        Log::info("Outbox event created for order: {$order->order_number}");
    }

}
