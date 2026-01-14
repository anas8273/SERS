<?php
// app/Http/Controllers/Api/ReviewController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Template;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ReviewController
 * 
 * Handles template reviews with purchase verification.
 * Only users who purchased a template can leave a review.
 * Updated to use templates instead of products.
 * 
 * @package App\Http\Controllers\Api
 */
class ReviewController extends Controller
{
    /**
     * Get reviews for a template.
     * 
     * GET /api/templates/{slug}/reviews
     * 
     * @param string $slug
     * @return JsonResponse
     */
    public function index(string $slug): JsonResponse
    {
        $template = Template::where('slug', $slug)->firstOrFail();

        $reviews = Review::with(['user:id,name'])
            ->where('template_id', $template->id)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Calculate rating distribution
        $ratingDistribution = Review::where('template_id', $template->id)
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

        // Calculate average rating
        $averageRating = Review::where('template_id', $template->id)
            ->where('is_approved', true)
            ->avg('rating') ?? 0;

        $reviewsCount = Review::where('template_id', $template->id)
            ->where('is_approved', true)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'reviews' => $reviews->items(),
                'summary' => [
                    'average_rating' => round($averageRating, 1),
                    'reviews_count' => $reviewsCount,
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
     * Create a review for a template.
     * 
     * POST /api/templates/{slug}/reviews
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
        $template = Template::where('slug', $slug)->firstOrFail();

        // Check if user already reviewed this template
        $existingReview = Review::where('user_id', $user->id)
            ->where('template_id', $template->id)
            ->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'لقد قمت بتقييم هذا القالب مسبقاً',
            ], 400);
        }

        // Verify purchase - user must have completed order containing this template
        $purchaseOrder = Order::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereHas('items', function ($query) use ($template) {
                $query->where('template_id', $template->id);
            })
            ->first();

        if (!$purchaseOrder) {
            return response()->json([
                'success' => false,
                'message' => 'يجب شراء القالب قبل تقييمه',
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
            'template_id' => $template->id,
            'order_id' => $purchaseOrder->id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
            'is_approved' => true, // Auto-approve for now
        ]);

        // Calculate new average
        $newAverage = Review::where('template_id', $template->id)
            ->where('is_approved', true)
            ->avg('rating') ?? 0;

        $newCount = Review::where('template_id', $template->id)
            ->where('is_approved', true)
            ->count();

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة التقييم بنجاح',
            'data' => [
                'review' => $review->load('user:id,name'),
                'new_average' => round($newAverage, 1),
                'new_count' => $newCount,
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

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التقييم بنجاح',
        ]);
    }

    /**
     * Check if user can review a template.
     * 
     * GET /api/templates/{slug}/can-review
     * 
     * @param Request $request
     * @param string $slug
     * @return JsonResponse
     */
    public function canReview(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        $template = Template::where('slug', $slug)->firstOrFail();

        // Check if already reviewed
        $hasReviewed = Review::where('user_id', $user->id)
            ->where('template_id', $template->id)
            ->exists();

        if ($hasReviewed) {
            return response()->json([
                'success' => true,
                'data' => [
                    'can_review' => false,
                    'reason' => 'already_reviewed',
                    'message' => 'لقد قمت بتقييم هذا القالب مسبقاً',
                ],
            ]);
        }

        // Check if purchased
        $hasPurchased = Order::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereHas('items', function ($query) use ($template) {
                $query->where('template_id', $template->id);
            })
            ->exists();

        if (!$hasPurchased) {
            return response()->json([
                'success' => true,
                'data' => [
                    'can_review' => false,
                    'reason' => 'not_purchased',
                    'message' => 'يجب شراء القالب قبل تقييمه',
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'can_review' => true,
                'reason' => null,
                'message' => 'يمكنك تقييم هذا القالب',
            ],
        ]);
    }

    /**
     * Get user's review for a template.
     * 
     * GET /api/templates/{slug}/my-review
     * 
     * @param Request $request
     * @param string $slug
     * @return JsonResponse
     */
    public function myReview(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        $template = Template::where('slug', $slug)->firstOrFail();

        $review = Review::where('user_id', $user->id)
            ->where('template_id', $template->id)
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
        $reviews = Review::with(['user:id,name,email', 'template:id,name_ar,name_en,slug'])
            ->when($request->pending, fn($q) => $q->pending())
            ->when($request->approved, fn($q) => $q->approved())
            ->orderBy('created_at', 'desc')
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
        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التقييم',
        ]);
    }
}
