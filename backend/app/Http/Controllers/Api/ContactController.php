<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    /**
     * Store a new contact message (public — no auth required).
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'         => 'required|string|max:100',
            'email'        => 'required|email|max:255',
            'inquiry_type' => 'nullable|string|in:general,technical,billing,partnership,other',
            'subject'      => 'required|string|max:255',
            'message'      => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $message = ContactMessage::create([
            'name'         => $request->name,
            'email'        => $request->email,
            'inquiry_type' => $request->inquiry_type ?? 'general',
            'subject'      => $request->subject,
            'message'      => $request->message,
            'user_id'      => $request->user()?->id,
            'ip_address'   => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully',
            'data'    => $message->only(['id', 'created_at']),
        ], 201);
    }

    /**
     * List all contact messages (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = ContactMessage::query()->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $messages = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $messages,
        ]);
    }

    /**
     * Mark a message as read (admin only).
     */
    public function markRead(ContactMessage $contactMessage): JsonResponse
    {
        $contactMessage->update(['status' => 'read']);

        return response()->json([
            'success' => true,
            'message' => 'Marked as read',
        ]);
    }

    /**
     * [E-08] Delete a contact message (admin only).
     */
    public function destroy(ContactMessage $contactMessage): JsonResponse
    {
        $contactMessage->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الرسالة بنجاح',
        ]);
    }
}
