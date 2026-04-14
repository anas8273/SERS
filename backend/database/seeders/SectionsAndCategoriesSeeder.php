<?php

namespace Database\Seeders;

use App\Models\Section;
use App\Models\Category;
use Illuminate\Database\Seeder;

class SectionsAndCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * الفئات (Categories) = تصنيف حسب الوظيفة (7 فئات مستقلة)
     * الأقسام (Sections) = أنواع المحتوى (ملفات إنجاز، شواهد أداء، إلخ)
     * 
     * عند الضغط على فئة → تظهر الأقسام والقوالب المتعلقة بها
     */
    public function run(): void
    {
        // ═══════════════════════════════════════
        //  الفئات (Categories) — تصنيف حسب الوظيفة
        // ═══════════════════════════════════════
        $categories = [
            ['name_ar' => 'الإدارة المدرسية', 'slug' => 'school-administration', 'icon' => '🏢', 'sort_order' => 1, 'is_active' => true],
            ['name_ar' => 'التربية الخاصة', 'slug' => 'special-education', 'icon' => '♿', 'sort_order' => 2, 'is_active' => true],
            ['name_ar' => 'التوجيه والإرشاد', 'slug' => 'guidance-counseling', 'icon' => '❤️', 'sort_order' => 3, 'is_active' => true],
            ['name_ar' => 'المعلمين والمعلمات', 'slug' => 'teachers', 'icon' => '🎓', 'sort_order' => 4, 'is_active' => true],
            ['name_ar' => 'النشاط الطلابي', 'slug' => 'student-activities', 'icon' => '🏆', 'sort_order' => 5, 'is_active' => true],
            ['name_ar' => 'رياض الأطفال', 'slug' => 'kindergarten', 'icon' => '👶', 'sort_order' => 6, 'is_active' => true],
            ['name_ar' => 'عام', 'slug' => 'general', 'icon' => '📁', 'sort_order' => 7, 'is_active' => true],
        ];

        // حذف الفئات القديمة التي ليست ضمن الفئات الجديدة
        $newCategorySlugs = array_column($categories, 'slug');
        Category::whereNotIn('slug', $newCategorySlugs)->delete();

        foreach ($categories as $catData) {
            Category::updateOrCreate(
                ['slug' => $catData['slug']],
                $catData // section_id not required for standalone categories
            );
        }

        $this->command->info("✅ Created/Updated " . count($categories) . " categories (job-role based).");

        // ═══════════════════════════════════════
        //  الأقسام (Sections) — أنواع المحتوى
        // ═══════════════════════════════════════
        $sections = [
            ['name_ar' => 'ملفات الإنجاز', 'slug' => 'achievement-files', 'icon' => '📁', 'sort_order' => 1, 'is_active' => true],
            ['name_ar' => 'شواهد الأداء الوظيفي', 'slug' => 'performance-evidence', 'icon' => '🏆', 'sort_order' => 2, 'is_active' => true],
            ['name_ar' => 'السجلات المدرسية', 'slug' => 'school-records', 'icon' => '📋', 'sort_order' => 3, 'is_active' => true],
            ['name_ar' => 'الاختبارات', 'slug' => 'tests', 'icon' => '✅', 'sort_order' => 4, 'is_active' => true],
            ['name_ar' => 'التقارير', 'slug' => 'reports', 'icon' => '📊', 'sort_order' => 5, 'is_active' => true],
            ['name_ar' => 'المبادرات', 'slug' => 'initiatives', 'icon' => '💡', 'sort_order' => 6, 'is_active' => true],
            ['name_ar' => 'الشهادات', 'slug' => 'certificates', 'icon' => '🎖️', 'sort_order' => 7, 'is_active' => true],
            ['name_ar' => 'ورش العمل والبرامج التدريبية', 'slug' => 'workshops-training', 'icon' => '👥', 'sort_order' => 8, 'is_active' => true],
            ['name_ar' => 'الدروس التطبيقية', 'slug' => 'applied-lessons', 'icon' => '🎬', 'sort_order' => 9, 'is_active' => true],
            ['name_ar' => 'الإنتاج المعرفي', 'slug' => 'knowledge-production', 'icon' => '🧠', 'sort_order' => 10, 'is_active' => true],
            ['name_ar' => 'الخطط العلاجية والإثرائية', 'slug' => 'remedial-enrichment', 'icon' => '📈', 'sort_order' => 11, 'is_active' => true],
            ['name_ar' => 'الخطط', 'slug' => 'plans', 'icon' => '📅', 'sort_order' => 12, 'is_active' => true],
            ['name_ar' => 'الفاقد التعليمي', 'slug' => 'learning-loss', 'icon' => '⚠️', 'sort_order' => 13, 'is_active' => true],
        ];

        // حذف الأقسام القديمة غير الموجودة في القائمة الجديدة
        $newSectionSlugs = array_column($sections, 'slug');
        Section::whereNotIn('slug', $newSectionSlugs)->delete();

        foreach ($sections as $sectionData) {
            Section::updateOrCreate(
                ['slug' => $sectionData['slug']],
                $sectionData
            );
        }

        $this->command->info("✅ Created/Updated " . count($sections) . " sections (content types).");
        $this->command->info("📋 Architecture: Category (job-role) → Section (content-type) → Templates");
    }
}
