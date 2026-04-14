<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomRequest;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CustomRequestController extends Controller
{
    /**
     * Display a listing of custom requests.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CustomRequest::with(['user', 'category']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Sort — whitelist to prevent SQL injection
        $allowedSorts = ['votes_count', 'created_at', 'updated_at'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts) ? $request->input('sort_by') : 'votes_count';
        $query->orderBy($sortBy, 'desc');

        // Cap per_page to prevent memory exhaustion
        $requests = $query->paginate(min($request->input('per_page', 10), 50));

        // Add voted status for authenticated user
        if ($request->user()) {
            $userId = $request->user()->id;
            // [L-05 FIX] Use withCount to avoid N+1 — single subquery instead of per-item query
            $requests->loadCount(['votes as has_voted' => fn($q) => $q->where('user_id', $userId)]);
        }

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Store a newly created custom request.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'nullable|exists:categories,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:pdf,doc,docx,png,jpg,jpeg,webp|max:5120', // 5MB, safe types only
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        // Handle file uploads
        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('custom_requests', 'public');

                // [FIX-5] Sanitize the client-supplied filename before storing.
                // getClientOriginalName() returns raw browser input — could contain
                // HTML/script tags. strip_tags() + htmlspecialchars() prevents XSS
                // when the filename is later rendered in any HTML context.
                $rawName    = $file->getClientOriginalName();
                $safeName   = htmlspecialchars(strip_tags(basename($rawName)), ENT_QUOTES, 'UTF-8');
                $safeName   = mb_substr($safeName, 0, 200); // cap length

                $attachmentPaths[] = [
                    'path' => $path,
                    'name' => $safeName,
                    'type' => $file->getMimeType(),
                ];
            }
        }

        $customRequest = CustomRequest::create([
            'user_id' => $user->id,
            'category_id' => $request->category_id,
            'title' => $request->title,
            'description' => $request->description,
            'attachments' => $attachmentPaths,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'data' => $customRequest->load(['category']),
            'message' => 'تم إرسال طلبك بنجاح',
        ], 201);
    }

    /**
     * Display the specified custom request.
     */
    public function show(CustomRequest $customRequest): JsonResponse
    {
        $customRequest->load(['user', 'category', 'assignedTemplate']);

        return response()->json([
            'success' => true,
            'data' => $customRequest,
        ]);
    }

    /**
     * Vote for a custom request.
     */
    public function vote(Request $request, CustomRequest $customRequest): JsonResponse
    {
        $user = $request->user();

        if ($customRequest->hasVotedBy($user)) {
            // Remove vote
            $customRequest->removeVote($user);
            $hasVoted = false;
            $message = 'تم إلغاء التصويت';
        } else {
            // Add vote
            $customRequest->addVote($user);
            $hasVoted = true;
            $message = 'تم التصويت بنجاح';
        }

        return response()->json([
            'success' => true,
            'has_voted' => $hasVoted,
            'votes_count' => $customRequest->fresh()->votes_count,
            'message' => $message,
        ]);
    }

    /**
     * Get user's custom requests.
     */
    public function myRequests(Request $request): JsonResponse
    {
        $user = $request->user();

        $requests = CustomRequest::with(['category', 'assignedTemplate'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Cancel a custom request (only if pending).
     */
    public function cancel(Request $request, CustomRequest $customRequest): JsonResponse
    {
        // Check ownership
        if ($customRequest->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        // Check if can be cancelled
        if ($customRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن إلغاء هذا الطلب',
            ], 400);
        }

        // [L-03 FIX] Use status change instead of hard delete — preserves history
        $customRequest->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء الطلب بنجاح',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ADMIN — Methods used by admin routes (auth:sanctum + is_admin)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Admin: list all custom requests with optional filters.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = CustomRequest::with(['user', 'category'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            // [G-03 FIX] Escape LIKE wildcards to prevent unexpected results
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        $perPage = min($request->input('per_page', 15), 50);
        $requests = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $requests,
        ]);
    }

    /**
     * Admin: show single custom request details.
     */
    public function adminShow(string $id): JsonResponse
    {
        $request = CustomRequest::with(['user', 'category', 'assignedTemplate'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $request,
        ]);
    }

    /**
     * Admin: update the status of a custom request.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $customRequest = CustomRequest::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status'      => 'required|in:pending,in_progress,completed,rejected',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $customRequest->update([
            'status'      => $request->status,
            'admin_notes' => $request->admin_notes ?? $customRequest->admin_notes,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $customRequest->fresh()->load(['user', 'category']),
            'message' => 'تم تحديث حالة الطلب بنجاح',
        ]);
    }

    /**
     * Admin: assign a custom request to a user.
     */
    public function assign(Request $request, string $id): JsonResponse
    {
        // [C-01 FIX] Validate input — prevent arbitrary values
        $validated = $request->validate([
            'assigned_to' => 'nullable|uuid|exists:users,id',
        ]);

        $customRequest = CustomRequest::findOrFail($id);

        // [G-01 FIX] Prevent assigning completed/rejected requests
        if (in_array($customRequest->status, ['completed', 'rejected', 'cancelled'])) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن تعيين طلب مكتمل أو مرفوض أو ملغي',
            ], 422);
        }

        $customRequest->update([
            'status'      => 'in_progress',
            'assigned_to' => $validated['assigned_to'] ?? null,
        ]);

        // [U-01 FIX] Notify the request owner that their request is being worked on
        try {
            Notification::create([
                'user_id' => $customRequest->user_id,
                'type'    => 'custom_request_assigned',
                'title'   => 'تم قبول طلبك المخصص',
                'message' => "تم قبول طلبك '{$customRequest->title}' وبدأ العمل عليه.",
            ]);
        } catch (\Throwable $e) {
            // Non-critical — don't block the operation
            \Illuminate\Support\Facades\Log::warning('Notification failed for custom request assign', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'data'    => $customRequest->fresh()->load(['user', 'category']),
            'message' => 'تم تعيين الطلب بنجاح',
        ]);
    }

    /**
     * Admin: mark a custom request as completed.
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $customRequest = CustomRequest::findOrFail($id);

        $customRequest->update([
            'status'      => 'completed',
            'admin_notes' => $request->admin_notes ?? $customRequest->admin_notes,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $customRequest->fresh(),
            'message' => 'تم إكمال الطلب بنجاح',
        ]);
    }
}
