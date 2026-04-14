<?php
// app/Http/Controllers/Api/StatsController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Template;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\StatsCacheService;
use Carbon\Carbon;

/**
 * StatsController
 * 
 * Provides analytics and statistics for admin dashboard.
 * Uses caching to improve performance.
 * All endpoints require admin authentication.
 * Updated to use templates instead of products.
 * 
 * @package App\Http\Controllers\Api
 */
class StatsController extends Controller
{
    /**
     * Cache TTL in seconds (5 minutes for stats)
     */
    private const STATS_CACHE_TTL = 300;
    
    /**
     * Cache TTL for chart data (1 minute - more fresh)
     */
    private const CHART_CACHE_TTL = 60;

    /**
     * Public stats for the homepage — no authentication required.
     * Returns aggregate counts for display to visitors.
     * Cached for 10 minutes — invalidated on order completion.
     * 
     * GET /api/stats/public
     */
    public function publicStats(): JsonResponse
    {
        try {
            $data = Cache::remember('public_homepage_stats', 600, function () {
                $totalUsers     = User::where('is_active', true)->count();
                $totalTemplates = Template::where('is_active', true)->count();
                $totalSections  = DB::table('sections')->count();

                // Average rating — fallback to 4.9 if no reviews yet
                $avgRating = DB::table('reviews')
                    ->where('is_approved', true)
                    ->avg('rating') ?? 4.9;

                // Total completed order items (proxy for "documents generated")
                $totalDocuments = DB::table('order_items')
                    ->join('orders', 'orders.id', '=', 'order_items.order_id')
                    ->where('orders.status', 'completed')
                    ->count();

                return [
                    'total_users'     => $totalUsers,
                    'total_templates' => $totalTemplates,
                    'total_sections'  => $totalSections,
                    'total_documents' => $totalDocuments,
                    'average_rating'  => round((float) $avgRating, 1),
                ];
            });

            return response()->json(['success' => true, 'data' => $data]);

        } catch (\Throwable $e) {
            Log::error('Failed to fetch public stats: ' . $e->getMessage());
            // Return safe fallback — never let homepage break
            return response()->json([
                'success' => true,
                'data' => [
                    'total_users'     => 0,
                    'total_templates' => 0,
                    'total_sections'  => 0,
                    'total_documents' => 0,
                    'average_rating'  => 4.9,
                ],
            ]);
        }
    }

    /**
     * Invalidate the public homepage stats cache.
     * [BUG-03] Delegates to StatsCacheService for proper separation of concerns.
     */
    public static function clearPublicCache(): void
    {
        StatsCacheService::clearPublicCache();
    }

