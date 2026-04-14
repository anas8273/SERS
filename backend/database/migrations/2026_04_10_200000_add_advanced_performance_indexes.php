<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * [PERF-2] Advanced Performance Indexes
 *
 * Adds FULLTEXT index for Arabic search (replaces LIKE %%) and
 * composite indexes for the most frequent query patterns:
 * - Notification badge (user_id + is_read)
 * - Library ownership (user_id + template_id)
 * - Referral balance (user_id + status)
 * - Coupon per-user limit (coupon_id + user_id)
 * - Withdrawal queue (user_id + status)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. FULLTEXT search on Arabic template names/descriptions ──────────
        // Replaces the slow LIKE %search% with MATCH() AGAINST() IN BOOLEAN MODE
        if (Schema::hasTable('templates')) {
            try {
                // Check if FULLTEXT index already exists
                $exists = DB::select("
                    SELECT 1 FROM information_schema.STATISTICS
                    WHERE table_schema = DATABASE()
                      AND table_name = 'templates'
                      AND index_name = 'templates_fulltext_search'
                    LIMIT 1
                ");
                if (empty($exists)) {
                    DB::statement('ALTER TABLE templates ADD FULLTEXT INDEX templates_fulltext_search (name_ar, description_ar)');
                }
            } catch (\Exception $e) {
                // Graceful degradation: FULLTEXT not supported (e.g., SQLite in tests)
                \Illuminate\Support\Facades\Log::warning('[PERF] FULLTEXT index skipped: ' . $e->getMessage());
            }
        }

        // ── 2. Notifications — badge count query (user_id + is_read + created_at) ──
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                if (!$this->hasIndex('notifications', 'notifications_user_unread_index')) {
                    $table->index(['user_id', 'is_read', 'created_at'], 'notifications_user_unread_index');
                }
            });
        }

        // ── 3. User Libraries — ownership check on every page load ────────────
        if (Schema::hasTable('user_libraries')) {
            Schema::table('user_libraries', function (Blueprint $table) {
                if (!$this->hasIndex('user_libraries', 'user_libraries_user_template_index')) {
                    $table->index(['user_id', 'template_id'], 'user_libraries_user_template_index');
                }
            });
        }

        // ── 4. Referral Earnings — balance calculation (user_id + status) ─────
        if (Schema::hasTable('referral_earnings')) {
            Schema::table('referral_earnings', function (Blueprint $table) {
                if (!$this->hasIndex('referral_earnings', 'referral_earnings_user_status_index')) {
                    $table->index(['user_id', 'status'], 'referral_earnings_user_status_index');
                }
                if (!$this->hasIndex('referral_earnings', 'referral_earnings_created_at_index')) {
                    $table->index('created_at', 'referral_earnings_created_at_index');
                }
            });
        }

        // ── 5. Coupon Usages — per-user usage limit enforcement ───────────────
        if (Schema::hasTable('coupon_usages')) {
            Schema::table('coupon_usages', function (Blueprint $table) {
                if (!$this->hasIndex('coupon_usages', 'coupon_usages_coupon_user_index')) {
                    $table->index(['coupon_id', 'user_id'], 'coupon_usages_coupon_user_index');
                }
            });
        }

        // ── 6. Withdrawal Requests — admin list (status + created_at) ─────────
        if (Schema::hasTable('withdrawal_requests')) {
            Schema::table('withdrawal_requests', function (Blueprint $table) {
                if (!$this->hasIndex('withdrawal_requests', 'withdrawal_requests_user_status_index')) {
                    $table->index(['user_id', 'status'], 'withdrawal_requests_user_status_index');
                }
                if (!$this->hasIndex('withdrawal_requests', 'withdrawal_requests_status_created_at_index')) {
                    $table->index(['status', 'created_at'], 'withdrawal_requests_status_created_at_index');
                }
            });
        }

        // ── 7. Orders — order_number lookup (unique, frequently queried) ──────
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!$this->hasIndex('orders', 'orders_order_number_index')) {
                    $table->index('order_number', 'orders_order_number_index');
                }
            });
        }

        // ── 8. Template sort_order — marketplace listing sort ─────────────────
        if (Schema::hasTable('templates')) {
            Schema::table('templates', function (Blueprint $table) {
                if (!$this->hasIndex('templates', 'templates_sort_order_active_index')) {
                    $table->index(['is_active', 'sort_order'], 'templates_sort_order_active_index');
                }
                if (!$this->hasIndex('templates', 'templates_price_active_index')) {
                    $table->index(['is_active', 'price'], 'templates_price_active_index');
                }
            });
        }
    }

    public function down(): void
    {
        // Drop FULLTEXT index
        if (Schema::hasTable('templates')) {
            try {
                DB::statement('ALTER TABLE templates DROP INDEX templates_fulltext_search');
            } catch (\Exception $e) {}
        }

        $drops = [
            'notifications'       => ['notifications_user_unread_index'],
            'user_libraries'      => ['user_libraries_user_template_index'],
            'referral_earnings'   => ['referral_earnings_user_status_index', 'referral_earnings_created_at_index'],
            'coupon_usages'       => ['coupon_usages_coupon_user_index'],
            'withdrawal_requests' => ['withdrawal_requests_user_status_index', 'withdrawal_requests_status_created_at_index'],
            'orders'              => ['orders_order_number_index'],
            'templates'           => ['templates_sort_order_active_index', 'templates_price_active_index'],
        ];

        foreach ($drops as $table => $indexes) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $t) use ($indexes) {
                    foreach ($indexes as $index) {
                        try { $t->dropIndex($index); } catch (\Exception $e) {}
                    }
                });
            }
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        try {
            $indexes = Schema::getIndexes($table);
            foreach ($indexes as $index) {
                if ($index['name'] === $indexName) return true;
            }
        } catch (\Exception $e) {}
        return false;
    }
};
