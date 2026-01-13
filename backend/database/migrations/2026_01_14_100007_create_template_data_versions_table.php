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
            $table->json('data');
            $table->string('note')->nullable(); // ملاحظة عن التغيير
            $table->timestamp('created_at')->useCurrent();
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
