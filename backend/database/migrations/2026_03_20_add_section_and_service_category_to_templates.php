<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            // Make category_id nullable (templates may use Firestore categories)
            // First drop foreign key, then change column, then re-add FK
        });

        // Drop FK constraint first (if exists)
        try {
            Schema::table('templates', function (Blueprint $table) {
                $table->dropForeign(['category_id']);
            });
        } catch (\Exception $e) {
            // FK may not exist
        }

        // category_id FK was already dropped by previous migration
        // (2026_03_20_200000_drop_category_fk_from_templates)
        // and changed to string for Firestore document IDs.
        // No need to re-add the FK constraint.

        // Add section_id column
        Schema::table('templates', function (Blueprint $table) {
            if (!Schema::hasColumn('templates', 'section_id')) {
                $table->uuid('section_id')->nullable()->after('category_id');
                $table->foreign('section_id')->references('id')->on('sections')->nullOnDelete();
            }
            if (!Schema::hasColumn('templates', 'service_category_id')) {
                $table->string('service_category_id')->nullable()->after('section_id');
                $table->index('service_category_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            if (Schema::hasColumn('templates', 'service_category_id')) {
                $table->dropIndex(['service_category_id']);
                $table->dropColumn('service_category_id');
            }
            if (Schema::hasColumn('templates', 'section_id')) {
                $table->dropForeign(['section_id']);
                $table->dropColumn('section_id');
            }
        });
    }
};
