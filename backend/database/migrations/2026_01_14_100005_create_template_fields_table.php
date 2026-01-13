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
            $table->foreignId('template_id')->constrained('templates')->onDelete('cascade');
            $table->string('name'); // اسم الحقل (للبرمجة)
            $table->string('label_ar'); // التسمية بالعربي
            $table->string('label_en'); // التسمية بالإنجليزي
            $table->enum('type', ['text', 'textarea', 'date', 'image', 'signature', 'qrcode', 'select'])->default('text');
            $table->json('options')->nullable(); // للحقول من نوع select
            $table->integer('position_x'); // موقع X على الخلفية
            $table->integer('position_y'); // موقع Y على الخلفية
            $table->integer('width'); // عرض الحقل
            $table->integer('height'); // ارتفاع الحقل
            $table->integer('font_size')->nullable();
            $table->string('font_family')->nullable();
            $table->string('color')->nullable();
            $table->string('text_align')->default('right'); // محاذاة النص
            $table->boolean('is_required')->default(false);
            $table->string('default_value')->nullable();
            $table->integer('order')->default(0);
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
