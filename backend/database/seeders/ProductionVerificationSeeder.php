<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Template;
use App\Models\TemplateField;
use App\Models\User;
use App\Models\Category;
use App\Models\Section;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * SERS Production Verification Seeder
 * 
 * This seeder creates test data for verifying all 7 critical components:
 * 1. No-Code Schema Builder
 * 2. Smart Editor & AI
 * 3. Payment Wall
 * 4. PDF Engine
 * 5. Version History
 * 6. Result Analysis
 * 7. System Hygiene
 * 
 * Run with: php artisan db:seed --class=ProductionVerificationSeeder
 */
class ProductionVerificationSeeder extends Seeder
{
    public function run(): void
    {
        Log::info('🚀 Starting SERS Production Verification Seeder');

        // 1. Create or get test section first
        $section = Section::firstOrCreate(
            ['slug' => 'test-section'],
            [
                'name_ar' => 'قسم الاختبار',
                'name_en' => 'Test Section',
                'description_ar' => 'قسم للتحقق من جاهزية الإنتاج',
                'description_en' => 'Section for production verification',
                'icon' => '🧪',
                'is_active' => true,
                'sort_order' => 999,
            ]
        );
        Log::info("✅ Section created/found: {$section->id}");

        // 2. Create test category (with section_id)
        $category = Category::firstOrCreate(
            ['slug' => 'test-verification'],
            [
                'section_id' => $section->id,
                'name_ar' => 'اختبار التحقق',
                'name_en' => 'Verification Test',
                'description_ar' => 'تصنيف للتحقق من جاهزية الإنتاج',
                'description_en' => 'Category for production verification',
                'icon' => '🧪',
                'is_active' => true,
            ]
        );
        Log::info("✅ Category created: {$category->id}");

        // 2. Create test user (if not exists)
        $testUser = User::withTrashed()->where('email', 'test@sers.local')->first();
        if (!$testUser) {
            $testUser = User::create([
                'email' => 'test@sers.local',
                'name' => 'Test User',
                'password' => bcrypt('password123'),
                'role' => 'user',
                'is_active' => true,
            ]);
        } else {
            if ($testUser->trashed()) {
                $testUser->restore();
            }
            // Ensure properties are correct
            $testUser->update([
                'name' => 'Test User', 
                'role' => 'user',
                'is_active' => true,
            ]);
        }
        Log::info("✅ Test user created/found: {$testUser->id}");

        // 3. Create admin user (if not exists)
        $adminUser = User::withTrashed()->where('email', 'admin@sers.local')->first();
        if (!$adminUser) {
            $adminUser = User::create([
                'email' => 'admin@sers.local',
                'name' => 'Admin User',
                'password' => bcrypt('admin123'),
                'role' => 'admin',
                'is_active' => true,
            ]);
        } else {
            if ($adminUser->trashed()) {
                $adminUser->restore();
            }
            $adminUser->update([
                'name' => 'Admin User',
                'role' => 'admin',
                'is_active' => true,
            ]);
        }
        Log::info("✅ Admin user created/found: {$adminUser->id}");

        // 4. Create Test Template (PAID - for payment wall testing)
        $paidTemplate = Template::firstOrCreate(
            ['slug' => 'production-test-template'],
            [
                'name_ar' => 'قالب اختبار الإنتاج',
                'name_en' => 'Production Test Template',
                'description_ar' => 'قالب لاختبار جميع ميزات النظام',
                'description_en' => 'Template for testing all system features',
                'category_id' => $category->id,
                'type' => 'interactive',
                'price' => 99.00,
                'discount_price' => 79.00,
                'is_free' => false,
                'is_active' => true,
                'is_featured' => true,
                'downloads_count' => 0,
                'uses_count' => 0,
            ]
        );
        Log::info("✅ PAID Template created/found: {$paidTemplate->id}");

        // 5. Create FREE Template (for comparison)
        $freeTemplate = Template::firstOrCreate(
            ['slug' => 'free-test-template'],
            [
                'name_ar' => 'قالب مجاني للاختبار',
                'name_en' => 'Free Test Template',
                'description_ar' => 'قالب مجاني لاختبار الوصول',
                'description_en' => 'Free template for access testing',
                'category_id' => $category->id,
                'type' => 'interactive',
                'price' => 0,
                'is_free' => true,
                'is_active' => true,
            ]
        );
        Log::info("✅ FREE Template created/found: {$freeTemplate->id}");

        // 6. Create 3 required fields for Test Template
        $fields = [
            [
                'name' => 'student_name',
                'label_ar' => 'اسم الطالب',
                'label_en' => 'Student Name',
                'type' => 'text',
                'placeholder_ar' => 'أدخل اسم الطالب الكامل',
                'placeholder_en' => 'Enter student full name',
                'is_required' => true,
                'ai_fillable' => true,
                'ai_prompt_hint' => 'اقترح اسم طالب عربي مناسب',
                'sort_order' => 0,
            ],
            [
                'name' => 'grade',
                'label_ar' => 'الدرجة',
                'label_en' => 'Grade',
                'type' => 'number',
                'placeholder_ar' => 'أدخل الدرجة من 0 إلى 100',
                'placeholder_en' => 'Enter grade from 0 to 100',
                'is_required' => true,
                'ai_fillable' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'evidence_upload',
                'label_ar' => 'رفع الشاهد',
                'label_en' => 'Evidence Upload',
                'type' => 'image',
                'placeholder_ar' => 'ارفع صورة الشاهد',
                'placeholder_en' => 'Upload evidence image',
                'is_required' => false,
                'ai_fillable' => true,
                'ai_prompt_hint' => 'صف محتوى الصورة المرفقة',
                'sort_order' => 2,
            ],
        ];

        foreach ($fields as $fieldData) {
            $field = TemplateField::updateOrCreate(
                [
                    'template_id' => $paidTemplate->id,
                    'name' => $fieldData['name'],
                ],
                $fieldData
            );
            Log::info("✅ Field created/updated: {$field->name}");
        }

        // 7. Log summary
        Log::info('================================================');
        Log::info('🎉 SERS Production Verification Seeder Complete!');
        Log::info('================================================');
        Log::info("📋 Test Template ID (PAID): {$paidTemplate->id}");
        Log::info("📋 Free Template ID: {$freeTemplate->id}");
        Log::info("👤 Test User ID: {$testUser->id}");
        Log::info("👨‍💼 Admin User ID: {$adminUser->id}");
        Log::info('================================================');
        Log::info('');
        Log::info('🧪 NEXT STEPS FOR VERIFICATION:');
        Log::info('1. Run: php artisan test:payment-wall');
        Log::info('2. Run: php artisan test:pdf-generation');
        Log::info('3. Run: php artisan test:version-history');
        Log::info('4. Run: php artisan test:ai-engine');
        Log::info('================================================');

        // Output to console
        $this->command->info('================================================');
        $this->command->info('🎉 SERS Production Verification Seeder Complete!');
        $this->command->info('================================================');
        $this->command->info("📋 Test Template ID (PAID): {$paidTemplate->id}");
        $this->command->info("📋 Free Template ID: {$freeTemplate->id}");
        $this->command->info("👤 Test User Email: test@sers.local");
        $this->command->info("👨‍💼 Admin User Email: admin@sers.local");
        $this->command->info('================================================');
    }
}
