<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop English name/description columns from all tables.
 * The system now uses Arabic only (name_ar / description_ar).
 */
return new class extends Migration
{
    public function up(): void
    {
        // Skip on SQLite
        if (\DB::getDriverName() === 'sqlite') { return; }

        // sections: drop name_en (keep description_en if it was already nullable)
        Schema::table('sections', function (Blueprint $table) {
            if (Schema::hasColumn('sections', 'name_en')) {
                $table->dropColumn('name_en');
            }
            if (Schema::hasColumn('sections', 'description_en')) {
                $table->dropColumn('description_en');
            }
        });

        // categories: drop name_en, description_en (also drop fulltext index first)
        Schema::table('categories', function (Blueprint $table) {
            // Must drop fulltext index that references name_en before dropping the column
            try {
                $table->dropIndex('categories_fulltext_name');
            } catch (\Exception $e) {
                // Index may not exist
            }

            if (Schema::hasColumn('categories', 'name_en')) {
                $table->dropColumn('name_en');
            }
            if (Schema::hasColumn('categories', 'description_en')) {
                $table->dropColumn('description_en');
            }
        });

        // templates: drop name_en, description_en
        Schema::table('templates', function (Blueprint $table) {
            if (Schema::hasColumn('templates', 'name_en')) {
                $table->dropColumn('name_en');
            }
            if (Schema::hasColumn('templates', 'description_en')) {
                $table->dropColumn('description_en');
            }
        });

        // template_variants: drop name_en
        Schema::table('template_variants', function (Blueprint $table) {
            if (Schema::hasColumn('template_variants', 'name_en')) {
                $table->dropColumn('name_en');
            }
        });

        // coupons: drop description_en
        if (Schema::hasTable('coupons')) {
            Schema::table('coupons', function (Blueprint $table) {
                if (Schema::hasColumn('coupons', 'description_en')) {
                    $table->dropColumn('description_en');
                }
            });
        }

        // resources: drop description_en
        if (Schema::hasTable('resources')) {
            Schema::table('resources', function (Blueprint $table) {
                if (Schema::hasColumn('resources', 'description_en')) {
                    $table->dropColumn('description_en');
                }
            });
        }
    }

    public function down(): void
    {
        // Re-add columns as nullable (they were removed intentionally)
        Schema::table('sections', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name_ar');
            $table->text('description_en')->nullable()->after('description_ar');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name_ar');
            $table->text('description_en')->nullable()->after('description_ar');
        });

        Schema::table('templates', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name_ar');
            $table->text('description_en')->nullable()->after('description_ar');
        });

        Schema::table('template_variants', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name_ar');
        });

        if (Schema::hasTable('coupons')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->text('description_en')->nullable();
            });
        }

        if (Schema::hasTable('resources')) {
            Schema::table('resources', function (Blueprint $table) {
                $table->text('description_en')->nullable();
            });
        }
    }
};
