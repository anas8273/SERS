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

        // Sort by popularity or date
        $sortBy = $request->get('sort_by', 'votes_count');
        $query->orderBy($sortBy, 'desc');

        $requests = $query->paginate($request->get('per_page', 10));

        // Add voted status for authenticated user
        if ($request->user()) {
            $userId = $request->user()->id;
            $requests->getCollection()->transform(function ($item) use ($userId) {
                $item->has_voted = $item->votes()->where('user_id', $userId)->exists();
                return $item;
            });
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
            'attachments.*' => 'file|max:5120', // 5MB max per file
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
                $attachmentPaths[] = [
                    'path' => $path,
                    'name' => $file->getClientOriginalName(),
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
            ->get();

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

        $customRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء الطلب بنجاح',
        ]);
    }
}
