<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Services\ReferralService;

/**
 * ReferralController
 *
 * Manages the referral system: codes, earnings, commissions, withdrawals.
 *
 * Security fixes applied:
 *   - All public methods wrapped in try/catch to prevent Stack Trace leakage
 *   - withdraw() has atomic balance check inside a DB transaction
 *   - processCommission() has idempotency guard to prevent double commissions
 */
class ReferralController extends Controller
{
    /**
     * Get referral statistics for the authenticated user.
     * GET /api/referrals/stats
     */
    public function stats(): JsonResponse
    {
        try {
            $user = Auth::user();

            // Single optimized query for referral counts
            $counts = DB::table('users')
                ->selectRaw("
                    COUNT(*) as total_referrals,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_referrals,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as pending_referrals
                ")
                ->where('referred_by', $user->id)
                ->first();

            // Single query for earnings (split by status)
            $earnings = DB::table('referral_earnings')
                ->selectRaw("
                    SUM(amount) as total_earnings,
                    SUM(CASE WHEN status = 'available' THEN amount ELSE 0 END) as available_balance
                ")
                ->where('user_id', $user->id)
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_referrals'   => (int) ($counts->total_referrals   ?? 0),
                    'active_referrals'  => (int) ($counts->active_referrals  ?? 0),
                    'pending_referrals' => (int) ($counts->pending_referrals ?? 0),
                    'total_earnings'    => (float) ($earnings->total_earnings    ?? 0),
                    'available_balance' => (float) ($earnings->available_balance ?? 0),
                    'referral_code'     => $user->referral_code,
                    'referral_link'     => $user->referral_code
                        ? config('app.frontend_url', env('FRONTEND_URL', config('app.url'))) . '/ref/' . $user->referral_code
                        : null,
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error('ReferralController@stats failed', [
                'user_id' => Auth::id(),
                'error'   => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب إحصائيات الإحالة',
                'error'   => 'server_error',
            ], 500);
        }
    }

    /**
     * Generate a referral code for the authenticated user.
     * POST /api/referrals/generate-code
     */
    public function generateCode(): JsonResponse
    {
        try {
            $user = Auth::user();

            if ($user->referral_code) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'referral_code' => $user->referral_code,
                        'referral_link' => config('app.frontend_url', env('FRONTEND_URL', config('app.url'))) . '/ref/' . $user->referral_code,
                    ],
                ]);
            }

