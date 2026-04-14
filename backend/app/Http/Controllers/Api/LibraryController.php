<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserLibrary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * LibraryController
 *
 * [FIX HL-04] Unified Library endpoint — single source of truth using UserLibrary,
 * replacing the fragile pattern of extracting library data from completed orders.
 *
 * Before (my-library/page.tsx): GET /orders?per_page=100 → filter completed → extract items
 * After: GET /library → dedicated UserLibrary query with eager loading
 *
 * Benefits:
 * - Correct even if order status changes (e.g., partial refund)
 * - Consistent with PaymentWall::handle() which uses UserLibrary::userOwnsTemplate()
 * - One SQL query vs N+1 via orders iteration
 */
class LibraryController extends Controller
{
    /**
     * GET /api/library
     * Returns the authenticated user's owned templates (from UserLibrary).
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $userId    = (string) Auth::id();
            $perPage   = min($request->input('per_page', 20), 100);
            $page      = max(1, (int) $request->input('page', 1));
            $search    = $request->input('q');
            $sortDir   = $request->input('sort', 'desc') === 'asc' ? 'asc' : 'desc';

            // [PERF] Cache per user+page (5 min). Library rarely changes mid-session.
            // Cache is busted in PurchaseService after a successful purchase.
            $cacheKey = "library:{$userId}:p{$page}:s{$sortDir}:" . md5($search ?? '');
            $result   = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($userId, $perPage, $page, $search, $sortDir) {

                $query = UserLibrary::where('user_id', $userId)
                    ->with([
                        // [PERF] Load only needed columns — avoids loading large blobs
                        'template:id,name_ar,slug,thumbnail,type,category_id',
                        // [PERF] Load category name in one join instead of N+1
                        'template.category:id,name_ar',
                        'order:id,order_number,total,status,paid_at',
                        // [FIX-DL] Eager-load order items so we can find the correct order_item_id for downloads
                        'order.items:id,order_id,template_id',
                    ])
                    ->orderBy('purchased_at', $sortDir);

                if ($search) {
                    $query->whereHas('template', fn($q) =>
                        $q->where('name_ar', 'like', '%' . $search . '%')
                    );
                }

                $paginated = $query->paginate($perPage, ['*'], 'page', $page);

                $items = $paginated->map(function (UserLibrary $entry) {
                    $template = $entry->template;

                    // [FIX-DL] Find the actual OrderItem ID for the download endpoint
                    // The download API expects an order_item_id, NOT a user_library id
                    $orderItemId = null;
                    if ($entry->order && $entry->order->items) {
                        $matchingItem = $entry->order->items->firstWhere('template_id', $entry->template_id);
                        $orderItemId = $matchingItem?->id;
                    }

                    return [
                        'id'             => $entry->id,
                        'order_item_id'  => $orderItemId, // [FIX-DL] Correct ID for downloads
                        'template_id'    => $entry->template_id,
                        'order_id'       => $entry->order_id,
                        'order_number'   => $entry->order?->order_number,
                        'purchased_at'   => $entry->purchased_at ? \Carbon\Carbon::parse($entry->purchased_at)->toIso8601String() : null,
                        'title'          => $template?->name_ar ?? 'قالب',
                        'thumbnail'      => $template?->thumbnail_url,
                        'type'           => $template?->type,
                        'slug'           => $template?->slug,
                        'category_name'  => $template?->category?->name_ar ?? '',
                        'price_paid'     => (float) ($entry->order?->total ?? 0),
                        'order_status'   => $entry->order?->status ?? 'completed',
                    ];
                });

                return [
                    'items'        => $items,
                    'current_page' => $paginated->currentPage(),
                    'last_page'    => $paginated->lastPage(),
                    'total'        => $paginated->total(),
                    'per_page'     => $paginated->perPage(),
                ];
            });

            return response()->json([
                'success' => true,
                'data'    => $result['items'],
                'meta'    => [
                    'current_page' => $result['current_page'],
                    'last_page'    => $result['last_page'],
                    'total'        => $result['total'],
                    'per_page'     => $result['per_page'],
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error('LibraryController::index error', [
                'user_id' => Auth::id(),
                'error'   => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب المكتبة. يرجى المحاولة لاحقاً.',
            ], 500);
        }
    }


    /**
     * GET /api/library/count
     * Returns the total count of owned templates (lightweight endpoint).
     */
    public function count(): JsonResponse
    {
        $count = UserLibrary::where('user_id', Auth::id())->count();
        return response()->json(['success' => true, 'data' => ['count' => $count]]);
    }
}
