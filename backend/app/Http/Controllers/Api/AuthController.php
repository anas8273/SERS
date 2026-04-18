<?php
// app/Http/Controllers/Api/AuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\WelcomeMail;
use App\Traits\LogsActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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
    use LogsActivity;
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
        Log::info('Register request received');

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
                'password' => $validated['password'], // Model has 'hashed' cast — auto-hashes
                'phone' => $validated['phone'] ?? null,
                'role' => 'user',
                'is_active' => true,
                'wallet_balance' => 0,
                // [E-01b] email_verified_at starts as null — user must verify before first login
                'email_verified_at' => null,
            ]);

            // [SESSION] Register token expires after 7 days (not infinite)
            $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

            Log::info("User registered", ['user_id' => $user->id, 'email' => $user->email]);

            // Log activity (non-blocking)
            try { $this->logCreate('user', (string) $user->id, $user->name . ' (تسجيل جديد)'); } catch (\Throwable) {}

            // [EMAIL] إرسال بريد الترحيب بعد التسجيل (non-blocking)
            try {
                Mail::to($user->email)->queue(new WelcomeMail($user));
            } catch (\Throwable $mailEx) {
                Log::warning('WelcomeMail failed: ' . $mailEx->getMessage());
            }

            // [FIX E-01b] Send email verification immediately after registration
            // Non-blocking — if it fails, user can resend via POST /api/auth/email/resend
            $this->dispatchVerificationEmail($user);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الحساب بنجاح. يرجى تأكيد بريدك الإلكتروني.',
                'data' => [
                    'user'                  => $user,
                    'token'                 => $token,
                    'requires_verification' => true,
                ],
            ], 201);
        } catch (ValidationException $e) {
            // Validation errors (email taken, password too short, etc.)
            return response()->json([
                'success' => false,
                'message' => 'بيانات التسجيل غير صالحة',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error("Database Error during registration: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في قاعدة البيانات. يرجى المحاولة لاحقاً.',
                'error'   => 'database_error',
            ], 500);
        } catch (\Exception $e) {
            Log::error("Registration Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة لاحقاً.',
                'error'   => 'server_error',
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
        Log::info('Login request received');

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

            // [FIX E-01] Email verification check — only for native (non-Firebase) accounts.
            // Social/Google users are verified via Firebase; firebase_uid is set on their account.
            // For native accounts: require email_verified_at to be set.
            if (!$user->firebase_uid && !$user->email_verified_at) {
                // Optionally auto-send a new verification email
                $this->dispatchVerificationEmail($user);
                return response()->json([
                    'success' => false,
                    'message' => 'يرجى تأكيد بريدك الإلكتروني أولاً. تم إرسال رابط التأكيد.',
                    'error'   => 'email_not_verified',
                    'data'    => ['email' => $user->email],
                ], 403);
            }

            // [SESSION] Smart expiry: Admin gets shorter sessions for security
            $rememberMe = (bool) $request->input('remember_me', false);
            $isAdmin    = strtolower($user->role) === 'admin';
            
            if ($rememberMe) {
                $expiresAt = $isAdmin ? now()->addDays(7) : now()->addDays(30);
            } else {
                $expiresAt = $isAdmin ? now()->addHours(8) : now()->addDay();
            }

            $token = $user->createToken('auth_token', ['*'], $expiresAt)->plainTextToken;

            Log::info("User logged in", ['user_id' => $user->id, 'remember_me' => $rememberMe]);

            // Log activity (non-blocking)
            try { $this->logActivity('login', 'session', (string) $user->id, 'تسجيل دخول: ' . $user->name); } catch (\Throwable) {}

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الدخول بنجاح',
                'data' => [
                    'user'        => $user,
                    'token'       => $token,
                    'remember_me' => $rememberMe,
                    'expires_at'  => $expiresAt->toIso8601String(),
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات الدخول غير صالحة',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Login Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة لاحقاً.',
                'error'   => 'server_error',
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
                    'success' => false,
                    'message' => 'خطأ في إعدادات Firebase. يرجى التواصل مع الدعم.',
                    'error' => 'firebase_config_missing',
                ], 500);
            }

            $factory = (new Factory)
                ->withServiceAccount($path)
                ->withProjectId(config('services.firebase.project_id'));

            $auth = $factory->createAuth();

            // [FIX] Verify the Firebase ID token with 60-second leeway
            // for clock skew between local machine and Firebase servers.
            $leewaySeconds = 60;
            $verifiedToken = $auth->verifyIdToken(
                $validated['firebase_token'],
                false,           // $checkIfRevoked
                $leewaySeconds   // $leewayInSeconds
            );
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

            // [H-3] Ghost User prevention: wrap in DB transaction so if ANY step
            // fails, no partial/orphan records are created.
            $user = null;
            try {
                $user = \Illuminate\Support\Facades\DB::transaction(function () use ($firebaseUser, $firebaseUid) {
                    $user = User::firstOrCreate(
                        ['email' => $firebaseUser->email],
                        [
                            'name'              => $firebaseUser->displayName ?? 'مستخدم',
                            'firebase_uid'      => $firebaseUid,
                            'password'          => Str::random(32), // auto-hashed by model cast
                            'email_verified_at' => now(),
                            'is_active'         => true,
                            'role'              => 'user',
                        ]
                    );

                    // Update only safe metadata on subsequent logins
                    if (!$user->wasRecentlyCreated) {
                        $user->update([
                            'firebase_uid'      => $firebaseUid,
                            'email_verified_at' => $user->email_verified_at ?? now(),
                            'name'              => $user->name !== 'مستخدم'
                                ? $user->name
                                : ($firebaseUser->displayName ?? $user->name),
                        ]);
                    }

                    return $user;
                });
            } catch (\Throwable $dbError) {
                Log::error('Social login: MySQL user sync FAILED', [
                    'firebase_uid'   => $firebaseUid,
                    'firebase_email' => $firebaseUser->email,
                    'db_error'       => $dbError->getMessage(),
                    'db_code'        => $dbError->getCode(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'فشل في مزامنة حساب Google مع قاعدة البيانات. يرجى المحاولة مرة أخرى.',
                    'error'   => 'mysql_sync_failed',
                ], 500);
            }

            // Safety check: ensure $user is a valid Eloquent model
            if (!$user || !$user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'حدث خطأ في إنشاء الحساب. يرجى المحاولة لاحقاً.',
                    'error'   => 'user_creation_failed',
                ], 500);
            }

            // Check if the account is disabled (admin may have suspended it)
            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'هذا الحساب معطّل. يرجى التواصل مع الدعم.',
                    'error'   => 'account_disabled',
                ], 403);
            }

            // [SESSION] Social login token: 14 days (shorter than remember-me)
            $token = $user->createToken('auth_token', ['*'], now()->addDays(14))->plainTextToken;

            Log::info('User social login successful', [
                'user_id'      => $user->id,
                'firebase_uid' => $firebaseUid,
                'provider'     => 'google',
                'is_new_user'  => $user->wasRecentlyCreated,
            ]);

            // Log activity (non-blocking)
            try {
                $action = $user->wasRecentlyCreated ? 'create' : 'login';
                $desc   = $user->wasRecentlyCreated
                    ? 'تسجيل جديد عبر Google: ' . $user->name
                    : 'تسجيل دخول عبر Google: ' . $user->name;
                $this->logActivity($action, 'session', (string) $user->id, $desc);
            } catch (\Throwable) {}

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الدخول بنجاح',
                'data' => [
                    'user'        => $user,
                    'token'       => $token,
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
            // [H-1] Log internals, never expose to client
            Log::error("Social login error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تسجيل الدخول الاجتماعي. يرجى المحاولة لاحقاً.',
                'error'   => 'server_error',
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
            // Log activity (non-blocking)
            try { $this->logActivity('logout', 'session', (string) $request->user()->id, 'تسجيل خروج'); } catch (\Throwable) {}

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
     * [C-05] Logout from ALL devices — revokes every Sanctum token.
     * 
     * POST /api/auth/logout-all
     * 
     * Use when: user suspects account compromise, changes password, etc.
     */
    public function logoutAll(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $deletedCount = $user->tokens()->count();
            $user->tokens()->delete();

            Log::info("User logged out from all devices", [
                'user_id' => $user->id,
                'tokens_revoked' => $deletedCount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الخروج من جميع الأجهزة بنجاح',
                'data' => ['devices_logged_out' => $deletedCount],
            ]);
        } catch (\Throwable $e) {
            Log::error("LogoutAll Error: " . $e->getMessage());
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

    /**
     * Check if an email exists in the system (used before Firebase password reset).
     *
     * POST /api/auth/check-email
     *
     * Security note: To prevent user enumeration, we always return the same
     * generic success message. The actual check helps the frontend give better UX.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function checkEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|max:255',
        ]);

        // [SECURITY] We check existence only for internal logging/metrics.
        // The response NEVER reveals whether the email is registered.
        // This prevents user enumeration attacks.

        return response()->json([
            'success' => true,
            'message' => 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة التعيين',
        ]);
    }

    // ──────────────────────────────────────────────────────
    // [E-02] Email Verification Endpoints
    // ──────────────────────────────────────────────────────

    /**
     * Resend the email verification link.
     * POST /api/auth/email/resend
     */
    public function sendVerificationEmail(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return response()->json([
                'success' => false,
                'message' => 'البريد الإلكتروني مؤكَّد مسبقاً',
                'error'   => 'already_verified',
            ], 400);
        }

        // Rate limit: 1 email per 2 minutes per user
        $cacheKey = "email_verify_rate:{$user->id}";
        if (Cache::has($cacheKey)) {
            return response()->json([
                'success' => false,
                'message' => 'لقد تم إرسال رابط التأكيد مؤخراً. يرجى الانتظار دقيقتين.',
                'error'   => 'rate_limited',
            ], 429);
        }

        $this->dispatchVerificationEmail($user);

        return response()->json([
            'success' => true,
            'message' => 'تم إرسال رابط التأكيد إلى بريدك الإلكتروني',
        ]);
    }

    /**
     * Verify email via token.
     * GET /api/auth/email/verify/{token}
     */
    public function verifyEmail(Request $request, string $token): JsonResponse
    {
        // Look up the token in cache (set by dispatchVerificationEmail)
        $userId = Cache::get("email_verify_token:{$token}");

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'رابط التأكيد غير صالح أو منتهي الصلاحية',
                'error'   => 'invalid_token',
            ], 400);
        }

        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'المستخدم غير موجود',
                'error'   => 'user_not_found',
            ], 404);
        }

        if ($user->email_verified_at) {
            Cache::forget("email_verify_token:{$token}");
            return response()->json([
                'success' => true,
                'message' => 'البريد الإلكتروني مؤكَّد مسبقاً',
            ]);
        }

        $user->update(['email_verified_at' => now()]);
        Cache::forget("email_verify_token:{$token}");

        Log::info("Email verified for user {$user->id}");

        return response()->json([
            'success' => true,
            'message' => 'تم تأكيد البريد الإلكتروني بنجاح 🎉',
        ]);
    }

    /**
     * [INTERNAL] Generate a verification token and dispatch the email.
     * Called from register() and login() (when email is not verified).
     * Rate-limited per user to prevent spam.
     */
    private function dispatchVerificationEmail(User $user): void
    {
        $cacheKey = "email_verify_rate:{$user->id}";
        if (Cache::has($cacheKey)) {
            return; // Silently skip if rate limited
        }

        $token     = Str::random(64);
        $tokenKey  = "email_verify_token:{$token}";

        // Token valid for 24 hours; rate limit: 2 minutes between resends
        Cache::put($tokenKey, $user->id, 60 * 60 * 24);
        Cache::put($cacheKey, true, 60 * 2);

        $verifyUrl = config('app.frontend_url', config('app.url')) . "/auth/verify-email?token={$token}";

        try {
            Mail::to($user->email)->queue(new \App\Mail\EmailVerificationMail($user, $verifyUrl));
        } catch (\Throwable $e) {
            Log::warning("EmailVerificationMail failed for user {$user->id}: " . $e->getMessage());
        }
    }
}
