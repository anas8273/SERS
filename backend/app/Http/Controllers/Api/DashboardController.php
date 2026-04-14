<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * DashboardController
 *
 * [PERF] Single endpoint — all dashboard stats in ONE optimized response.
 * Firestore calls removed: they take 1-3s each and are non-essential here.
 * Frontend pages (analyses, certificates, etc.) fetch Firestore data themselves.
 *
 * Target: < 80ms response time (all MySQL, fully cached).
 */
class DashboardController extends Controller
{
    /**
     * GET /api/dashboard/summary
     * Returns all stats needed by the dashboard page in a single response.
     * Cached for 10 minutes per user — data changes rarely during a session.
     */
    public function summary(Request $request): JsonResponse
    {
        try {
            $user   = $request->user();
            $userId = (string) $user->id;

            // [PERF] Per-user cache — 10 min TTL.  Default store (database or file).
            $cacheKey = "dash_v2:{$userId}";
            $data = Cache::remember($cacheKey, 600, function () use ($user, $userId) {

                // ── Single aggregate query for all order stats ─────────────
                $orderStats = $user->orders()
                    ->selectRaw(
                        'COUNT(*) as orders_count,
                         COALESCE(SUM(CASE WHEN status = ? THEN total ELSE 0 END), 0) as completed_total',
                        ['completed']
                    )
                    ->first();

                $ordersCount    = (int)   ($orderStats->orders_count  ?? 0);
                $completedTotal = (float) ($orderStats->completed_total ?? 0);

                // ── Recent orders (5 rows, indexed join) ───────────────────
                $recentOrders = $user->orders()
                    ->with('items.template:id,name_ar,thumbnail,type')
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get();

                // ── Lightweight counts (indexed queries, < 5ms each) ───────
                $wishlistCount       = $user->wishlists()->count();
                $reviewsCount        = \App\Models\Review::where('user_id', $userId)->count();
                $unreadNotifications = \App\Models\Notification::where('user_id', $userId)
                    ->where('is_read', false)
                    ->count();

                // ── Firestore edu stats are OMITTED here ───────────────────
                // Each Firestore call = 1-3 seconds.  Dashboard only shows
                // MySQL-sourced KPIs; the detailed edu stats are loaded per-section
                // by the frontend page that actually needs them.
                return [
                    'stats' => [
                        'orders_count'         => $ordersCount,
                        'wishlist_count'        => $wishlistCount,
                        'reviews_count'         => $reviewsCount,
                        'total_spent'           => $completedTotal,
                        'unread_notifications'  => $unreadNotifications,
                        // edu counts default to 0 — frontend enriches them from Firestore
                        'analyses_count'        => 0,
                        'certificates_count'    => 0,
                        'plans_count'           => 0,
                        'achievements_count'    => 0,
                    ],
                    'recent_orders' => $recentOrders,
                ];
            });

            return response()->json([
                'success' => true,
                'data'    => $data,
            ]);

        } catch (\Throwable $e) {
            Log::error('Dashboard summary error', [
                'user_id' => Auth::id(),
                'error'   => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'حدث خطأ في تحميل لوحة المعلومات.',
            ], 500);
        }
    }
}

