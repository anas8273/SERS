<?php
// app/Http/Controllers/Api/StatsController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * StatsController
 * 
 * Provides analytics and statistics for admin dashboard.
 * Uses caching to improve performance.
 * All endpoints require admin authentication.
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
        $totalProducts = Product::count();
        $totalOrders = Order::where('status', 'completed')->count();
        
        // Revenue calculations
        $totalRevenue = Order::where('status', 'completed')->sum('total');
        $monthlyRevenue = Order::where('status', 'completed')
            ->where('created_at', '>=', $thisMonth)
            ->sum('total');
        $lastMonthRevenue = Order::where('status', 'completed')
            ->whereBetween('created_at', [$lastMonth, $thisMonth])
            ->sum('total');

        // Revenue trend (percentage change)
        $revenueTrend = $lastMonthRevenue > 0 
            ? round((($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : 100;

        // Today's stats
        $todayOrders = Order::where('status', 'completed')
            ->whereDate('created_at', $today)
            ->count();
        $todayRevenue = Order::where('status', 'completed')
            ->whereDate('created_at', $today)
            ->sum('total');

        // Recent orders (latest 5) - eager loaded
        $recentOrders = Order::with(['user:id,name,email', 'items.product:id,name_ar,name_en'])
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

        // Top selling products (using subquery for performance)
        $topProducts = Product::select('products.*')
            ->selectRaw('(
                SELECT COUNT(*) FROM order_items 
                INNER JOIN orders ON orders.id = order_items.order_id 
                WHERE order_items.product_id = products.id 
                AND orders.status = "completed"
            ) as sales_count')
            ->orderByDesc('sales_count')
            ->limit(5)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name_ar' => $product->name_ar,
                    'name_en' => $product->name_en,
                    'thumbnail_url' => $product->thumbnail_url,
                    'sales_count' => $product->sales_count ?? 0,
                    'revenue' => (float) ($product->sales_count * $product->effective_price),
                ];
            });

        // New users this month
        $newUsersThisMonth = User::where('created_at', '>=', $thisMonth)->count();

        // Orders by status (single query)
        $ordersByStatus = Order::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            // Overview
            'total_revenue' => (float) $totalRevenue,
            'total_orders' => $totalOrders,
            'total_users' => $totalUsers,
            'total_products' => $totalProducts,
            
            // Monthly
            'monthly_revenue' => (float) $monthlyRevenue,
            'revenue_trend' => $revenueTrend,
            'new_users_this_month' => $newUsersThisMonth,
            
            // Today
            'today_orders' => $todayOrders,
            'today_revenue' => (float) $todayRevenue,
            
            // Orders breakdown
            'orders_by_status' => [
                'pending' => $ordersByStatus['pending'] ?? 0,
                'completed' => $ordersByStatus['completed'] ?? 0,
                'cancelled' => $ordersByStatus['cancelled'] ?? 0,
                'refunded' => $ordersByStatus['refunded'] ?? 0,
            ],
            
            // Lists
            'recent_orders' => $recentOrders,
            'top_products' => $topProducts,
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
        $days = collect();
        
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $revenue = Order::where('status', 'completed')
                ->whereDate('created_at', $date)
                ->sum('total');
            
            $days->push([
                'date' => $date->format('Y-m-d'),
                'day' => $date->locale('ar')->dayName,
                'revenue' => (float) $revenue,
            ]);
        }

        return $days->toArray();
    }

    /**
     * Clear stats cache (useful after order completion)
     */
    public static function clearCache(): void
    {
        Cache::forget('admin_stats');
        Cache::forget('admin_chart');
    }
}

