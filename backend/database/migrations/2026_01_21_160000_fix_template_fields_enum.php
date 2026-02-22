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
     * Fix template_fields type enum to include 'file' type
     */
    public function up(): void
    {
        // For MySQL, we need to alter the enum to add 'file' type
        if (config('database.default') === 'mysql') {
            DB::statement("ALTER TABLE template_fields MODIFY COLUMN type ENUM('text', 'textarea', 'date', 'image', 'signature', 'qrcode', 'barcode', 'select', 'checkbox', 'number', 'file') DEFAULT 'text' COMMENT 'Input field type'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (config('database.default') === 'mysql') {
            DB::statement("ALTER TABLE template_fields MODIFY COLUMN type ENUM('text', 'textarea', 'date', 'image', 'signature', 'qrcode', 'barcode', 'select', 'checkbox', 'number') DEFAULT 'text' COMMENT 'Input field type'");
        }
    }
};