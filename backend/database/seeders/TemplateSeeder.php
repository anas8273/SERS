<?php

namespace Database\Seeders;

use App\Models\Template;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Creates sample templates linked to existing categories.
     * Uses MySQL only - Firestore sync will be implemented later.
     */
    public function run(): void
    {
        // Get existing categories
        $categories = Category::all();
        
        if ($categories->isEmpty()) {
            $this->command->warn('No categories found. Run SectionsAndCategoriesSeeder first.');
            return;
        }

        $sampleTemplates = [
            [
                'name_ar' => 'سجل متابعة الطلاب الشامل',
                'name_en' => 'Comprehensive Student Progress Report',
                'description_ar' => 'سجل متكامل لمتابعة أداء الطلاب يتضمن الدرجات والملاحظات والتقييمات الدورية',
                'description_en' => 'Complete tracking record for student performance including grades, notes, and periodic assessments',
                'price' => 25.00,
                'type' => 'ready',
                'format' => 'pdf',
                'is_featured' => true,
            ],
            [
                'name_ar' => 'قالب التقرير الأسبوعي',
                'name_en' => 'Weekly Report Template',
                'description_ar' => 'قالب جاهز لإعداد التقارير الأسبوعية بتصميم احترافي',
                'description_en' => 'Ready template for preparing weekly reports with professional design',
                'price' => 15.00,
                'type' => 'ready',
                'format' => 'doc',
                'is_featured' => false,
            ],
            [
                'name_ar' => 'سجل الحضور التفاعلي',
                'name_en' => 'Interactive Attendance Record',
                'description_ar' => 'سجل تفاعلي لتسجيل حضور الطلاب مع إمكانية التعديل والطباعة',
                'description_en' => 'Interactive record for logging student attendance with editing and printing options',
                'price' => 35.00,
                'type' => 'interactive',
                'format' => 'pdf',
                'is_featured' => true,
            ],
            [
                'name_ar' => 'نموذج التقييم الذاتي',
                'name_en' => 'Self Assessment Form',
                'description_ar' => 'نموذج تفاعلي للتقييم الذاتي للمعلمين والطلاب',
                'description_en' => 'Interactive self-assessment form for users and students',
                'price' => 0.00,
                'type' => 'interactive',
                'format' => 'pdf',
                'is_free' => true,
                'is_featured' => false,
            ],
            [
                'name_ar' => 'جدول الحصص الأسبوعي',
                'name_en' => 'Weekly Schedule Template',
                'description_ar' => 'قالب جاهز لجدول الحصص الأسبوعي قابل للتخصيص',
                'description_en' => 'Ready weekly schedule template with customization options',
                'price' => 10.00,
                'type' => 'ready',
                'format' => 'pdf',
                'is_featured' => true,
            ],
            [
                'name_ar' => 'شهادات التقدير المتنوعة',
                'name_en' => 'Various Appreciation Certificates',
                'description_ar' => 'مجموعة من شهادات التقدير بتصاميم متنوعة وجذابة',
                'description_en' => 'Collection of appreciation certificates with various attractive designs',
                'price' => 20.00,
                'type' => 'ready',
                'format' => 'pdf',
                'is_featured' => false,
            ],
        ];

        foreach ($sampleTemplates as $index => $templateData) {
            // Get a category (cycle through available categories)
            $category = $categories[$index % $categories->count()];
            
            // Generate unique slug
            $slug = Str::slug($templateData['name_ar'], '-');
            $counter = 1;
            while (Template::where('slug', $slug)->exists()) {
                $slug = Str::slug($templateData['name_ar'], '-') . '-' . $counter++;
            }

            Template::create([
                'category_id' => $category->id,
                'name_ar' => $templateData['name_ar'],
                'name_en' => $templateData['name_en'],
                'slug' => $slug,
                'description_ar' => $templateData['description_ar'],
                'description_en' => $templateData['description_en'],
                'price' => $templateData['price'],
                'type' => $templateData['type'],
                'format' => $templateData['format'],
                'is_free' => $templateData['is_free'] ?? ($templateData['price'] == 0),
                'is_active' => true,
                'is_featured' => $templateData['is_featured'] ?? false,
                'thumbnail' => null, // Placeholder - actual images can be added later
            ]);
        }

        $this->command->info('Created ' . count($sampleTemplates) . ' sample templates.');
    }
}
