<?php
// app/Http/Controllers/Api/AdminReportController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * AdminReportController
 *
 * Extracted from inline route closures in api.php for:
 * - Better testability
 * - Cache layer (5-min TTL)
 * - Single Responsibility Principle
 * - Consistent date validation
 *
 * All methods require admin auth (enforced by route middleware).
 */
class AdminReportController extends Controller
{
    /**
     * Validate and extract date range from request.
     *
     * @return array{string, string, array{string, string}}
     */
    private function extractDateRange(Request $request): array
    {
        $request->validate([
            'from' => 'sometimes|date|date_format:Y-m-d|before_or_equal:today|after:2020-01-01',
            'to'   => 'sometimes|date|date_format:Y-m-d|before_or_equal:today|after:2020-01-01',
        ]);

        $from  = $request->get('from', now()->subDays(30)->toDateString());
        $to    = $request->get('to', now()->toDateString());
        $range = [$from . ' 00:00:00', $to . ' 23:59:59'];

        return [$from, $to, $range];
    }

    /**
     * Build cache key for a report.
     */
    private function cacheKey(string $report, string $from, string $to): string
    {
        return "admin_report:{$report}:{$from}:{$to}";
    }

    // ─────────────────────────────────────────────
    // Sales Report
    // ─────────────────────────────────────────────

