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
        Schema::create('template_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('interactive_templates')->onDelete('cascade');
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('background_image_path', 500);
            $table->string('thumbnail_path', 500)->nullable();
            $table->unsignedInteger('width')->default(800);
            $table->unsignedInteger('height')->default(1131);
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_variants');
    }
};
