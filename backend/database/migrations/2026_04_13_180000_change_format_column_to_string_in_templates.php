<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Change format column from enum to string to support smart format detection.
 * Old values: digital, printable, both
 * New values: pdf, word, powerpoint, excel, archive, digital (auto-detected from file)
 */
return new class extends Migration
{
    public function up(): void
    {
        // MySQL does not allow direct enum→string change, so use raw SQL
        DB::statement("ALTER TABLE templates MODIFY COLUMN `format` VARCHAR(50) DEFAULT 'digital'");
    }

    public function down(): void
    {
        // Revert to enum — first normalize any new values back to 'digital'
        DB::statement("UPDATE templates SET `format` = 'digital' WHERE `format` NOT IN ('digital', 'printable', 'both')");
        DB::statement("ALTER TABLE templates MODIFY COLUMN `format` ENUM('digital', 'printable', 'both') DEFAULT 'digital'");
    }
};
