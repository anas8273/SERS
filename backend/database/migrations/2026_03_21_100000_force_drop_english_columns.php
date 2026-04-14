<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FORCE drop name_en/description_en columns that previous migrations failed to remove.
 * Uses raw SQL to avoid doctrine/dbal dependency.
 * Also fixes category_id constraints on templates table.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Skip on SQLite — these are MySQL-specific ALTER operations
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        // ═══════ SECTIONS ═══════
        // Drop fulltext indexes that might reference name_en
        $this->safeDropIndex('sections', 'sections_fulltext_name');
        
        if (Schema::hasColumn('sections', 'name_en')) {
            DB::statement('ALTER TABLE sections DROP COLUMN name_en');
        }
        if (Schema::hasColumn('sections', 'description_en')) {
            DB::statement('ALTER TABLE sections DROP COLUMN description_en');
        }

        // ═══════ CATEGORIES ═══════
        $this->safeDropIndex('categories', 'categories_fulltext_name');
        $this->safeDropFK('categories', 'categories_section_id_foreign');
        
        if (Schema::hasColumn('categories', 'name_en')) {
            DB::statement('ALTER TABLE categories DROP COLUMN name_en');
        }
        if (Schema::hasColumn('categories', 'description_en')) {
            DB::statement('ALTER TABLE categories DROP COLUMN description_en');
        }
        
        // Make section_id nullable
        DB::statement('ALTER TABLE categories MODIFY section_id CHAR(36) NULL DEFAULT NULL');
        
        // Re-create fulltext on name_ar only
        try { DB::statement('ALTER TABLE categories ADD FULLTEXT INDEX categories_fulltext_name (name_ar)'); } catch (\Exception $e) {}

        // ═══════ TEMPLATES ═══════
        $this->safeDropIndex('templates', 'templates_fulltext_name');
        $this->safeDropFK('templates', 'templates_category_id_foreign');
        $this->safeDropIndex('templates', 'templates_category_index');
        $this->safeDropIndex('templates', 'templates_category_active_index');
        
        if (Schema::hasColumn('templates', 'name_en')) {
            DB::statement('ALTER TABLE templates DROP COLUMN name_en');
        }
        if (Schema::hasColumn('templates', 'description_en')) {
            DB::statement('ALTER TABLE templates DROP COLUMN description_en');
        }
        
        // Make category_id nullable VARCHAR
        DB::statement('ALTER TABLE templates MODIFY category_id VARCHAR(255) NULL DEFAULT NULL');
        
        // Re-create indexes
        try { DB::statement('CREATE INDEX templates_category_index ON templates (category_id)'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE templates ADD FULLTEXT INDEX templates_fulltext_name (name_ar)'); } catch (\Exception $e) {}

        // ═══════ TEMPLATE_VARIANTS ═══════
        if (Schema::hasColumn('template_variants', 'name_en')) {
            DB::statement('ALTER TABLE template_variants DROP COLUMN name_en');
        }

        // ═══════ COUPONS ═══════
        if (Schema::hasTable('coupons') && Schema::hasColumn('coupons', 'description_en')) {
            DB::statement('ALTER TABLE coupons DROP COLUMN description_en');
        }

        // ═══════ RESOURCES ═══════
        if (Schema::hasTable('resources') && Schema::hasColumn('resources', 'description_en')) {
            DB::statement('ALTER TABLE resources DROP COLUMN description_en');
        }
    }

    public function down(): void
    {
        // Intentionally empty — these are cleanup fixes
    }

    private function safeDropIndex(string $table, string $index): void
    {
        try {
            $result = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$index]);
            if (count($result) > 0) {
                DB::statement("DROP INDEX {$index} ON {$table}");
            }
        } catch (\Exception $e) {}
    }

    private function safeDropFK(string $table, string $fk): void
    {
        try {
            $result = DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = ?", [$table, $fk]);
            if (count($result) > 0) {
                DB::statement("ALTER TABLE {$table} DROP FOREIGN KEY {$fk}");
            }
        } catch (\Exception $e) {}
    }
};
