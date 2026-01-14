<?php
// app/Http/Controllers/Api/WishlistController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * WishlistController
 * 
 * Manages user wishlist operations (favorites).
 * All endpoints require authentication.
 * Updated to use templates instead of products.
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

        $wishlists = Wishlist::with(['template' => function ($query) {
                $query->select([
                    'id', 'name_ar', 'name_en', 'slug', 'price', 
                    'discount_price', 'thumbnail_url', 'type', 'is_active'
                ]);
            }])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Filter out inactive templates
        $wishlists = $wishlists->filter(fn($w) => $w->template && $w->template->is_active);

        return response()->json([
            'success' => true,
            'data' => $wishlists->map(function ($wishlist) {
                return [
                    'id' => $wishlist->id,
                    'template_id' => $wishlist->template_id,
                    'template' => $wishlist->template,
                    'added_at' => $wishlist->created_at->toISOString(),
                ];
            })->values(),
        ]);
    }

    /**
     * Get wishlist template IDs for quick lookup.
     * 
     * GET /api/wishlists/ids
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function ids(Request $request): JsonResponse
    {
        $user = $request->user();

        $templateIds = Wishlist::where('user_id', $user->id)
            ->pluck('template_id');

        return response()->json([
            'success' => true,
            'data' => $templateIds,
        ]);
    }

    /**
     * Toggle template in wishlist (add if not exists, remove if exists).
     * 
     * POST /api/wishlists/toggle
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function toggle(Request $request): JsonResponse
    {
        $request->validate([
            'template_id' => 'required|uuid|exists:templates,id',
        ]);

        $user = $request->user();
        $templateId = $request->template_id;

        // Check if template is active
        $template = Template::where('id', $templateId)->where('is_active', true)->first();
        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'القالب غير متاح',
            ], 404);
        }

        // Check if already in wishlist
        $existing = Wishlist::where('user_id', $user->id)
            ->where('template_id', $templateId)
            ->first();

        if ($existing) {
            // Remove from wishlist
            $existing->delete();

            return response()->json([
                'success' => true,
                'message' => 'تمت إزالة القالب من المفضلة',
                'data' => [
                    'action' => 'removed',
                    'template_id' => $templateId,
                    'is_wishlisted' => false,
                ],
            ]);
        }

        // Add to wishlist
        $wishlist = Wishlist::create([
            'user_id' => $user->id,
            'template_id' => $templateId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة القالب للمفضلة',
            'data' => [
                'action' => 'added',
                'wishlist_id' => $wishlist->id,
                'template_id' => $templateId,
                'is_wishlisted' => true,
            ],
        ], 201);
    }

    /**
     * Remove template from wishlist.
     * 
     * DELETE /api/wishlists/{templateId}
     * 
     * @param Request $request
     * @param string $templateId
     * @return JsonResponse
     */
    public function destroy(Request $request, string $templateId): JsonResponse
    {
        $user = $request->user();

        $wishlist = Wishlist::where('user_id', $user->id)
            ->where('template_id', $templateId)
            ->first();

        if (!$wishlist) {
            return response()->json([
                'success' => false,
                'message' => 'القالب غير موجود في المفضلة',
            ], 404);
        }

        $wishlist->delete();

        return response()->json([
            'success' => true,
            'message' => 'تمت إزالة القالب من المفضلة',
        ]);
    }

    /**
     * Check if template is in user's wishlist.
     * 
     * GET /api/wishlists/check/{templateId}
     * 
     * @param Request $request
     * @param string $templateId
     * @return JsonResponse
     */
    public function check(Request $request, string $templateId): JsonResponse
    {
        $user = $request->user();

        $isWishlisted = Wishlist::where('user_id', $user->id)
            ->where('template_id', $templateId)
            ->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'template_id' => $templateId,
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
            'message' => "تم حذف {$count} قالب من المفضلة",
            'data' => [
                'deleted_count' => $count,
            ],
        ]);
    }
}
