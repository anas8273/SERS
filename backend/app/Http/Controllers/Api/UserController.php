<?php
// app/Http/Controllers/Api/UserController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

/**
 * UserController
 * 
 * Handles user management for admins and profile updates for users.
 */
class UserController extends Controller
{
    /**
     * Get all users (Admin)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::query()
                ->withCount(['orders', 'reviews']);

            // Search by name or email
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Filter by role
            if ($request->has('role')) {
                $query->where('role', $request->input('role'));
            }

            // Filter by status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $users = $query->orderBy('created_at', 'desc')
                ->paginate($request->input('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $users->items(),
                'meta' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch users: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب المستخدمين',
            ], 500);
        }
    }

    /**
     * Get single user details (Admin)
     */
    public function show(string $id): JsonResponse
    {
        try {
            $user = User::with(['orders' => function ($q) {
                $q->latest()->limit(5);
            }, 'reviews' => function ($q) {
                $q->latest()->limit(5);
            }])
            ->withCount(['orders', 'reviews'])
            ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $user,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'المستخدم غير موجود',
            ], 404);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب بيانات المستخدم',
            ], 500);
        }
    }

    /**
     * Toggle user active status (Admin)
     */
    public function toggleStatus(string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent admin from deactivating themselves
            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'لا يمكنك تعطيل حسابك الخاص',
                ], 422);
            }

            $user->is_active = !$user->is_active;
            $user->save();

            Log::info('User status toggled', ['user_id' => $id, 'is_active' => $user->is_active]);

            return response()->json([
                'success' => true,
                'message' => $user->is_active ? 'تم تفعيل الحساب بنجاح' : 'تم تعطيل الحساب بنجاح',
                'data' => $user,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'المستخدم غير موجود',
            ], 404);
        } catch (\Throwable $e) {
            Log::error('Failed to toggle user status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في تغيير حالة المستخدم',
            ], 500);
        }
    }

    /**
     * Toggle user role (Admin)
     */
    public function toggleRole(string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent admin from demoting themselves
            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'لا يمكنك تغيير صلاحيات حسابك الخاص',
                ], 422);
            }

            $user->role = $user->role === 'admin' ? 'user' : 'admin';
            $user->save();

            Log::info('User role toggled', ['user_id' => $id, 'role' => $user->role]);

            return response()->json([
                'success' => true,
                'message' => $user->role === 'admin' ? 'تم ترقية المستخدم لمدير' : 'تم تخفيض المستخدم لمستخدم عادي',
                'data' => $user,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'المستخدم غير موجود',
            ], 404);
        } catch (\Throwable $e) {
            Log::error('Failed to toggle user role: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في تغيير صلاحيات المستخدم',
            ], 500);
        }
    }

    /**
     * Update user details (Admin)
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'phone' => 'sometimes|nullable|string|max:20',
                'password' => 'sometimes|nullable|string|min:8',
                'role' => 'sometimes|in:user,admin',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($request->filled('password')) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            // Prevent admin from changing their own role/status accidentally via this endpoint
            if ($user->id === auth()->id()) {
                unset($validated['role']);
                unset($validated['is_active']);
            }

            $user->update($validated);

            Log::info('User updated by admin', ['admin_id' => auth()->id(), 'user_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث بيانات المستخدم بنجاح',
                'data' => $user,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'المستخدم غير موجود',
            ], 404);
        } catch (\Throwable $e) {
            Log::error('Failed to update user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في تحديث بيانات المستخدم',
            ], 500);
        }
    }

    /**
     * Delete user (Admin)
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent admin from deleting themselves
            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'لا يمكنك حذف حسابك الخاص',
                ], 422);
            }

            $user->delete();

            Log::info('User deleted', ['user_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'تم حذف المستخدم بنجاح',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'المستخدم غير موجود',
            ], 404);
        } catch (\Throwable $e) {
            Log::error('Failed to delete user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في حذف المستخدم',
            ], 500);
        }
    }

    /**
     * Update own profile (User)
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|nullable|string|max:20',
                'avatar' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            if ($request->hasFile('avatar')) {
                $path = $request->file('avatar')->store('avatars', 'public');
                $validated['avatar_url'] = asset('storage/' . $path);
            }

            $user->update($validated);

            Log::info('Profile updated', ['user_id' => $user->id]);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث الملف الشخصي بنجاح',
                'data' => $user->fresh(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to update profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في تحديث الملف الشخصي',
            ], 500);
        }
    }

    /**
     * Change password (User)
     */
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            $user = auth()->user();

            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'كلمة المرور الحالية غير صحيحة',
                ], 422);
            }

            $user->password = Hash::make($validated['new_password']);
            $user->save();

            Log::info('Password changed', ['user_id' => $user->id]);

            return response()->json([
                'success' => true,
                'message' => 'تم تغيير كلمة المرور بنجاح',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to change password: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في تغيير كلمة المرور',
            ], 500);
        }
    }
}
