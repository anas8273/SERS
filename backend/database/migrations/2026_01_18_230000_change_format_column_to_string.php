<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Changes the format column from ENUM to STRING for flexibility.
     * Allows values like: pdf, doc, docx, pptx, xlsx, png, zip, image, etc.
     */
    public function up(): void
    {
        // MySQL requires dropping and recreating the column to change from ENUM to VARCHAR
        Schema::table('templates', function (Blueprint $table) {
            // First, add a temporary column
            $table->string('format_new', 50)->nullable()->after('format');
        });

        // Copy existing data with mapping
        DB::statement("UPDATE templates SET format_new = CASE 
            WHEN format = 'digital' THEN 'pdf'
            WHEN format = 'printable' THEN 'pdf'
            WHEN format = 'both' THEN 'pdf'
            ELSE 'pdf'
        END");

        Schema::table('templates', function (Blueprint $table) {
            // Drop the old ENUM column
            $table->dropColumn('format');
        });

        Schema::table('templates', function (Blueprint $table) {
            // Rename the new column to format
            $table->renameColumn('format_new', 'format');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            // Add back the ENUM column
            $table->string('format_temp', 50)->nullable()->after('type');
        });

        // Copy data back
        DB::statement("UPDATE templates SET format_temp = format");

        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn('format');
        });

        Schema::table('templates', function (Blueprint $table) {
            $table->enum('format', ['digital', 'printable', 'both'])->default('digital')->after('type');
        });

        // Restore data
        DB::statement("UPDATE templates SET format = CASE 
            WHEN format_temp IN ('pdf', 'doc', 'docx') THEN 'digital'
            WHEN format_temp IN ('image', 'png', 'jpg') THEN 'printable'
            ELSE 'digital'
        END");

        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn('format_temp');
        });
    }
};
