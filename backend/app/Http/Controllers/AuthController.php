<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;

class AuthController extends Controller
{
    /**
     * تسجيل مستخدم جديد (تسجيل تقليدي)
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'is_active' => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الحساب بنجاح',
            'data' => compact('user', 'token'),
        ], 201);
    }

    /**
     * تسجيل الدخول (بريد + كلمة مرور)
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['بيانات الدخول غير صحيحة'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['هذا الحساب معطّل'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الدخول بنجاح',
            'data' => compact('user', 'token'),
        ]);
    }

    /**
     * تسجيل الدخول عبر Firebase (Google / Social Login)
     */
    public function socialLogin(Request $request): JsonResponse
    {
        $request->validate([
            'firebase_token' => 'required|string',
        ]);

        try {
            $factory = (new Factory)
                ->withServiceAccount(storage_path('app/firebase/service-account.json'))
                ->withProjectId(config('services.firebase.project_id'));

            $auth = $factory->createAuth();

            // التحقق من صحة التوكن
            $verifiedToken = $auth->verifyIdToken($request->firebase_token);
            $firebaseUid = $verifiedToken->claims()->get('sub');

            $firebaseUser = $auth->getUser($firebaseUid);

            // إنشاء / تحديث المستخدم محلياً
            $user = User::updateOrCreate(
                ['email' => $firebaseUser->email],
                [
                    'name' => $firebaseUser->displayName ?? 'User',
                    'firebase_uid' => $firebaseUid,
                    'password' => Hash::make(Str::random(32)),
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]
            );

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الدخول بنجاح',
                'data' => compact('user', 'token'),
            ]);

        } catch (FailedToVerifyToken $e) {
            return response()->json([
                'success' => false,
                'message' => 'توكن Firebase غير صالح أو منتهي',
            ], 401);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تسجيل الدخول',
            ], 500);
        }
    }

    /**
     * تسجيل الخروج
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الخروج بنجاح',
        ]);
    }

    /**
     * بيانات المستخدم الحالي
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user(),
            ],
        ]);
    }
}
