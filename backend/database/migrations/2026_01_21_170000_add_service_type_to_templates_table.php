<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add missing columns for interactive PDF automation
     */
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            // Add service_type column if it doesn't exist
            if (!Schema::hasColumn('templates', 'service_type')) {
                $table->string('service_type')->default('general')
                      ->comment('Service type for automation (education, healthcare, etc.)');
            }
            
            // Add file_path column if it doesn't exist
            if (!Schema::hasColumn('templates', 'file_path')) {
                $table->string('file_path')->nullable()
                      ->comment('Generated PDF file path');
            }
            
            // Add indexes for new columns
            $table->index('service_type', 'templates_service_type_index');
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropIndex('templates_service_type_index');
            $table->dropColumn(['service_type', 'file_path']);
        });
    }
};