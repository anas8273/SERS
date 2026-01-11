<?php
// app/Http/Controllers/Api/WishlistController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * WishlistController
 * 
 * Manages user wishlist operations (favorites).
 * All endpoints require authentication.
 * 
 * @package App\Http\Controllers\Api
 */
class WishlistController extends Controller
{
    /**
     * Get user's wishlist items.
     * 
     * GET /api/wishlists
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $wishlists = Wishlist::with(['product' => function ($query) {
                $query->select([
                    'id', 'name_ar', 'name_en', 'slug', 'price', 
                    'discount_price', 'thumbnail_url', 'type',
                    'average_rating', 'reviews_count', 'is_active'
                ]);
            }])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        // Filter out inactive products
        $wishlists = $wishlists->filter(fn($w) => $w->product && $w->product->is_active);

        return response()->json([
            'success' => true,
            'data' => $wishlists->map(function ($wishlist) {
                return [
                    'id' => $wishlist->id,
                    'product_id' => $wishlist->product_id,
                    'product' => $wishlist->product,
                    'added_at' => $wishlist->created_at->toISOString(),
                ];
            })->values(),
        ]);
    }

    /**
     * Get wishlist product IDs for quick lookup.
     * 
     * GET /api/wishlists/ids
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function ids(Request $request): JsonResponse
    {
        $user = $request->user();

        $productIds = Wishlist::where('user_id', $user->id)
            ->pluck('product_id');

        return response()->json([
            'success' => true,
            'data' => $productIds,
        ]);
    }

    /**
     * Toggle product in wishlist (add if not exists, remove if exists).
     * 
     * POST /api/wishlists/toggle
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function toggle(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
        ]);

        $user = $request->user();
        $productId = $request->product_id;

        // Check if product is active
        $product = Product::where('id', $productId)->where('is_active', true)->first();
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'المنتج غير متاح',
            ], 404);
        }

        // Check if already in wishlist
        $existing = Wishlist::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            // Remove from wishlist
            $existing->delete();

            return response()->json([
                'success' => true,
                'message' => 'تمت إزالة المنتج من المفضلة',
                'data' => [
                    'action' => 'removed',
                    'product_id' => $productId,
                    'is_wishlisted' => false,
                ],
            ]);
        }

        // Add to wishlist
        $wishlist = Wishlist::create([
            'user_id' => $user->id,
            'product_id' => $productId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة المنتج للمفضلة',
            'data' => [
                'action' => 'added',
                'wishlist_id' => $wishlist->id,
                'product_id' => $productId,
                'is_wishlisted' => true,
            ],
        ], 201);
    }

    /**
     * Remove product from wishlist.
     * 
     * DELETE /api/wishlists/{productId}
     * 
     * @param Request $request
     * @param string $productId
     * @return JsonResponse
     */
    public function destroy(Request $request, string $productId): JsonResponse
    {
        $user = $request->user();

        $wishlist = Wishlist::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->first();

        if (!$wishlist) {
            return response()->json([
                'success' => false,
                'message' => 'المنتج غير موجود في المفضلة',
            ], 404);
        }

        $wishlist->delete();

        return response()->json([
            'success' => true,
            'message' => 'تمت إزالة المنتج من المفضلة',
        ]);
    }

    /**
     * Check if product is in user's wishlist.
     * 
     * GET /api/wishlists/check/{productId}
     * 
     * @param Request $request
     * @param string $productId
     * @return JsonResponse
     */
    public function check(Request $request, string $productId): JsonResponse
    {
        $user = $request->user();

        $isWishlisted = Wishlist::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'product_id' => $productId,
                'is_wishlisted' => $isWishlisted,
            ],
        ]);
    }

    /**
     * Clear all wishlist items.
     * 
     * DELETE /api/wishlists
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function clear(Request $request): JsonResponse
    {
        $user = $request->user();

        $count = Wishlist::where('user_id', $user->id)->delete();

        return response()->json([
            'success' => true,
            'message' => "تم حذف {$count} منتج من المفضلة",
            'data' => [
                'deleted_count' => $count,
            ],
        ]);
    }
}
