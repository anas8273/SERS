<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the system_settings table.
     *
     * Stores admin-configurable site settings as persistent key/value pairs.
     * This replaces the previous Cache-only storage which caused data loss after 24h.
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->string('key')->primary();         // e.g. 'site_name', 'maintenance_mode'
            $table->text('value')->nullable();         // JSON or plain string
            $table->timestamps();
        });

        // Seed default values so the admin page is never blank on first run
        DB::table('system_settings')->insert([
            ['key' => 'site_name',          'value' => 'SERS - منصة الموارد التعليمية', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'site_description',   'value' => 'منصة متكاملة للموارد التعليمية الرقمية', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'contact_email',      'value' => 'support@sers.sa', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'default_currency',   'value' => 'SAR', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'maintenance_mode',   'value' => '0', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'allow_registration', 'value' => '1', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
