<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('section_id')->nullable()->after('id')->constrained('sections')->onDelete('cascade');
            $table->string('name_en')->nullable()->after('name');
            $table->string('slug')->nullable()->after('name_en');
            $table->integer('order')->default(0)->after('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropColumn(['section_id', 'name_en', 'slug', 'order']);
        });
    }
};
