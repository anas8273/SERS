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
        Schema::create('user_template_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('template_id')->constrained('templates')->onDelete('cascade');
            $table->foreignId('variant_id')->constrained('template_variants')->onDelete('cascade');
            $table->string('title')->nullable(); // عنوان المستخدم للقالب (مثل: تقرير نشاط التسامح)
            $table->json('data'); // بيانات الحقول
            $table->enum('status', ['draft', 'completed'])->default('draft');
            $table->string('exported_file')->nullable(); // مسار الملف المصدر
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_template_data');
    }
};
