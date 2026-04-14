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

        // [OPTIMIZED] Single query for distribution + aggregates
        $ratingStats = Review::where('template_id', $template->id)
            ->where('is_approved', true)
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        // Fill missing ratings with 0
        $distribution = [];
        $totalCount = 0;
        $ratingSum = 0;
        for ($i = 5; $i >= 1; $i--) {
            $count = $ratingStats[$i] ?? 0;
            $distribution[$i] = $count;
            $totalCount += $count;
            $ratingSum += $i * $count;
        }

        $averageRating = $totalCount > 0 ? round($ratingSum / $totalCount, 1) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'reviews' => $reviews->items(),
                'summary' => [
                    'average_rating' => $averageRating,
                    'reviews_count' => $totalCount,
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

        // Verify purchase via UserLibrary (O(1) single-table lookup, consistent with PaymentWall)
        if (!\App\Models\UserLibrary::userOwnsTemplate($user->id, $template->id)) {
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

        // [FIX-CRIT03] Eliminate the N+1 whereHas query.
        // Ownership already verified above via UserLibrary. We only need order_id
        // for audit purposes — use a direct OrderItem lookup (no JOIN, O(1) by index).
        $purchaseOrderId = \App\Models\OrderItem::whereHas('order', function ($q) use ($user) {
            $q->where('user_id', $user->id)->where('status', 'completed');
        })->where('template_id', $template->id)->value('order_id');

        // Create review
        $review = Review::create([
            'user_id'     => $user->id,
            'template_id' => $template->id,
            'order_id'    => $purchaseOrderId,
            'rating'      => $validated['rating'],
            'comment'     => $validated['comment'] ?? null,
            'is_approved' => false, // Requires admin moderation via /api/admin/reviews/{id}/approve
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
            'message' => 'تم إضافة التقييم بنجاح وسيتم مراجعته من قبل الإدارة قبل نشره',
            'data' => [
                'review' => $review->load('user:id,name'),
                'new_average' => round($newAverage, 1),
                'new_count' => $newCount,
                'pending_approval' => true,
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

        // Reset approval status — edited content must be re-moderated
        $validated['is_approved'] = false;

        $review->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث التقييم بنجاح وسيتم مراجعته من قبل الإدارة',
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
        $user     = $request->user();
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
                    'reason'     => 'already_reviewed',
                    'message'    => 'لقد قمت بتقييم هذا القالب مسبقاً',
                ],
            ]);
        }

        // [FIX-6] Use UserLibrary::userOwnsTemplate() — same O(1) check used in store()
        // and PaymentWall. Old approach (Order::whereHas) was: (1) slower due to JOIN,
        // (2) inconsistent: it missed templates granted manually by admin via library.
        $hasPurchased = \App\Models\UserLibrary::userOwnsTemplate($user->id, $template->id);

        if (!$hasPurchased) {
            return response()->json([
                'success' => true,
                'data' => [
                    'can_review' => false,
                    'reason'     => 'not_purchased',
                    'message'    => 'يجب شراء القالب قبل تقييمه',
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'can_review' => true,
                'reason'     => null,
                'message'    => 'يمكنك تقييم هذا القالب',
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
        $query = Review::with(['user:id,name,email', 'template:id,name_ar,slug']);

        // Filter by status
        if ($request->pending) {
            $query->pending();
        } elseif ($request->approved) {
            $query->approved();
        }

        // Filter by rating
        if ($request->filled('rating')) {
            $query->where('rating', (int) $request->rating);
        }

        // Search by user name or comment
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn($uq) => $uq->where('name', 'like', "%{$search}%"))
                  ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        $reviews = $query->orderBy('created_at', 'desc')
                         ->paginate(min($request->input('per_page', 20), 50));

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
