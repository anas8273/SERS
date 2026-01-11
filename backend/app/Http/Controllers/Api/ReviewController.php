<?php
// app/Http/Controllers/Api/ReviewController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ReviewController
 * 
 * Handles product reviews with purchase verification.
 * Only users who purchased a product can leave a review.
 * 
 * @package App\Http\Controllers\Api
 */
class ReviewController extends Controller
{
    /**
     * Get reviews for a product.
     * 
     * GET /api/products/{slug}/reviews
     * 
     * @param string $slug
     * @return JsonResponse
     */
    public function index(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();

        $reviews = Review::with(['user:id,name'])
            ->where('product_id', $product->id)
            ->where('is_approved', true)
            ->latest()
            ->paginate(10);

        // Calculate rating distribution
        $ratingDistribution = Review::where('product_id', $product->id)
            ->where('is_approved', true)
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        // Fill missing ratings with 0
        $distribution = [];
        for ($i = 5; $i >= 1; $i--) {
            $distribution[$i] = $ratingDistribution[$i] ?? 0;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'reviews' => $reviews->items(),
                'summary' => [
                    'average_rating' => (float) $product->average_rating,
                    'reviews_count' => $product->reviews_count,
                    'distribution' => $distribution,
                ],
                'pagination' => [
                    'current_page' => $reviews->currentPage(),
                    'last_page' => $reviews->lastPage(),
                    'per_page' => $reviews->perPage(),
                    'total' => $reviews->total(),
                ],
            ],
        ]);
    }

    /**
     * Create a review for a product.
     * 
     * POST /api/products/{slug}/reviews
     * 
     * Requires authentication and purchase verification.
     * 
     * @param Request $request
     * @param string $slug
     * @return JsonResponse
     */
    public function store(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        $product = Product::where('slug', $slug)->firstOrFail();

        // Check if user already reviewed this product
        $existingReview = Review::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'لقد قمت بتقييم هذا المنتج مسبقاً',
            ], 400);
        }

        // Verify purchase - user must have completed order containing this product
        $purchaseOrder = Order::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereHas('items', function ($query) use ($product) {
                $query->where('product_id', $product->id);
            })
            ->first();

        if (!$purchaseOrder) {
            return response()->json([
                'success' => false,
                'message' => 'يجب شراء المنتج قبل تقييمه',
            ], 403);
        }

        // Validate input
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        // Create review
        $review = Review::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'order_id' => $purchaseOrder->id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
            'is_approved' => true, // Auto-approve for now
        ]);

        // Recalculate product rating
        $product->recalculateRating();

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة التقييم بنجاح',
            'data' => [
                'review' => $review->load('user:id,name'),
                'new_average' => $product->fresh()->average_rating,
                'new_count' => $product->fresh()->reviews_count,
            ],
        ], 201);
    }

    /**
     * Update user's review.
     * 
     * PUT /api/reviews/{id}
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        
        $review = Review::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $validated = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update($validated);

        // Recalculate product rating
        $review->product->recalculateRating();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث التقييم بنجاح',
            'data' => $review->fresh()->load('user:id,name'),
        ]);
    }

    /**
     * Delete user's review.
     * 
     * DELETE /api/reviews/{id}
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        
        $review = Review::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $product = $review->product;
        $review->delete();

        // Recalculate product rating
        $product->recalculateRating();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التقييم بنجاح',
        ]);
    }

    /**
     * Check if user can review a product.
     * 
     * GET /api/products/{slug}/can-review
     * 
     * @param Request $request
     * @param string $slug
     * @return JsonResponse
     */
    public function canReview(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        $product = Product::where('slug', $slug)->firstOrFail();

        // Check if already reviewed
        $hasReviewed = Review::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($hasReviewed) {
            return response()->json([
                'success' => true,
                'data' => [
                    'can_review' => false,
                    'reason' => 'already_reviewed',
                    'message' => 'لقد قمت بتقييم هذا المنتج مسبقاً',
                ],
            ]);
        }

        // Check if purchased
        $hasPurchased = Order::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereHas('items', function ($query) use ($product) {
                $query->where('product_id', $product->id);
            })
            ->exists();

        if (!$hasPurchased) {
            return response()->json([
                'success' => true,
                'data' => [
                    'can_review' => false,
                    'reason' => 'not_purchased',
                    'message' => 'يجب شراء المنتج قبل تقييمه',
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'can_review' => true,
                'reason' => null,
                'message' => 'يمكنك تقييم هذا المنتج',
            ],
        ]);
    }

    /**
     * Get user's review for a product.
     * 
     * GET /api/products/{slug}/my-review
     * 
     * @param Request $request
     * @param string $slug
     * @return JsonResponse
     */
    public function myReview(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        $product = Product::where('slug', $slug)->firstOrFail();

        $review = Review::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->first();

        return response()->json([
            'success' => true,
            'data' => $review,
        ]);
    }

    // ==================== ADMIN METHODS ====================

    /**
     * List all reviews (Admin).
     * 
     * GET /api/admin/reviews
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $reviews = Review::with(['user:id,name,email', 'product:id,name_ar,name_en,slug'])
            ->when($request->pending, fn($q) => $q->pending())
            ->when($request->approved, fn($q) => $q->approved())
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $reviews,
        ]);
    }

    /**
     * Approve a review (Admin).
     * 
     * POST /api/admin/reviews/{id}/approve
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function approve(string $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $review->approve();

        return response()->json([
            'success' => true,
            'message' => 'تم الموافقة على التقييم',
            'data' => $review->fresh(),
        ]);
    }

    /**
     * Reject a review (Admin).
     * 
     * POST /api/admin/reviews/{id}/reject
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function reject(string $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $review->reject();

        return response()->json([
            'success' => true,
            'message' => 'تم رفض التقييم',
            'data' => $review->fresh(),
        ]);
    }

    /**
     * Delete a review (Admin).
     * 
     * DELETE /api/admin/reviews/{id}
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function adminDestroy(string $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $product = $review->product;
        
        $review->delete();
        $product->recalculateRating();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التقييم',
        ]);
    }
}
