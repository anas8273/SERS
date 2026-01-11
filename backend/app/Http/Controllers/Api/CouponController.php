<?php
// app/Http/Controllers/Api/CouponController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CouponController
 * 
 * Handles coupon validation and application.
 * Public endpoint for validation, protected for applying to orders.
 * 
 * @package App\Http\Controllers\Api
 */
class CouponController extends Controller
{
    /**
     * Validate a coupon code.
     * 
     * POST /api/coupons/validate
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function validate(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:50',
            'order_total' => 'sometimes|numeric|min:0',
        ]);

        $code = strtoupper(trim($request->code));
        $orderTotal = $request->order_total ?? 0;

        // Find coupon
        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            return response()->json([
                'success' => false,
                'message' => 'كود الخصم غير صالح',
                'data' => [
                    'valid' => false,
                    'error' => 'not_found',
                ],
            ], 404);
        }

        // Check if coupon is valid
        if (!$coupon->isValid()) {
            $errorMessage = $this->getInvalidReason($coupon);
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'data' => [
                    'valid' => false,
                    'error' => 'invalid',
                ],
            ], 400);
        }

        // Check if user can use it (if authenticated)
        if ($request->user() && !$coupon->canBeUsedBy($request->user()->id)) {
            return response()->json([
                'success' => false,
                'message' => 'لقد استخدمت هذا الكود الحد الأقصى المسموح',
                'data' => [
                    'valid' => false,
                    'error' => 'user_limit_exceeded',
                ],
            ], 400);
        }

        // Check minimum order amount
        if (!$coupon->appliesTo($orderTotal)) {
            return response()->json([
                'success' => false,
                'message' => "الحد الأدنى للطلب {$coupon->min_order_amount} ر.س",
                'data' => [
                    'valid' => false,
                    'error' => 'min_order_not_met',
                    'min_order_amount' => (float) $coupon->min_order_amount,
                ],
            ], 400);
        }

        // Calculate discount
        $discount = $coupon->calculateDiscount($orderTotal);

        return response()->json([
            'success' => true,
            'message' => 'كود الخصم صالح',
            'data' => [
                'valid' => true,
                'coupon' => [
                    'id' => $coupon->id,
                    'code' => $coupon->code,
                    'description' => $coupon->description,
                    'discount_type' => $coupon->discount_type,
                    'discount_value' => (float) $coupon->discount_value,
                    'formatted_discount' => $coupon->formatted_discount,
                    'min_order_amount' => (float) $coupon->min_order_amount,
                    'max_discount' => $coupon->max_discount ? (float) $coupon->max_discount : null,
                    'expires_at' => $coupon->expires_at?->toISOString(),
                ],
                'calculated_discount' => $discount,
                'new_total' => round($orderTotal - $discount, 2),
            ],
        ]);
    }

    /**
     * Get reason why coupon is invalid.
     */
    private function getInvalidReason(Coupon $coupon): string
    {
        if (!$coupon->is_active) {
            return 'كود الخصم غير نشط';
        }

        $now = now();
        if ($coupon->starts_at && $now->lt($coupon->starts_at)) {
            return 'كود الخصم لم يبدأ بعد';
        }

        if ($coupon->expires_at && $now->gt($coupon->expires_at)) {
            return 'كود الخصم منتهي الصلاحية';
        }

        if ($coupon->max_uses !== null && $coupon->used_count >= $coupon->max_uses) {
            return 'كود الخصم استنفد الحد الأقصى للاستخدام';
        }

        return 'كود الخصم غير صالح';
    }

    /**
     * List all coupons (Admin only).
     * 
     * GET /api/admin/coupons
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $coupons = Coupon::latest()
            ->when($request->active, fn($q) => $q->active())
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $coupons,
        ]);
    }

    /**
     * Create a new coupon (Admin only).
     * 
     * POST /api/admin/coupons
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code',
            'description_ar' => 'nullable|string|max:255',
            'description_en' => 'nullable|string|max:255',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'max_uses_per_user' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'boolean',
        ]);

        // Uppercase the code
        $validated['code'] = strtoupper(trim($validated['code']));

        // Validate percentage discount
        if ($validated['discount_type'] === 'percentage' && $validated['discount_value'] > 100) {
            return response()->json([
                'success' => false,
                'message' => 'نسبة الخصم لا يمكن أن تتجاوز 100%',
            ], 422);
        }

        $coupon = Coupon::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء كود الخصم بنجاح',
            'data' => $coupon,
        ], 201);
    }

    /**
     * Update a coupon (Admin only).
     * 
     * PUT /api/admin/coupons/{id}
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);

        $validated = $request->validate([
            'code' => 'sometimes|string|max:50|unique:coupons,code,' . $id,
            'description_ar' => 'nullable|string|max:255',
            'description_en' => 'nullable|string|max:255',
            'discount_type' => 'sometimes|in:percentage,fixed',
            'discount_value' => 'sometimes|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'max_uses_per_user' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $coupon->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث كود الخصم بنجاح',
            'data' => $coupon->fresh(),
        ]);
    }

    /**
     * Delete a coupon (Admin only).
     * 
     * DELETE /api/admin/coupons/{id}
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف كود الخصم بنجاح',
        ]);
    }
}
