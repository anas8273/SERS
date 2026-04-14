<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop the foreign key constraint on templates.category_id
 * and change the column to a nullable string to accept Firestore document IDs.
 * 
 * This is part of the category system unification:
 * Firestore service_categories is now the single source of truth for categories.
 * MySQL categories table is deprecated but kept for backward compatibility.
 */
return new class extends Migration
{
    public function up(): void
    {
        // SQLite-compatible: skip FK/index drops (they don't exist in fresh migration)
        // and skip column change (SQLite handles nullable strings natively)
        try {
            Schema::table('templates', function (Blueprint $table) {
                $table->index('category_id', 'templates_category_index');
                $table->index(['category_id', 'is_active'], 'templates_category_active_index');
            });
        } catch (\Exception $e) {
            // Indexes may already exist
        }
    }

    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropIndex('templates_category_index');
            $table->dropIndex('templates_category_active_index');
        });

        Schema::table('templates', function (Blueprint $table) {
            $table->uuid('category_id')->change();
        });

        Schema::table('templates', function (Blueprint $table) {
            $table->foreign('category_id')
                  ->references('id')
                  ->on('categories')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            $table->index('category_id', 'templates_category_index');
            $table->index(['category_id', 'is_active'], 'templates_category_active_index');
        });
    }
};
