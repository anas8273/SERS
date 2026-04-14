<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Feature tests for AdminWithdrawalController — approve, reject, and idempotency.
 *
 * Tests:
 * - Non-admin users cannot access withdrawal endpoints
 * - Approve: sets status to 'completed', marks earnings as paid
 * - Approve: cannot process an already-processed withdrawal
 * - Reject: sets status to 'rejected', restores earnings to 'available'
 * - Reject: requires admin_notes
 * - Double-approve protection (idempotency)
 */
class AdminWithdrawalTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────
    // Helper — create a pending withdrawal with earnings
    // ─────────────────────────────────────────────────────────

    private function createPendingWithdrawal(User $user, float $amount = 100.00): string
    {
        $withdrawalId = (string) Str::uuid();

        DB::table('withdrawal_requests')->insert([
            'id'              => $withdrawalId,
            'user_id'         => $user->id,
            'amount'          => $amount,
            'method'          => 'bank',
            'account_details' => json_encode(['iban' => 'SA0000000000000']),
            'status'          => 'pending',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        // Seed earnings in pending_withdrawal state
        DB::table('referral_earnings')->insert([
            'id'          => (string) Str::uuid(),
            'user_id'     => $user->id,
            'referral_id' => null,
            'amount'      => $amount,
            'type'        => 'commission',
            'status'      => 'pending_withdrawal',
            'description' => 'Test earning',
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return $withdrawalId;
    }

    // ─────────────────────────────────────────────────────────
    // Auth Guard
    // ─────────────────────────────────────────────────────────

    public function test_non_admin_cannot_approve_withdrawal(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $wId  = $this->createPendingWithdrawal($user, 100);

        $this->actingAs($user, 'sanctum')
             ->postJson("/api/admin/withdrawals/{$wId}/approve")
             ->assertStatus(403);
    }

    public function test_non_admin_cannot_reject_withdrawal(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $wId  = $this->createPendingWithdrawal($user, 100);

        $this->actingAs($user, 'sanctum')
             ->postJson("/api/admin/withdrawals/{$wId}/reject", ['admin_notes' => 'سبب الرفض'])
             ->assertStatus(403);
    }

    public function test_unauthenticated_cannot_access_withdrawals(): void
    {
        $this->getJson('/api/admin/withdrawals')->assertStatus(401);
    }

    // ─────────────────────────────────────────────────────────
    // Approve
    // ─────────────────────────────────────────────────────────

    public function test_admin_can_approve_pending_withdrawal(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user  = User::factory()->create();
        $wId   = $this->createPendingWithdrawal($user, 100.00);

        $this->actingAs($admin, 'sanctum')
             ->postJson("/api/admin/withdrawals/{$wId}/approve", [
                 'admin_notes' => 'تمت الموافقة',
             ])
             ->assertStatus(200)
             ->assertJsonPath('success', true);

        // Withdrawal marked as completed
        $this->assertDatabaseHas('withdrawal_requests', [
            'id'     => $wId,
            'status' => 'completed',
        ]);

        // Earnings marked as paid
        $available = DB::table('referral_earnings')
            ->where('user_id', $user->id)
            ->where('status', 'pending_withdrawal')
            ->count();

        $this->assertEquals(0, $available); // All moved to 'paid'
    }

    public function test_approve_already_processed_withdrawal_returns_404(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user  = User::factory()->create();
        $wId   = $this->createPendingWithdrawal($user, 100.00);

        // First approve
        $this->actingAs($admin, 'sanctum')
             ->postJson("/api/admin/withdrawals/{$wId}/approve");

        // Second approve — already processed
        $this->actingAs($admin, 'sanctum')
             ->postJson("/api/admin/withdrawals/{$wId}/approve")
             ->assertStatus(404)
             ->assertJsonPath('success', false);
    }

    // ─────────────────────────────────────────────────────────
    // Reject
    // ─────────────────────────────────────────────────────────

    public function test_admin_can_reject_pending_withdrawal(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user  = User::factory()->create();
        $wId   = $this->createPendingWithdrawal($user, 100.00);

        $this->actingAs($admin, 'sanctum')
             ->postJson("/api/admin/withdrawals/{$wId}/reject", [
                 'admin_notes' => 'المعلومات البنكية غير صحيحة',
             ])
             ->assertStatus(200)
             ->assertJsonPath('success', true);

        // Withdrawal marked as rejected
        $this->assertDatabaseHas('withdrawal_requests', [
            'id'     => $wId,
            'status' => 'rejected',
        ]);

        // Earnings restored to 'available'
        $restored = DB::table('referral_earnings')
            ->where('user_id', $user->id)
            ->where('status', 'available')
            ->count();

        $this->assertGreaterThan(0, $restored);
    }

    public function test_reject_requires_admin_notes(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user  = User::factory()->create();
        $wId   = $this->createPendingWithdrawal($user, 100.00);

        $this->actingAs($admin, 'sanctum')
             ->postJson("/api/admin/withdrawals/{$wId}/reject", [])
             ->assertStatus(422); // admin_notes is required
    }

    public function test_reject_already_processed_withdrawal_returns_404(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user  = User::factory()->create();
        $wId   = $this->createPendingWithdrawal($user, 100.00);

        // First approve
        $this->actingAs($admin, 'sanctum')
             ->postJson("/api/admin/withdrawals/{$wId}/approve");

        // Then reject — already completed
        $this->actingAs($admin, 'sanctum')
             ->postJson("/api/admin/withdrawals/{$wId}/reject", ['admin_notes' => 'رفض متأخر'])
             ->assertStatus(404);
    }

    // ─────────────────────────────────────────────────────────
    // List endpoint
    // ─────────────────────────────────────────────────────────

    public function test_admin_can_list_withdrawals(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin, 'sanctum')
             ->getJson('/api/admin/withdrawals')
             ->assertStatus(200)
             ->assertJsonPath('success', true);
    }

    public function test_admin_can_filter_withdrawals_by_status(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin, 'sanctum')
             ->getJson('/api/admin/withdrawals?status=pending')
             ->assertStatus(200)
             ->assertJsonPath('success', true);
    }
}
