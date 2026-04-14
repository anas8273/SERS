<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Mail\WithdrawalStatusMail;

/**
 * AdminWithdrawalController
 * 
 * Manages admin withdrawal approval/rejection seamlessly, utilizing atomic
 * locks and safe referral earning rollbacks.
 */
class AdminWithdrawalController extends Controller
{
    /**
     * Get a paginated list of all withdrawals.
     * GET /api/admin/withdrawals?status=pending&per_page=20
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status'   => 'sometimes|in:pending,processing,completed,rejected',
            'per_page' => 'sometimes|integer|min:5|max:100',
        ]);

        try {
            $query = DB::table('withdrawal_requests')
                ->join('users', 'withdrawal_requests.user_id', '=', 'users.id')
                ->select(
                    'withdrawal_requests.*',
                    'users.name as user_name',
                    'users.email as user_email'
                )
                ->orderBy('withdrawal_requests.created_at', 'desc');

            if ($request->has('status')) {
                $query->where('withdrawal_requests.status', $request->input('status'));
            }

            $data = $query->paginate($request->input('per_page', 20));

            // Decode account_details JSON for each row
            $data->getCollection()->transform(function ($row) {
                try {
                    $row->account_details = json_decode($row->account_details, true) ?? [];
                } catch (\Exception $e) {
                    $row->account_details = [];
                }
                return $row;
            });

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            Log::error('AdminWithdrawalController@index error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء جلب الطلبات'], 500);
        }
    }

    /**
     * Get withdrawal summary statistics.
     * GET /api/admin/withdrawals/stats
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = DB::table('withdrawal_requests')
                ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total'))
                ->groupBy('status')
                ->get()
                ->keyBy('status');

            return response()->json([
                'success' => true,
                'data' => [
                    'pending'    => ['count' => optional($stats->get('pending'))->count    ?? 0, 'total' => optional($stats->get('pending'))->total    ?? 0],
                    'processing' => ['count' => optional($stats->get('processing'))->count ?? 0, 'total' => optional($stats->get('processing'))->total ?? 0],
                    'completed'  => ['count' => optional($stats->get('completed'))->count  ?? 0, 'total' => optional($stats->get('completed'))->total  ?? 0],
                    'rejected'   => ['count' => optional($stats->get('rejected'))->count   ?? 0, 'total' => optional($stats->get('rejected'))->total   ?? 0],
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('AdminWithdrawalController@stats error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء جلب الإحصائيات'], 500);
        }
    }

    /**
     * Approve a withdrawal request.
     * POST /api/admin/withdrawals/{id}/approve
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'admin_notes' => 'nullable|string|max:500',
        ]);

        try {
            $adminNotes = $request->input('admin_notes', 'تمت الموافقة');
            
            DB::beginTransaction();

            $withdrawal = DB::table('withdrawal_requests')->where('id', $id)->lockForUpdate()->first();
            if (!$withdrawal || $withdrawal->status !== 'pending') {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'الطلب غير موجود أو تمت معالجته مسبقاً'], 404);
            }

            $adminId = Auth::id();

            // Mark request as completed
            DB::table('withdrawal_requests')
                ->where('id', $id)
                ->update([
                    'status'       => 'completed',
                    'admin_notes'  => $adminNotes,
                    'processed_by' => $adminId,
                    'processed_at' => now(),
                    'updated_at'   => now(),
                ]);

            // Mark the correct amount of pending_withdrawal earnings as paid
            $this->markEarningsPaid($withdrawal->user_id, $withdrawal->amount);

            // If method === 'wallet', credit the user SERS wallet
            if ($withdrawal->method === 'wallet') {
                // [SEC-03 FIX] Read balance BEFORE increment for safe ledger entry
                $freshUser = DB::table('users')->where('id', $withdrawal->user_id)->lockForUpdate()->first();
                $balanceBefore = (float) ($freshUser->wallet_balance ?? 0);

                DB::table('users')
                    ->where('id', $withdrawal->user_id)
                    ->increment('wallet_balance', $withdrawal->amount);

                $balanceAfter = $balanceBefore + (float) $withdrawal->amount;

                // FIXED: Use type => 'deposit' instead of 'credit' to respect DB ENUM.
                // [SEC-03] Use pre-calculated PHP values instead of DB::raw() to prevent SQL injection
                DB::table('wallet_transactions')->insert([
                    'id'              => (string) Str::uuid(),
                    'user_id'         => $withdrawal->user_id,
                    'type'            => 'deposit',
                    'amount'          => $withdrawal->amount,
                    'balance_before'  => $balanceBefore,
                    'balance_after'   => $balanceAfter,
                    'description'     => 'تحويل أرباح إحالة إلى المحفظة',
                    'reference_id'    => $id,
                    'reference_type'  => 'withdrawal',
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);
            }

            // Notify user
            DB::table('notifications')->insert([
                'id'         => (string) Str::uuid(),
                'user_id'    => $withdrawal->user_id,
                'type'       => 'withdrawal_approved',
                'title'      => 'تمت الموافقة على طلب السحب',
                'message'    => "تمت الموافقة على طلب سحب " . number_format($withdrawal->amount, 2) . " ر.س",
                'is_read'    => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            // [EMAIL] Send approval email logic OUTSIDE transaction
            try {
                $user = DB::table('users')->where('id', $withdrawal->user_id)->first();
                if ($user && $user->email) {
                    Mail::to($user->email)->queue(new WithdrawalStatusMail($withdrawal, 'completed', $adminNotes));
                }
            } catch (\Throwable $e) {
                Log::warning('WithdrawalStatusMail(approve) failed: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'message' => 'تمت الموافقة على طلب السحب بنجاح']);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminWithdrawalController@approve error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء الموافقة'], 500);
        }
    }

    /**
     * Reject a withdrawal request.
     * POST /api/admin/withdrawals/{id}/reject
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'admin_notes' => 'required|string|max:500',
        ]);

        try {
            $adminNotes = $request->input('admin_notes');

            DB::beginTransaction();

            $withdrawal = DB::table('withdrawal_requests')->where('id', $id)->lockForUpdate()->first();
            if (!$withdrawal || $withdrawal->status !== 'pending') {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'الطلب غير موجود أو تمت معالجته مسبقاً'], 404);
            }

            $adminId = Auth::id();

            // Mark request as rejected
            DB::table('withdrawal_requests')
                ->where('id', $id)
                ->update([
                    'status'       => 'rejected',
                    'admin_notes'  => $adminNotes,
                    'processed_by' => $adminId,
                    'processed_at' => now(),
                    'updated_at'   => now(),
                ]);

            // [FIXED] Smart reversion of ONLY the $withdrawal->amount
            $this->refundEarnings($withdrawal->user_id, $withdrawal->amount);

            // Notify user
            DB::table('notifications')->insert([
                'id'         => (string) Str::uuid(),
                'user_id'    => $withdrawal->user_id,
                'type'       => 'withdrawal_rejected',
                'title'      => 'رفض طلب السحب',
                'message'    => "تم رفض طلب سحب " . number_format($withdrawal->amount, 2) . " ر.س. السبب: " . $adminNotes,
                'is_read'    => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            // [EMAIL] withdrawal reject email OUTSIDE transaction
            try {
                $user = DB::table('users')->where('id', $withdrawal->user_id)->first();
                if ($user && $user->email) {
                    Mail::to($user->email)->queue(new WithdrawalStatusMail($withdrawal, 'rejected', $adminNotes));
                }
            } catch (\Throwable $e) {
                Log::warning('WithdrawalStatusMail(reject) failed: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'message' => 'تم رفض طلب السحب وإعادة الرصيد للمستخدم']);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminWithdrawalController@reject error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء الرفض'], 500);
        }
    }

    /**
     * Mark exactly the specified amount of 'pending_withdrawal' earnings as 'paid'.
     */
    private function markEarningsPaid(string $userId, float $amountToMark): void
    {
        $remaining = $amountToMark;

        $rows = DB::table('referral_earnings')
            ->where('user_id', $userId)
            ->where('status', 'pending_withdrawal')
            ->orderBy('created_at', 'asc') // FIFO
            ->lockForUpdate()
            ->get(['id', 'amount']);

        $ids = [];
        foreach ($rows as $row) {
            if ($remaining <= 0.001) break;
            $ids[] = $row->id;
            $remaining -= (float) $row->amount;
        }

        if (!empty($ids)) {
            DB::table('referral_earnings')
                ->whereIn('id', $ids)
                ->update(['status' => 'paid', 'updated_at' => now()]);
        }
    }

    /**
     * Smart refund. Instead of dumping all pending_withdrawals back to available,
     * it refunds EXACTLY the $amount that was rejected, using FIFO backwards tracking.
     */
    private function refundEarnings(string $userId, float $amountToRefund): void
    {
        $remaining = $amountToRefund;

        // Fetch pending_withdrawal earnings to reverse (LIFO is fine or FIFO)
        $rows = DB::table('referral_earnings')
            ->where('user_id', $userId)
            ->where('status', 'pending_withdrawal')
            ->orderBy('created_at', 'desc') // reverse fallback
            ->lockForUpdate()
            ->get(['id', 'amount']);

        $ids = [];
        foreach ($rows as $row) {
            if ($remaining <= 0.001) break;
            $ids[] = $row->id;
            $remaining -= (float) $row->amount;
        }

        if (!empty($ids)) {
            DB::table('referral_earnings')
                ->whereIn('id', $ids)
                ->update(['status' => 'available', 'updated_at' => now()]);
        }
    }
}
