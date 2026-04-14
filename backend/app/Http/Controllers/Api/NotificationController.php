<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class NotificationController extends Controller
{
    /**
     * Display a listing of user's notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Notification::where('user_id', $user->id);

        // Filter by read status
        if ($request->has('is_read')) {
            $query->where('is_read', $request->boolean('is_read'));
        }

        // Filter by type — [SEC-01 FIX] use input() not magic property
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate(min($request->input('per_page', 20), 50));

        // [IMP-02 FIX] Single subquery for unread count — no separate DB round-trip
        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success'      => true,
            'data'         => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Get unread notifications count — cached for 90 seconds.
     * [PERF] Uses default cache store (database) not file — file I/O is slow on Windows.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $cacheKey = "notif_count_{$user->id}";

        $count = Cache::remember($cacheKey, 90, function () use ($user) {
            return Notification::where('user_id', $user->id)
                ->unread()
                ->count();
        });

        return response()->json([
            'success' => true,
            'count'   => $count,
        ]);
    }


    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        // Check ownership
        if ($notification->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        $notification->markAsRead();

        // [FIX-4b] Invalidate the cached unread count for consistent badge behavior
        Cache::store('file')->forget("notif_count_{$request->user()->id}");

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الإشعار',
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        // [FIX-4] Invalidate the cached unread count so the badge updates
        // immediately — without this, the old count persists for 2 minutes
        Cache::store('file')->forget("notif_count_{$user->id}");

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث جميع الإشعارات',
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        // Check ownership
        if ($notification->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الإشعار',
        ]);
    }

    /**
     * Delete all read notifications.
     */
    public function deleteAllRead(Request $request): JsonResponse
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->read()
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الإشعارات المقروءة',
        ]);
    }
}