    /**
     * Admin overview stats — called by admin dashboard.
     * 
     * GET /api/admin/stats/overview
     */
    public function adminOverview(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    /**
     * User-facing dashboard stats.
     * GET /api/stats/dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    /**
     * Usage stats stub.
     * GET /api/stats/usage
     */
    public function usage(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    /**
     * Sales stats (admin).
     * GET /api/admin/stats/sales
     */
    public function salesStats(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    /**
     * Users stats (admin).
     * GET /api/admin/stats/users
     */
    public function usersStats(Request $request): JsonResponse
    {
        try {
            $total = User::count();
            $thisMonth = Carbon::now()->startOfMonth();
            $newThisMonth = User::where('created_at', '>=', $thisMonth)->count();
            return response()->json([
                'success' => true,
                'data' => ['total' => $total, 'new_this_month' => $newThisMonth],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch users stats: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'حدث خطأ في جلب إحصائيات المستخدمين'], 500);
        }
    }

    /**
     * Templates stats (admin).
     * GET /api/admin/stats/templates
     */
    public function templatesStats(Request $request): JsonResponse
    {
        try {
            $total = Template::count();
            $active = Template::where('is_active', true)->count();
            return response()->json([
                'success' => true,
                'data' => ['total' => $total, 'active' => $active],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch templates stats: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'حدث خطأ في جلب إحصائيات القوالب'], 500);
        }
    }

    /**
     * Get comprehensive dashboard statistics.
     * 
     * GET /api/admin/stats
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Force refresh if requested
            if ($request->boolean('refresh')) {
                Cache::forget('admin_stats');
            }

            $stats = Cache::remember('admin_stats', self::STATS_CACHE_TTL, function () {
                return $this->calculateStats();
            });

            return response()->json([
                'success' => true,
                'data' => $stats,
                'cached' => !$request->boolean('refresh'),
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch dashboard stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب الإحصائيات',
            ], 500);
        }
    }

    /**
     * Calculate all dashboard statistics.
     */
    private function calculateStats(): array
    {
        // Time periods
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        // Total counts (fast simple queries)
        $totalUsers = User::count();
        $totalTemplates = Template::count();

        // [PERF] Single aggregate query replaces 8 separate Order queries
        // Computes: total orders, total revenue, monthly revenue, last month revenue, today orders, today revenue
        $orderAggregates = DB::table('orders')
            ->where('status', 'completed')
            ->selectRaw('
                COUNT(*) as total_orders,
                COALESCE(SUM(total), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN created_at >= ? THEN total ELSE 0 END), 0) as monthly_revenue,
                COALESCE(SUM(CASE WHEN created_at >= ? AND created_at < ? THEN total ELSE 0 END), 0) as last_month_revenue,
                SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as today_orders,
                COALESCE(SUM(CASE WHEN DATE(created_at) = ? THEN total ELSE 0 END), 0) as today_revenue
            ', [$thisMonth, $lastMonth, $thisMonth, $today->format('Y-m-d'), $today->format('Y-m-d')])
            ->first();

        $totalOrders = (int) $orderAggregates->total_orders;
        $totalRevenue = (float) $orderAggregates->total_revenue;
        $monthlyRevenue = (float) $orderAggregates->monthly_revenue;
        $lastMonthRevenue = (float) $orderAggregates->last_month_revenue;
        $todayOrders = (int) $orderAggregates->today_orders;
        $todayRevenue = (float) $orderAggregates->today_revenue;

        // Revenue trend (percentage change)
        $revenueTrend = $lastMonthRevenue > 0 
            ? round(($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue * 100, 1)
            : 100;

        // Recent orders (latest 5) - eager loaded
        $recentOrders = Order::with(['user:id,name,email', 'items.template:id,name_ar'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'user_name' => $order->user->name ?? 'مستخدم محذوف',
                    'total' => (float) $order->total,
                    'status' => $order->status,
                    'items_count' => $order->items->count(),
                    'created_at' => $order->created_at->toISOString(),
                    'time_ago' => $order->created_at->diffForHumans(),
                ];
            });

        // Top selling templates (using subquery for performance)
        $topTemplates = Template::select('templates.*')
            ->selectRaw('(
                SELECT COUNT(*) FROM order_items 
                INNER JOIN orders ON orders.id = order_items.order_id 
                WHERE order_items.template_id = templates.id 
                AND orders.status = "completed"
            ) as sales_count')
            ->orderByDesc('sales_count')
            ->limit(5)
            ->get()
            ->map(function ($template) {
                $effectivePrice = $template->discount_price ?? $template->price;
                return [
                    'id' => $template->id,
                    'name_ar' => $template->name_ar,
                    'thumbnail_url' => $template->thumbnail_url,
                    'sales_count' => $template->sales_count ?? 0,
                    'revenue' => (float) ($template->sales_count * $effectivePrice),
                ];
            });

        // New users this month
        $newUsersThisMonth = User::where('created_at', '>=', $thisMonth)->count();

        // Orders by status (single query)
        $ordersByStatus = Order::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        // AI Predictions (Mock for 2026)
        $predictedRevenueNextMonth = $monthlyRevenue * (1 + ($revenueTrend / 100));

        return [
            // Overview
            'total_revenue' => (float) $totalRevenue,
            'total_orders' => $totalOrders,
            'total_users' => $totalUsers,
            'total_templates' => $totalTemplates,
            
            // Monthly
            'monthly_revenue' => (float) $monthlyRevenue,
            'revenue_trend' => $revenueTrend,
            'new_users_this_month' => $newUsersThisMonth,
            
            // Today
            'today_orders' => $todayOrders,
            'today_revenue' => (float) $todayRevenue,
            
            // AI Insights
            'ai_insights' => [
                'predicted_revenue' => round($predictedRevenueNextMonth, 2),
                'growth_status' => $revenueTrend >= 0 ? 'صعود' : 'هبوط',
                'recommendation' => $revenueTrend < 5 ? 'أنصح بإطلاق حملة ترويجية للقوالب الأكثر مبيعاً لزيادة العوائد.' : 'الأداء ممتاز، استمر في إضافة قوالب تعليمية جديدة.',
            ],

            // Orders breakdown
            'orders_by_status' => [
                'pending' => $ordersByStatus['pending'] ?? 0,
                'completed' => $ordersByStatus['completed'] ?? 0,
                'cancelled' => $ordersByStatus['cancelled'] ?? 0,
                'refunded' => $ordersByStatus['refunded'] ?? 0,
            ],
            
            // Lists
            'recent_orders' => $recentOrders,
            'top_templates' => $topTemplates,
        ];
    }

    /**
     * Get revenue chart data for the last 7 days.
     * 
     * GET /api/admin/stats/chart
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function chart(Request $request): JsonResponse
    {
        try {
            // Force refresh if requested
            if ($request->boolean('refresh')) {
                Cache::forget('admin_chart');
            }

            $chartData = Cache::remember('admin_chart', self::CHART_CACHE_TTL, function () {
                return $this->calculateChartData();
            });

            return response()->json([
                'success' => true,
                'data' => $chartData,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch chart data: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب بيانات الرسم البياني',
            ], 500);
        }
    }

    /**
     * Calculate chart data for last 7 days.
     */
    private function calculateChartData(): array
    {
        $startDate = Carbon::now()->subDays(6)->startOfDay();

        // [PERF] Single query replaces 2 identical queries — gets both revenue AND orders count
        $rawData = Order::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateKey = $date->format('Y-m-d');
            $row = $rawData->get($dateKey);

            $days[] = [
                'date' => $dateKey,
                'day' => $date->locale('ar')->dayName,
                'revenue' => (float) ($row->revenue ?? 0),
                'orders' => (int) ($row->orders ?? 0),
            ];
        }

        return $days;
    }

    /**
     * Clear stats cache (useful after order completion).
     * [BUG-03] Delegates to StatsCacheService for proper separation of concerns.
     */
    public static function clearCache(): void
    {
        StatsCacheService::clearAdminCache();
    }
}
