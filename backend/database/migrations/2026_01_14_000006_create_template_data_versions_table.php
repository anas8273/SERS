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
        Schema::create('template_data_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_template_data_id')->constrained('user_template_data')->onDelete('cascade');
            $table->unsignedInteger('version_number');
            $table->json('field_values');
            $table->string('change_summary')->nullable();
            $table->timestamps();
            
            $table->index(['user_template_data_id', 'version_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_data_versions');
    }
};