            $user->referral_code = $this->generateUniqueCode();
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء كود الإحالة بنجاح',
                'data' => [
                    'referral_code' => $user->referral_code,
                    'referral_link' => config('app.frontend_url', env('FRONTEND_URL', config('app.url'))) . '/ref/' . $user->referral_code,
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error('ReferralController@generateCode failed', [
                'user_id' => Auth::id(),
                'error'   => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'فشل إنشاء كود الإحالة',
                'error'   => 'server_error',
            ], 500);
        }
    }

    /**
     * Get list of users referred by the authenticated user.
     * GET /api/referrals/list
     */
    public function referrals(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            $referrals = User::where('referred_by', $user->id)
                ->select('id', 'name', 'email', 'is_active', 'created_at')
                ->orderBy('created_at', 'desc')
                ->paginate(min($request->get('per_page', 20), 50));

            // Batch-load earnings to avoid N+1
            $referralIds = $referrals->getCollection()->pluck('id')->toArray();
            $earningsByReferral = [];
            if (!empty($referralIds)) {
                $earningsByReferral = DB::table('referral_earnings')
                    ->where('user_id', $user->id)
                    ->whereIn('referral_id', $referralIds)
                    ->select('referral_id', DB::raw('SUM(amount) as total'))
                    ->groupBy('referral_id')
                    ->pluck('total', 'referral_id')
                    ->toArray();
            }

            $referrals->getCollection()->transform(function ($referral) use ($earningsByReferral) {
                $referral->earnings = (float) ($earningsByReferral[$referral->id] ?? 0);
                $referral->status   = $this->getReferralStatus($referral);
                return $referral;
            });

            return response()->json([
                'success' => true,
                'data'    => $referrals,
            ]);

        } catch (\Throwable $e) {
            Log::error('ReferralController@referrals failed', [
                'user_id' => Auth::id(),
                'error'   => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب قائمة الإحالات',
                'error'   => 'server_error',
            ], 500);
        }
    }

    /**
     * Get referral earnings history.
     * GET /api/referrals/earnings
     */
    public function earnings(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            $earnings = DB::table('referral_earnings')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate(min($request->get('per_page', 20), 50));

            return response()->json([
                'success' => true,
                'data'    => $earnings,
            ]);

        } catch (\Throwable $e) {
            Log::error('ReferralController@earnings failed', [
                'user_id' => Auth::id(),
                'error'   => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب سجل الأرباح',
                'error'   => 'server_error',
            ], 500);
        }
    }

    /**
     * Validate a referral code.
     * POST /api/referrals/validate-code
     */
    public function validateCode(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'code' => 'required|string|max:20|alpha_num',
            ]);

            $referrer = User::where('referral_code', $validated['code'])->first();

            if (!$referrer) {
                return response()->json([
                    'success' => false,
                    'message' => 'كود الإحالة غير صالح',
                    'error'   => 'invalid_code',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'valid'         => true,
                    // [SEC] Only reveal first character — prevents user enumeration via brute-force
                    'referrer_name' => mb_substr($referrer->name, 0, 1) . str_repeat('*', max(1, mb_strlen($referrer->name) - 1)),
                    'discount'      => 10,
                ],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'كود غير صالح',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('ReferralController@validateCode failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في التحقق من الكود',
                'error'   => 'server_error',
            ], 500);
        }
    }

    /**
     * Apply a referral code for the authenticated user.
     * POST /api/referrals/apply-code
     */
    public function applyCode(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'code' => 'required|string|max:20|alpha_num',
            ]);

            $user = Auth::user();

            if ($user->referred_by) {
                return response()->json([
                    'success' => false,
                    'message' => 'لقد تم تطبيق كود إحالة مسبقاً',
                    'error'   => 'already_referred',
                ], 400);
            }

            $referrer = User::where('referral_code', $validated['code'])->first();

            if (!$referrer) {
                return response()->json([
                    'success' => false,
                    'message' => 'كود الإحالة غير صالح',
                    'error'   => 'invalid_code',
                ], 404);
            }

            if ($referrer->id === $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'لا يمكنك استخدام كود الإحالة الخاص بك',
                    'error'   => 'self_referral',
                ], 400);
            }

            DB::transaction(function () use ($user, $referrer) {
                $user->referred_by = $referrer->id;
                $user->save();

                // Give welcome bonus to new user
                DB::table('referral_earnings')->insert([
                    'id'          => (string) Str::uuid(),
                    'user_id'     => $user->id,
                    'referral_id' => null,
                    // [FIX S-03] Join bonus from config, not hardcoded
                    'amount'      => config('referral.join_bonus', 20),
                    'type'        => 'bonus',
                    'status'      => 'available',
                    'description' => 'مكافأة ترحيبية',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'تم تطبيق كود الإحالة بنجاح',
                'data'    => ['bonus' => 20],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'كود غير صالح',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('ReferralController@applyCode failed', [
                'user_id' => Auth::id(),
                'error'   => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'فشل تطبيق كود الإحالة',
                'error'   => 'server_error',
            ], 500);
        }
    }

    /**
     * Request withdrawal of earnings.
     * POST /api/referrals/withdraw
     */
    public function withdraw(Request $request): JsonResponse
    {
        try {
            $minWithdrawal = config('referral.min_withdrawal_amount', 50);
            $maxWithdrawal = config('referral.max_withdrawal_amount', 10000);

            $validated = $request->validate([
                // [FIX S-02] Use config values — not hardcoded numbers
                'amount'          => "required|numeric|min:{$minWithdrawal}|max:{$maxWithdrawal}",
                'method'          => 'required|string|in:bank,wallet',
                'account_details' => 'required|array',
            ]);

            $user = Auth::user();

            // [FIX SEC-03] Re-check balance INSIDE a DB transaction to prevent race conditions
            DB::transaction(function () use ($user, $validated) {
                // Lock-for-update the available balance
                $availableBalance = (float) DB::table('referral_earnings')
                    ->where('user_id', $user->id)
                    ->where('status', 'available')
                    ->lockForUpdate()
                    ->sum('amount');

                if ((float) $validated['amount'] > $availableBalance) {
                    throw new \Exception('الرصيد المتاح غير كافٍ');
                }

                // Create withdrawal record
                DB::table('withdrawal_requests')->insert([
                    'id'              => (string) Str::uuid(),
                    'user_id'         => $user->id,
                    'amount'          => $validated['amount'],
                    'method'          => $validated['method'],
                    'account_details' => json_encode($validated['account_details']),
                    'status'          => 'pending',
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);

                // Mark earnings as pending_withdrawal (FIFO)
                $remaining = (float) $validated['amount'];
                $rows = DB::table('referral_earnings')
                    ->where('user_id', $user->id)
                    ->where('status', 'available')
                    ->orderBy('created_at')
                    ->get(['id', 'amount']);

                $ids = [];
                foreach ($rows as $row) {
                    if ($remaining <= 0) break;
                    $ids[]    = $row->id;
                    $remaining -= (float) $row->amount;
                }

                if (!empty($ids)) {
                    DB::table('referral_earnings')
                        ->whereIn('id', $ids)
                        ->update(['status' => 'pending_withdrawal', 'updated_at' => now()]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'تم تقديم طلب السحب بنجاح وسيتم مراجعته خلال 3-5 أيام عمل',
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صالحة',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            // Business logic errors (insufficient balance, etc.)
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error'   => 'withdrawal_rejected',
            ], 400);
        } catch (\Throwable $e) {
            Log::error('ReferralController@withdraw failed', [
                'user_id' => Auth::id(),
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'فشل طلب السحب، يرجى المحاولة لاحقاً',
                'error'   => 'server_error',
            ], 500);
        }
    }

    /**
     * Process referral commission when a referred user completes a purchase.
     * [BUG-03] Delegates to ReferralService for proper separation of concerns.
     * Kept as static method on Controller for backward compatibility.
     */
    public static function processCommission(User $buyer, float $orderAmount, string $orderId): void
    {
        ReferralService::processCommission($buyer, $orderAmount, $orderId);
    }

    /**
     * Generate a unique referral code.
     */
    private function generateUniqueCode(): string
    {
        $attempts = 0;
        do {
            $code = 'SERS' . strtoupper(Str::random(6));
            $attempts++;
            if ($attempts > 20) {
                // Fallback: use longer random string
                $code = 'SERS' . strtoupper(Str::random(10));
                break;
            }
        } while (User::where('referral_code', $code)->exists());

        return $code;
    }

    /**
     * Get referral status based on activity and purchases.
     */
    private function getReferralStatus(User $referral): string
    {
        if (!$referral->is_active) {
            return 'pending';
        }

        $hasPurchases = DB::table('orders')
            ->where('user_id', $referral->id)
            ->where('status', 'completed')
            ->exists();

        return $hasPurchases ? 'completed' : 'active';
    }
}
