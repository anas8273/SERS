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
        Schema::create('template_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('interactive_templates')->onDelete('cascade');
            $table->string('name', 100);
            $table->string('label_ar');
            $table->string('label_en');
            $table->enum('type', ['text', 'textarea', 'date', 'image', 'qrcode', 'signature'])->default('text');
            $table->text('default_value')->nullable();
            $table->text('placeholder_ar')->nullable();
            $table->text('placeholder_en')->nullable();
            $table->boolean('is_required')->default(false);
            $table->unsignedInteger('pos_x')->default(0);
            $table->unsignedInteger('pos_y')->default(0);
            $table->unsignedInteger('width')->default(200);
            $table->unsignedInteger('height')->default(30);
            $table->unsignedInteger('font_size')->default(14);
            $table->string('font_color', 20)->default('#000000');
            $table->string('font_family')->default('Cairo');
            $table->enum('text_align', ['left', 'center', 'right'])->default('center');
            $table->text('ai_prompt')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_fields');
    }
};
