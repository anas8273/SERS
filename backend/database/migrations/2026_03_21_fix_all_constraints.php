<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Comprehensive fix for all column constraints that may have failed
 * in previous migrations due to doctrine/dbal dependency.
 * Uses raw SQL to avoid requiring doctrine/dbal.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Skip on SQLite
        if (\DB::getDriverName() === 'sqlite') { return; }

        // ═══════════════════════════════════════
        // 1. Fix templates table
        // ═══════════════════════════════════════
        
        // Drop FK on category_id if it still exists
        $this->dropForeignKeyIfExists('templates', 'templates_category_id_foreign');
        
        // Drop indexes that might reference old columns
        $this->dropIndexIfExists('templates', 'templates_category_index');
        $this->dropIndexIfExists('templates', 'templates_category_active_index');
        $this->dropIndexIfExists('templates', 'templates_fulltext_name');
        
        // Make category_id nullable VARCHAR (was UUID NOT NULL)
        DB::statement('ALTER TABLE templates MODIFY category_id VARCHAR(255) NULL DEFAULT NULL');
        
        // Drop name_en and description_en if they still exist
        if (Schema::hasColumn('templates', 'name_en')) {
            DB::statement('ALTER TABLE templates DROP COLUMN name_en');
        }
        if (Schema::hasColumn('templates', 'description_en')) {
            DB::statement('ALTER TABLE templates DROP COLUMN description_en');
        }
        
        // Re-create indexes
        $this->createIndexIfNotExists('templates', 'templates_category_index', 'category_id');
        
        // Create fulltext on name_ar only
        try {
            DB::statement('ALTER TABLE templates ADD FULLTEXT INDEX templates_fulltext_name (name_ar)');
        } catch (\Exception $e) {
            // Index might already exist
        }
        
        // ═══════════════════════════════════════
        // 2. Fix categories table
        // ═══════════════════════════════════════
        
        // Drop FK on section_id if it exists
        $this->dropForeignKeyIfExists('categories', 'categories_section_id_foreign');
        
        // Drop fulltext that might reference name_en
        $this->dropIndexIfExists('categories', 'categories_fulltext_name');
        
        // Make section_id nullable
        DB::statement('ALTER TABLE categories MODIFY section_id CHAR(36) NULL DEFAULT NULL');
        
        // Drop name_en and description_en if they still exist
        if (Schema::hasColumn('categories', 'name_en')) {
            DB::statement('ALTER TABLE categories DROP COLUMN name_en');
        }
        if (Schema::hasColumn('categories', 'description_en')) {
            DB::statement('ALTER TABLE categories DROP COLUMN description_en');
        }
        
        // Re-create fulltext on name_ar only
        try {
            DB::statement('ALTER TABLE categories ADD FULLTEXT INDEX categories_fulltext_name (name_ar)');
        } catch (\Exception $e) {
            // Index might already exist
        }
        
        // ═══════════════════════════════════════
        // 3. Fix sections table
        // ═══════════════════════════════════════
        
        if (Schema::hasColumn('sections', 'name_en')) {
            DB::statement('ALTER TABLE sections DROP COLUMN name_en');
        }
        if (Schema::hasColumn('sections', 'description_en')) {
            DB::statement('ALTER TABLE sections DROP COLUMN description_en');
        }
        
        // ═══════════════════════════════════════
        // 4. Fix template_variants table
        // ═══════════════════════════════════════
        
        if (Schema::hasColumn('template_variants', 'name_en')) {
            DB::statement('ALTER TABLE template_variants DROP COLUMN name_en');
        }
        
        // ═══════════════════════════════════════
        // 5. Fix coupons table
        // ═══════════════════════════════════════
        
        if (Schema::hasTable('coupons') && Schema::hasColumn('coupons', 'description_en')) {
            DB::statement('ALTER TABLE coupons DROP COLUMN description_en');
        }
        
        // ═══════════════════════════════════════
        // 6. Fix resources table
        // ═══════════════════════════════════════
        
        if (Schema::hasTable('resources') && Schema::hasColumn('resources', 'description_en')) {
            DB::statement('ALTER TABLE resources DROP COLUMN description_en');
        }
    }

    public function down(): void
    {
        // No rollback — these are cleanup fixes
    }

    /**
     * Safely drop a foreign key if it exists.
     */
    private function dropForeignKeyIfExists(string $table, string $fkName): void
    {
        try {
            $fks = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = ? 
                AND CONSTRAINT_TYPE = 'FOREIGN KEY'
                AND CONSTRAINT_NAME = ?
            ", [$table, $fkName]);
            
            if (count($fks) > 0) {
                DB::statement("ALTER TABLE {$table} DROP FOREIGN KEY {$fkName}");
            }
        } catch (\Exception $e) {
            // Ignore
        }
    }

    /**
     * Safely drop an index if it exists.
     */
    private function dropIndexIfExists(string $table, string $indexName): void
    {
        try {
            $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            if (count($indexes) > 0) {
                DB::statement("DROP INDEX {$indexName} ON {$table}");
            }
        } catch (\Exception $e) {
            // Ignore
        }
    }

    /**
     * Safely create an index if it doesn't exist.
     */
    private function createIndexIfNotExists(string $table, string $indexName, string $column): void
    {
        try {
            $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            if (count($indexes) === 0) {
                DB::statement("CREATE INDEX {$indexName} ON {$table} ({$column})");
            }
        } catch (\Exception $e) {
            // Ignore
        }
    }
};
