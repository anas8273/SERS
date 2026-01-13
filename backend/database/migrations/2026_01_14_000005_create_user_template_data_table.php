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
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->constrained('interactive_templates')->onDelete('cascade');
            $table->foreignId('variant_id')->nullable()->constrained('template_variants')->onDelete('set null');
            $table->string('instance_name');
            $table->json('field_values');
            $table->enum('status', ['draft', 'completed', 'exported'])->default('draft');
            $table->boolean('is_paid')->default(false);
            $table->string('exported_file_path', 500)->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'template_id']);
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