    /**
     * GET /api/admin/reports/sales
     */
    public function sales(Request $request): JsonResponse
    {
        [$from, $to, $range] = $this->extractDateRange($request);

        $data = Cache::remember($this->cacheKey('sales', $from, $to), 300, function () use ($range) {
            $orders = DB::table('orders')
                ->where('status', 'completed')
                ->whereBetween('created_at', $range)
                ->selectRaw('DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders_count')
                ->groupBy('date')->orderBy('date')->get();

            $base = DB::table('orders')->where('status', 'completed')->whereBetween('created_at', $range);
            $summary = [
                'total_revenue'  => (float) ($base->sum('total') ?? 0),
                'total_orders'   => (int)   ($base->count()),
                'avg_order'      => (float) ($base->avg('total') ?? 0),
                'pending_orders' => (int)   DB::table('orders')->where('status', 'pending')->count(),
            ];

            $topTemplates = DB::table('order_items')
                ->join('templates', 'order_items.template_id', '=', 'templates.id')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.status', 'completed')
                ->whereBetween('orders.created_at', $range)
                ->selectRaw('templates.id, templates.name_ar, COUNT(order_items.id) as sales_count, SUM(order_items.price) as revenue')
                ->groupBy('templates.id', 'templates.name_ar')->orderByDesc('revenue')->limit(10)->get()
                ->map(fn($t) => [
                    'id'          => $t->id,
                    'name_ar'     => $t->name_ar,
                    'sales_count' => (int)   ($t->sales_count ?? 0),
                    'revenue'     => (float) ($t->revenue ?? 0),
                ]);

            // Cast chart rows
            $orders = $orders->map(fn($o) => [
                'date'         => $o->date,
                'revenue'      => (float) ($o->revenue ?? 0),
                'orders_count' => (int)   ($o->orders_count ?? 0),
            ]);

            return ['chart' => $orders, 'summary' => $summary, 'top_templates' => $topTemplates];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ─────────────────────────────────────────────
    // Users Report
    // ─────────────────────────────────────────────

    /**
     * GET /api/admin/reports/users
     */
    public function users(Request $request): JsonResponse
    {
        [$from, $to, $range] = $this->extractDateRange($request);

        $data = Cache::remember($this->cacheKey('users', $from, $to), 300, function () use ($range) {
            $timeline = DB::table('users')
                ->whereBetween('created_at', $range)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as new_users')
                ->groupBy('date')->orderBy('date')->get();

            $summary = [
                'total_users'   => (int) DB::table('users')->count(),
                'new_in_period' => (int) DB::table('users')->whereBetween('created_at', $range)->count(),
                'admin_count'   => (int) DB::table('users')->where('role', 'admin')->count(),
                'active_buyers' => (int) DB::table('orders')->whereBetween('created_at', $range)->distinct('user_id')->count('user_id'),
            ];

            $timeline = $timeline->map(fn($r) => [
                'date'      => $r->date,
                'new_users' => (int) ($r->new_users ?? 0),
            ]);

            return ['chart' => $timeline, 'summary' => $summary];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ─────────────────────────────────────────────
    // Templates Report
    // ─────────────────────────────────────────────

    /**
     * GET /api/admin/reports/templates
     */
    public function templates(Request $request): JsonResponse
    {
        [$from, $to, $range] = $this->extractDateRange($request);

        $data = Cache::remember($this->cacheKey('templates', $from, $to), 300, function () use ($range) {
            $timeline = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.status', 'completed')
                ->whereBetween('orders.created_at', $range)
                ->selectRaw('DATE(orders.created_at) as date, COUNT(*) as downloads, SUM(order_items.price) as revenue')
                ->groupBy('date')->orderBy('date')->get();

            $summary = [
                'total_templates'  => (int)   DB::table('templates')->count(),
                'active_templates' => (int)   DB::table('templates')->where('is_active', 1)->count(),
                'featured'         => (int)   DB::table('templates')->where('is_featured', 1)->count(),
                'total_downloads'  => (int)   (DB::table('templates')->sum('downloads_count') ?? 0),
            ];

            $topTemplates = DB::table('order_items')
                ->join('templates', 'order_items.template_id', '=', 'templates.id')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.status', 'completed')
                ->whereBetween('orders.created_at', $range)
                ->selectRaw('templates.id, templates.name_ar, COUNT(order_items.id) as sales_count, SUM(order_items.price) as revenue')
                ->groupBy('templates.id', 'templates.name_ar')->orderByDesc('sales_count')->limit(10)->get()
                ->map(fn($t) => [
                    'id'          => $t->id,
                    'name_ar'     => $t->name_ar,
                    'sales_count' => (int)   ($t->sales_count ?? 0),
                    'revenue'     => (float) ($t->revenue ?? 0),
                ]);

            $timeline = $timeline->map(fn($r) => [
                'date'      => $r->date,
                'downloads' => (int)   ($r->downloads ?? 0),
                'revenue'   => (float) ($r->revenue ?? 0),
            ]);

            return ['chart' => $timeline, 'summary' => $summary, 'top_templates' => $topTemplates];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ─────────────────────────────────────────────
    // AI Report
    // ─────────────────────────────────────────────

    /**
     * GET /api/admin/reports/ai
     *
     * [GAP-01 FIX] Now reads from ai_request_logs (the new persistence layer)
     * in addition to ai_conversations, providing real success rate, avg latency,
     * and action-level breakdown — previously only conversation counts were available.
     */
    public function ai(Request $request): JsonResponse
    {
        [$from, $to, $range] = $this->extractDateRange($request);

        $data = Cache::remember($this->cacheKey('ai', $from, $to), 300, function () use ($range) {
            // ── Conversation stats (existing table) ──────────────────────────
            $convBase     = DB::table('ai_conversations')->whereBetween('created_at', $range);
            $totalConvs   = (clone $convBase)->count();
            $uniqueUsers  = (clone $convBase)->distinct('user_id')->count('user_id');

            $timeline = DB::table('ai_conversations')
                ->whereBetween('created_at', $range)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as conversations')
                ->groupBy('date')->orderBy('date')->get();

            // ── AI Request Logs (new persistence table) ───────────────────────
            $logBase     = DB::table('ai_request_logs')->whereBetween('created_at', $range);
            $totalReqs   = (clone $logBase)->count();
            $successReqs = (clone $logBase)->where('success', true)->count();
            $failedReqs  = $totalReqs - $successReqs;
            $successRate = $totalReqs > 0 ? round(($successReqs / $totalReqs) * 100, 1) : null;
            $avgLatency  = (int) (clone $logBase)->where('success', true)->avg('latency_ms');
            $totalTokens = (clone $logBase)->sum(DB::raw('COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0)'));

            // Action breakdown
            $actionBreakdown = DB::table('ai_request_logs')
                ->whereBetween('created_at', $range)
                ->selectRaw('action, COUNT(*) as count, SUM(success) as successes, AVG(latency_ms) as avg_latency')
                ->groupBy('action')
                ->orderByDesc('count')
                ->get();

            // Merge conversation timeline with request log timeline
            $logTimeline = DB::table('ai_request_logs')
                ->whereBetween('created_at', $range)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as requests, SUM(success) as successes')
                ->groupBy('date')->orderBy('date')->get()->keyBy('date');

            $mergedTimeline = $timeline->map(function ($row) use ($logTimeline) {
                $logRow = $logTimeline[$row->date] ?? null;
                return [
                    'date'          => $row->date,
                    'conversations' => $row->conversations,
                    'requests'      => $logRow ? (int) $logRow->requests  : 0,
                    'successes'     => $logRow ? (int) $logRow->successes : 0,
                ];
            });

            return [
                'chart'   => $mergedTimeline,
                'summary' => [
                    'total_conversations'   => $totalConvs,
                    'unique_users'          => $uniqueUsers,
                    'total_api_requests'    => $totalReqs,
                    'successful_requests'   => $successReqs,
                    'failed_requests'       => $failedReqs,
                    'success_rate'          => $successRate,
                    'avg_latency_ms'        => $avgLatency,
                    'total_tokens_used'     => (int) $totalTokens,
                ],
                'action_breakdown' => $actionBreakdown,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }
}
