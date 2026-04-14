<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * [PERF] Add missing database indexes for high-frequency queries.
 * These indexes dramatically speed up:
 * - Wallet transaction lookups (by user_id + type)
 * - Order queries (by user_id + status)
 * - Template marketplace listing (by section + active + featured)
 * - AI conversation stats (by created_at + user_id)
 */
return new class extends Migration
{
    public function up(): void
    {
        // Wallet transactions — queried by user_id on every wallet page load
        if (Schema::hasTable('wallet_transactions')) {
            Schema::table('wallet_transactions', function (Blueprint $table) {
                if (!$this->hasIndex('wallet_transactions', 'wallet_transactions_user_id_created_at_index')) {
                    $table->index(['user_id', 'created_at'], 'wallet_transactions_user_id_created_at_index');
                }
                if (!$this->hasIndex('wallet_transactions', 'wallet_transactions_type_index')) {
                    $table->index('type', 'wallet_transactions_type_index');
                }
            });
        }

        // Orders — queried by user_id + status on dashboard, order history
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!$this->hasIndex('orders', 'orders_user_id_status_index')) {
                    $table->index(['user_id', 'status'], 'orders_user_id_status_index');
                }
                if (!$this->hasIndex('orders', 'orders_status_created_at_index')) {
                    $table->index(['status', 'created_at'], 'orders_status_created_at_index');
                }
            });
        }

        // Templates — marketplace listing uses section_id + is_active + is_featured
        if (Schema::hasTable('templates')) {
            Schema::table('templates', function (Blueprint $table) {
                if (!$this->hasIndex('templates', 'templates_section_active_featured_index')) {
                    $table->index(['section_id', 'is_active', 'is_featured'], 'templates_section_active_featured_index');
                }
                if (!$this->hasIndex('templates', 'templates_category_active_index')) {
                    $table->index(['category_id', 'is_active'], 'templates_category_active_index');
                }
            });
        }

        // AI Conversations — admin stats queries by created_at and user_id
        if (Schema::hasTable('ai_conversations')) {
            Schema::table('ai_conversations', function (Blueprint $table) {
                if (!$this->hasIndex('ai_conversations', 'ai_conversations_user_id_created_at_index')) {
                    $table->index(['user_id', 'created_at'], 'ai_conversations_user_id_created_at_index');
                }
            });
        }

        // Reviews — template detail page loads approved reviews
        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                if (!$this->hasIndex('reviews', 'reviews_template_id_approved_index')) {
                    $table->index(['template_id', 'is_approved'], 'reviews_template_id_approved_index');
                }
            });
        }
    }

    public function down(): void
    {
        $drops = [
            'wallet_transactions' => ['wallet_transactions_user_id_created_at_index', 'wallet_transactions_type_index'],
            'orders' => ['orders_user_id_status_index', 'orders_status_created_at_index'],
            'templates' => ['templates_section_active_featured_index', 'templates_category_active_index'],
            'ai_conversations' => ['ai_conversations_user_id_created_at_index'],
            'reviews' => ['reviews_template_id_approved_index'],
        ];

        foreach ($drops as $table => $indexes) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) use ($indexes) {
                    foreach ($indexes as $index) {
                        try { $table->dropIndex($index); } catch (\Exception $e) { /* Index may not exist */ }
                    }
                });
            }
        }
    }

    /**
     * Check if an index exists on a table.
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        try {
            $indexes = Schema::getIndexes($table);
            foreach ($indexes as $index) {
                if ($index['name'] === $indexName) return true;
            }
        } catch (\Exception $e) {
            // Fallback for older Laravel versions
        }
        return false;
    }
};
