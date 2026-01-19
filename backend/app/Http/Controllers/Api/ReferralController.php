<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReferralController extends Controller
{
    /**
     * Get referral statistics for the authenticated user.
     */
    public function stats()
    {
        $user = Auth::user();
        
        // Get referral counts
        $totalReferrals = User::where('referred_by', $user->id)->count();
        $activeReferrals = User::where('referred_by', $user->id)
                              ->where('is_active', true)
                              ->count();
        $pendingReferrals = User::where('referred_by', $user->id)
                               ->where('is_active', false)
                               ->count();
        
        // Calculate earnings
        $totalEarnings = DB::table('referral_earnings')
                          ->where('user_id', $user->id)
                          ->sum('amount');
        
        $availableBalance = DB::table('referral_earnings')
                             ->where('user_id', $user->id)
                             ->where('status', 'available')
                             ->sum('amount');
        
        // Generate referral code if not exists
        if (!$user->referral_code) {
            $user->referral_code = $this->generateReferralCode();
            $user->save();
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_referrals' => $totalReferrals,
                'active_referrals' => $activeReferrals,
                'pending_referrals' => $pendingReferrals,
                'total_earnings' => $totalEarnings,
                'available_balance' => $availableBalance,
                'referral_code' => $user->referral_code,
                'referral_link' => config('app.url') . '/ref/' . $user->referral_code,
            ],
        ]);
    }

    /**
     * Get list of referrals.
     */
    public function referrals(Request $request)
    {
        $user = Auth::user();
        
        $referrals = User::where('referred_by', $user->id)
                        ->select('id', 'name', 'email', 'is_active', 'created_at')
                        ->orderBy('created_at', 'desc')
                        ->paginate($request->get('per_page', 20));
        
        // Add earnings for each referral
        $referrals->getCollection()->transform(function ($referral) use ($user) {
            $earnings = DB::table('referral_earnings')
                        ->where('user_id', $user->id)
                        ->where('referral_id', $referral->id)
                        ->sum('amount');
            
            $referral->earnings = $earnings;
            $referral->status = $this->getReferralStatus($referral);
            
            return $referral;
        });
        
        return response()->json([
            'success' => true,
            'data' => $referrals,
        ]);
    }

    /**
     * Get referral earnings history.
     */
    public function earnings(Request $request)
    {
        $user = Auth::user();
        
        $earnings = DB::table('referral_earnings')
                     ->where('user_id', $user->id)
                     ->orderBy('created_at', 'desc')
                     ->paginate($request->get('per_page', 20));
        
        return response()->json([
            'success' => true,
            'data' => $earnings,
        ]);
    }

    /**
     * Validate a referral code.
     */
    public function validateCode(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20',
        ]);
        
        $referrer = User::where('referral_code', $validated['code'])->first();
        
        if (!$referrer) {
            return response()->json([
                'success' => false,
                'message' => 'كود الإحالة غير صالح',
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'valid' => true,
                'referrer_name' => $referrer->name,
                'discount' => 10, // 10% discount for new users
            ],
        ]);
    }

    /**
     * Apply referral code during registration.
     */
    public function applyCode(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20',
        ]);
        
        $user = Auth::user();
        
        // Check if user already has a referrer
        if ($user->referred_by) {
            return response()->json([
                'success' => false,
                'message' => 'لقد تم تطبيق كود إحالة مسبقاً',
            ], 400);
        }
        
        $referrer = User::where('referral_code', $validated['code'])->first();
        
        if (!$referrer) {
            return response()->json([
                'success' => false,
                'message' => 'كود الإحالة غير صالح',
            ], 404);
        }
        
        // Can't refer yourself
        if ($referrer->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكنك استخدام كود الإحالة الخاص بك',
            ], 400);
        }
        
        // Apply referral
        $user->referred_by = $referrer->id;
        $user->save();
        
        // Give welcome bonus to new user
        DB::table('referral_earnings')->insert([
            'id' => Str::uuid(),
            'user_id' => $user->id,
            'referral_id' => null,
            'amount' => 20, // Welcome bonus
            'type' => 'bonus',
            'status' => 'available',
            'description' => 'مكافأة ترحيبية',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'تم تطبيق كود الإحالة بنجاح',
            'data' => [
                'bonus' => 20,
            ],
        ]);
    }

    /**
     * Request withdrawal of earnings.
     */
    public function withdraw(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:50',
            'method' => 'required|string|in:bank,wallet',
            'account_details' => 'required|array',
        ]);
        
        $user = Auth::user();
        
        $availableBalance = DB::table('referral_earnings')
                             ->where('user_id', $user->id)
                             ->where('status', 'available')
                             ->sum('amount');
        
        if ($validated['amount'] > $availableBalance) {
            return response()->json([
                'success' => false,
                'message' => 'الرصيد المتاح غير كافٍ',
            ], 400);
        }
        
        // Create withdrawal request
        $withdrawalId = DB::table('withdrawal_requests')->insertGetId([
            'id' => Str::uuid(),
            'user_id' => $user->id,
            'amount' => $validated['amount'],
            'method' => $validated['method'],
            'account_details' => json_encode($validated['account_details']),
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Mark earnings as pending withdrawal
        DB::table('referral_earnings')
          ->where('user_id', $user->id)
          ->where('status', 'available')
          ->limit($validated['amount'])
          ->update(['status' => 'pending_withdrawal']);
        
        return response()->json([
            'success' => true,
            'message' => 'تم تقديم طلب السحب بنجاح',
            'data' => [
                'withdrawal_id' => $withdrawalId,
            ],
        ]);
    }

    /**
     * Process referral commission when a referred user makes a purchase.
     */
    public static function processCommission(User $buyer, float $orderAmount)
    {
        if (!$buyer->referred_by) {
            return;
        }
        
        $referrer = User::find($buyer->referred_by);
        if (!$referrer) {
            return;
        }
        
        // Calculate commission (10% of order amount)
        $commission = $orderAmount * 0.10;
        
        // Add earnings to referrer
        DB::table('referral_earnings')->insert([
            'id' => Str::uuid(),
            'user_id' => $referrer->id,
            'referral_id' => $buyer->id,
            'amount' => $commission,
            'type' => 'commission',
            'status' => 'available',
            'description' => 'عمولة إحالة - ' . $buyer->name,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Generate unique referral code.
     */
    private function generateReferralCode(): string
    {
        do {
            $code = 'SERS' . strtoupper(Str::random(6));
        } while (User::where('referral_code', $code)->exists());
        
        return $code;
    }

    /**
     * Get referral status based on activity.
     */
    private function getReferralStatus(User $referral): string
    {
        if (!$referral->is_active) {
            return 'pending';
        }
        
        // Check if user has made any purchases
        $hasPurchases = DB::table('orders')
                        ->where('user_id', $referral->id)
                        ->where('status', 'completed')
                        ->exists();
        
        return $hasPurchases ? 'completed' : 'active';
    }
}
