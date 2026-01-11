<?php
// app/Http/Controllers/Api/AuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;

/**
 * AuthController
 * 
 * Handles user authentication including:
 * - Traditional email/password registration and login
 * - Firebase/Google social login
 * - Logout and current user retrieval
 * 
 * @package App\Http\Controllers\Api
 */
class AuthController extends Controller
{
    /**
     * Register a new user.
     * 
     * POST /api/auth/register
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function register(Request $request): JsonResponse
    {
        Log::info('Register request received', ['email' => $request->email]);

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'phone' => 'nullable|string|max:20',
            ], [
                'name.required' => 'الاسم مطلوب',
                'email.required' => 'البريد الإلكتروني مطلوب',
                'email.email' => 'البريد الإلكتروني غير صالح',
                'email.unique' => 'البريد الإلكتروني مسجل مسبقاً',
                'password.required' => 'كلمة المرور مطلوبة',
                'password.min' => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
                'password.confirmed' => 'تأكيد كلمة المرور غير متطابق',
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'role' => 'user',
                'is_active' => true,
                'wallet_balance' => 0,
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            Log::info("User registered", ['user_id' => $user->id, 'email' => $user->email]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الحساب بنجاح',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                ],
            ], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error("Database Error: " . $e->getMessage());
            return response()->json([
                'message' => 'Database Error',
                'error_details' => $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            Log::error("Registration Error: " . $e->getMessage());
            return response()->json([
                'message' => 'General Error',
                'error_details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login with email and password.
     * 
     * POST /api/auth/login
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        Log::info('Login request received', ['email' => $request->email]);

        try {
            $validated = $request->validate([
                'email' => 'required|string|email',
                'password' => 'required|string',
            ], [
                'email.required' => 'البريد الإلكتروني مطلوب',
                'email.email' => 'البريد الإلكتروني غير صالح',
                'password.required' => 'كلمة المرور مطلوبة',
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (!$user || !Hash::check($validated['password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'بيانات الدخول غير صحيحة',
                    'error' => 'invalid_credentials',
                ], 401);
            }

            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'هذا الحساب معطّل، يرجى التواصل مع الدعم',
                    'error' => 'account_disabled',
                ], 403);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            Log::info("User logged in", ['user_id' => $user->id]);

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الدخول بنجاح',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error("Login Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تسجيل الدخول',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Social login via Firebase (Google, etc.).
     * 
     * POST /api/auth/social
     * 
     * Accepts a Firebase ID Token, verifies it, and creates/updates
     * the user in MySQL, then issues a Sanctum token.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function socialLogin(Request $request): JsonResponse
    {
        Log::info('Social login request received');

        $validated = $request->validate([
            'firebase_token' => 'required|string',
        ], [
            'firebase_token.required' => 'رمز Firebase مطلوب',
        ]);

        try {
            // DEBUGGING PATH
            $path = storage_path('app/firebase/service-account.json');

            if (!file_exists($path)) {
                // Fallback: try looking in base path just in case
                $path = base_path('storage/app/firebase/service-account.json');
            }

            if (!file_exists($path)) {
                return response()->json([
                    'message' => 'Critical Config Error: Firebase file not found.',
                    'searched_at' => $path
                ], 500);
            }

            $factory = (new Factory)
                ->withServiceAccount($path)
                ->withProjectId(config('services.firebase.project_id'));

            $auth = $factory->createAuth();

            // Verify the Firebase ID token
            $verifiedToken = $auth->verifyIdToken($validated['firebase_token']);
            $firebaseUid = $verifiedToken->claims()->get('sub');

            // Get user info from Firebase
            $firebaseUser = $auth->getUser($firebaseUid);

            // Validate that email exists
            if (!$firebaseUser->email) {
                return response()->json([
                    'success' => false,
                    'message' => 'لم يتم العثور على بريد إلكتروني في حساب Google',
                    'error' => 'no_email',
                ], 400);
            }

            // Create or update user in MySQL
            $user = User::updateOrCreate(
                ['email' => $firebaseUser->email],
                [
                    'name' => $firebaseUser->displayName ?? 'مستخدم',
                    'firebase_uid' => $firebaseUid,
                    'password' => Hash::make(Str::random(32)), // Random password for security
                    'email_verified_at' => now(),
                    'is_active' => true,
                    'role' => 'user', // Default role for social login
                ]
            );

            // Issue Sanctum token
            $token = $user->createToken('auth_token')->plainTextToken;

            Log::info("User social login", [
                'user_id' => $user->id,
                'firebase_uid' => $firebaseUid,
                'provider' => 'google',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الدخول بنجاح',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                    'is_new_user' => $user->wasRecentlyCreated,
                ],
            ]);

        } catch (FailedToVerifyToken $e) {
            Log::warning("Invalid Firebase token", [
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'رمز Firebase غير صالح أو منتهي الصلاحية',
                'error' => 'invalid_token',
            ], 401);

        } catch (\Throwable $e) {
            Log::error("Social login error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Social Login Error: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Logout the current user.
     * 
     * POST /api/auth/logout
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            // Revoke the current access token
            $request->user()->currentAccessToken()->delete();

            Log::info("User logged out", ['user_id' => $request->user()->id]);

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الخروج بنجاح',
            ]);
        } catch (\Throwable $e) {
            Log::error("Logout Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تسجيل الخروج',
            ], 500);
        }
    }

    /**
     * Get the authenticated user's data.
     * 
     * GET /api/auth/me
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'المستخدم غير موجود',
                ], 401);
            }
            
            // Load user's order count and library count
            $user->loadCount(['orders', 'library']);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error("Get user error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب بيانات المستخدم',
            ], 500);
        }
    }
}
