<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Add missing sales_count column to templates table.
 * The column was in the model's $fillable but never had a migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('templates', 'sales_count')) {
            // SQLite doesn't support COMMENT or AFTER in ALTER TABLE
            if (DB::getDriverName() === 'sqlite') {
                DB::statement("ALTER TABLE templates ADD COLUMN sales_count INTEGER NOT NULL DEFAULT 0");
            } else {
                DB::statement("ALTER TABLE templates ADD COLUMN sales_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total sales count' AFTER downloads_count");
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('templates', 'sales_count')) {
            DB::statement('ALTER TABLE templates DROP COLUMN sales_count');
        }
    }
};
