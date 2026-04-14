<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Make section_id nullable in categories table using raw SQL.
 * Categories are now independent job-role groups (الإدارة المدرسية, التربية الخاصة, etc.)
 * and are NOT sub-categories of sections anymore.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Skip on SQLite
        if (\DB::getDriverName() === 'sqlite') { return; }

        // 1. Drop foreign key constraint on section_id
        try {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropForeign(['section_id']);
            });
        } catch (\Exception $e) {
            // FK might already be dropped or named differently
            // Try the named format
            try {
                Schema::table('categories', function (Blueprint $table) {
                    $table->dropForeign('categories_section_id_foreign');
                });
            } catch (\Exception $e2) {
                // Ignore if FK doesn't exist
            }
        }

        // 2. Make section_id nullable using raw SQL (avoids doctrine/dbal dependency)
        DB::statement('ALTER TABLE categories MODIFY section_id CHAR(36) NULL DEFAULT NULL');

        // 3. Fix fulltext index if name_en was dropped
        try {
            DB::statement('ALTER TABLE categories DROP INDEX categories_fulltext_name');
        } catch (\Exception $e) {
            // Index might not exist
        }

        // 4. Create new fulltext index on name_ar only
        try {
            DB::statement('ALTER TABLE categories ADD FULLTEXT INDEX categories_fulltext_name (name_ar)');
        } catch (\Exception $e) {
            // Index might already exist
        }
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE categories MODIFY section_id CHAR(36) NOT NULL');
    }
};
