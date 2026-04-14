<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * [G-07] Expire stale pending orders.
 *
 * Orders that remain in 'pending' status for more than 24 hours
 * are automatically cancelled. This prevents database bloat from
 * users who create orders but never complete payment.
 *
 * Usage:
 *   php artisan orders:expire-stale          (manual run)
 *   Schedule::command('orders:expire-stale')->hourly();  (automatic)
 */
class ExpireStaleOrders extends Command
{
    protected $signature = 'orders:expire-stale 
                            {--hours=24 : Hours after which pending orders are cancelled}
                            {--dry-run : Show what would be cancelled without changing anything}';

    protected $description = 'Cancel pending orders older than 24 hours';

    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $dryRun = (bool) $this->option('dry-run');
        $cutoff = now()->subHours($hours);

        $query = Order::where('status', Order::STATUS_PENDING)
            ->where('created_at', '<', $cutoff);

        $count = $query->count();

        if ($count === 0) {
            $this->info('✅ No stale orders found.');
            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->warn("🔍 Dry run: {$count} order(s) would be cancelled (older than {$hours}h).");
            $query->get(['id', 'order_number', 'created_at'])->each(function ($order) {
                $this->line("  - {$order->order_number} (created: {$order->created_at})");
            });
            return self::SUCCESS;
        }

        // [C-04 FIX] Build JSON safely in PHP instead of DB::raw()
        $expiredMeta = json_encode([
            'auto_expired' => true,
            'expired_at'   => now()->toISOString(),
        ]);

        $updated = $query->update([
            'status'          => Order::STATUS_CANCELLED,
            'payment_details' => $expiredMeta,
        ]);

        Log::info("ExpireStaleOrders: cancelled {$updated} stale pending orders", [
            'hours_threshold' => $hours,
            'cutoff_time' => $cutoff->toISOString(),
        ]);

        $this->info("✅ Cancelled {$updated} stale pending order(s) older than {$hours}h.");

        return self::SUCCESS;
    }
}
