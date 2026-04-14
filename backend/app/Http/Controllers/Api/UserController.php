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

            // Search by name or email — strip SQL wildcards to prevent wildcard injection
            if ($request->has('search')) {
                $search = str_replace(['%', '_'], ['\%', '\_'], $request->input('search', ''));
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Filter by role — only allow known values
            if ($request->has('role') && in_array($request->input('role'), ['user', 'admin'], true)) {
                $query->where('role', $request->input('role'));
            }

            // Filter by status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $users = $query->orderBy('created_at', 'desc')
                ->paginate(min((int) $request->input('per_page', 15), 100));

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
     * Called via POST /admin/users/{id}/toggle-admin
     */
    public function toggleAdmin(string $id): JsonResponse
    {
        return $this->toggleRole($id);
    }

    /**
     * Toggle user role (Admin) — internal method
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

            // [SEC-03 FIX] Do NOT Hash::make() here — the User model has 'hashed' cast
            // which auto-hashes on assignment. Double-hashing locks the user out permanently.
            if (!$request->filled('password')) {
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
     * Delete user (Admin) — with cascading Firestore cleanup
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

            // [CASCADE] Purge all Firestore data belonging to this user
            // before deleting from MySQL — prevents orphaned documents
            try {
                $firestoreService = app(\App\Services\FirestoreService::class);
                $firestoreService->deleteAllUserData((string) $id);
                Log::info('Purged Firestore data for user', ['user_id' => $id]);
            } catch (\Throwable $fe) {
                // Non-fatal: log the error but proceed with MySQL deletion
                // The Firestore data will become orphaned but won't affect functionality
                Log::warning('Failed to purge Firestore data for user (non-fatal)', [
                    'user_id' => $id,
                    'error'   => $fe->getMessage(),
                ]);
            }

            // [SEC] Revoke all active tokens before deletion to prevent ghost access
            $user->tokens()->delete();

            $user->delete();

            Log::info('User deleted with data cascade', ['user_id' => $id, 'deleted_by' => auth()->id()]);

            return response()->json([
                'success' => true,
                'message' => 'تم حذف المستخدم وجميع بياناته بنجاح',
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

            // [BUG-FIX] Do NOT call Hash::make() here — the User model has
            // 'password' => 'hashed' cast which auto-hashes on assignment.
            // Double-hashing (Hash::make + cast) produces an invalid hash that
            // locks the user out permanently after a password change.
            $user->password = $validated['new_password'];
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

    /**
     * Admin: Adjust user wallet balance
     * POST /api/admin/users/{id}/wallet-adjust
     *
     * Allows admins to add/subtract wallet balance with a full audit trail.
     * Use cases: promotional credits, refunds, corrections, testing.
     */
    public function adjustWalletBalance(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'amount'      => 'required|numeric|min:0.01|max:100000',
                'type'        => 'required|in:add,subtract',
                'description' => 'required|string|max:500',
            ], [
                'amount.required' => 'المبلغ مطلوب',
                'amount.min'      => 'الحد الأدنى 0.01 ر.س',
                'type.required'   => 'نوع العملية مطلوب',
                'type.in'         => 'النوع يجب أن يكون add أو subtract',
                'description.required' => 'وصف العملية مطلوب',
            ]);

            $user = User::findOrFail($id);
            $amount = (float) $validated['amount'];
            $isAdd = $validated['type'] === 'add';

            // [SEC] All balance operations inside transaction with row locking
            \Illuminate\Support\Facades\DB::transaction(function () use (&$user, $amount, $isAdd, $validated) {
                // Lock the user row to prevent concurrent modifications
                $user = User::lockForUpdate()->findOrFail($user->id);
                $balanceBefore = (float) $user->wallet_balance;

                // Check sufficient balance for subtraction (inside lock)
                if (!$isAdd && $balanceBefore < $amount) {
                    throw new \RuntimeException('INSUFFICIENT_BALANCE');
                }

                if ($isAdd) {
                    $user->increment('wallet_balance', $amount);
                    $balanceAfter = $balanceBefore + $amount;
                    $txType = 'deposit';
                    $txAmount = $amount;
                } else {
                    $user->decrement('wallet_balance', $amount);
                    $balanceAfter = $balanceBefore - $amount;
                    $txType = 'withdrawal';
                    $txAmount = -$amount;
                }

                // Record wallet transaction for audit trail
                if (class_exists(\App\Models\WalletTransaction::class)) {
                    \App\Models\WalletTransaction::create([
                        'user_id'        => $user->id,
                        'type'           => $txType,
                        'amount'         => $txAmount,
                        'balance_before' => $balanceBefore,
                        'balance_after'  => $balanceAfter,
                        'description'    => '[Admin] ' . $validated['description'],
                        'reference_type' => 'AdminAdjustment',
                    ]);
                }
            });

            $freshUser = $user->fresh();

            Log::info('Admin adjusted wallet balance', [
                'admin_id'       => auth()->id(),
                'user_id'        => $id,
                'type'           => $validated['type'],
                'amount'         => $amount,
                'new_balance'    => $freshUser->wallet_balance,
                'description'    => $validated['description'],
            ]);

            return response()->json([
                'success' => true,
                'message' => $isAdd
                    ? "تم إضافة {$amount} ر.س لرصيد المستخدم بنجاح"
                    : "تم خصم {$amount} ر.س من رصيد المستخدم بنجاح",
                'data' => [
                    'wallet_balance' => $freshUser->wallet_balance,
                ],
            ]);
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'INSUFFICIENT_BALANCE') {
                return response()->json([
                    'success' => false,
                    'message' => 'رصيد المستخدم غير كافٍ للخصم',
                ], 422);
            }
            throw $e;
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'المستخدم غير موجود',
            ], 404);
        } catch (\Throwable $e) {
            Log::error('Failed to adjust wallet: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في تعديل رصيد المحفظة',
            ], 500);
        }
    }
}
