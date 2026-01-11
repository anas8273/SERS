<?php
// app/Http/Controllers/Api/ActivityLogController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * ActivityLogController
 * 
 * Manages activity log viewing for admins.
 * 
 * @package App\Http\Controllers\Api
 */
class ActivityLogController extends Controller
{
    /**
     * Get activity logs with filters.
     * 
     * GET /api/admin/activity-logs
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ActivityLog::with('user:id,name,email')
                ->latest();

            // Filter by action type
            if ($request->filled('action')) {
                $query->byAction($request->action);
            }

            // Filter by entity type
            if ($request->filled('entity_type')) {
                $query->byEntity($request->entity_type);
            }

            // Filter by user
            if ($request->filled('user_id')) {
                $query->byUser($request->user_id);
            }

            // Filter by date range
            if ($request->filled('from')) {
                $query->where('created_at', '>=', $request->from);
            }
            if ($request->filled('to')) {
                $query->where('created_at', '<=', $request->to);
            }

            // Paginate results
            $logs = $query->paginate($request->get('per_page', 20));

            // Transform for response
            $logs->getCollection()->transform(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'entity_type' => $log->entity_type,
                    'entity_id' => $log->entity_id,
                    'description' => $log->description,
                    'user' => $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'email' => $log->user->email,
                    ] : null,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->toISOString(),
                    'time_ago' => $log->created_at->diffForHumans(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $logs->items(),
                'meta' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch activity logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب سجل النشاطات',
            ], 500);
        }
    }

    /**
     * Get activity summary stats.
     * 
     * GET /api/admin/activity-logs/summary
     */
    public function summary(): JsonResponse
    {
        try {
            $todayCount = ActivityLog::whereDate('created_at', today())->count();
            $weekCount = ActivityLog::recent(7)->count();
            
            $byAction = ActivityLog::recent(7)
                ->selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action');

            $byEntity = ActivityLog::recent(7)
                ->selectRaw('entity_type, COUNT(*) as count')
                ->groupBy('entity_type')
                ->pluck('count', 'entity_type');

            return response()->json([
                'success' => true,
                'data' => [
                    'today_count' => $todayCount,
                    'week_count' => $weekCount,
                    'by_action' => $byAction,
                    'by_entity' => $byEntity,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch activity summary: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب ملخص النشاطات',
            ], 500);
        }
    }
}
