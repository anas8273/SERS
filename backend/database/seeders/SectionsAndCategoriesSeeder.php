<?php

namespace Database\Seeders;

use App\Models\Section;
use App\Models\Category;
use Illuminate\Database\Seeder;

class SectionsAndCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // الأقسام الرئيسية (Main Sections)
        $sections = [
            ['name_ar' => 'ملفات الإنجاز', 'name_en' => 'Achievement Files', 'slug' => 'achievement-files', 'icon' => 'folder', 'sort_order' => 1, 'is_active' => true],
            ['name_ar' => 'شواهد الأداء الوظيفي', 'name_en' => 'Performance Evidence', 'slug' => 'performance-evidence', 'icon' => 'award', 'sort_order' => 2, 'is_active' => true],
            ['name_ar' => 'التقارير', 'name_en' => 'Reports', 'slug' => 'reports', 'icon' => 'file-text', 'sort_order' => 3, 'is_active' => true],
            ['name_ar' => 'الشهادات', 'name_en' => 'Certificates', 'slug' => 'certificates', 'icon' => 'medal', 'sort_order' => 4, 'is_active' => true],
            ['name_ar' => 'الخطط', 'name_en' => 'Plans', 'slug' => 'plans', 'icon' => 'clipboard', 'sort_order' => 5, 'is_active' => true],
            ['name_ar' => 'السجلات', 'name_en' => 'Records', 'slug' => 'records', 'icon' => 'book', 'sort_order' => 6, 'is_active' => true],
            ['name_ar' => 'العروض التقديمية', 'name_en' => 'Presentations', 'slug' => 'presentations', 'icon' => 'presentation', 'sort_order' => 7, 'is_active' => true],
            ['name_ar' => 'السيرة الذاتية', 'name_en' => 'CV', 'slug' => 'cv', 'icon' => 'user', 'sort_order' => 8, 'is_active' => true],
            ['name_ar' => 'البطاقات', 'name_en' => 'Cards', 'slug' => 'cards', 'icon' => 'credit-card', 'sort_order' => 9, 'is_active' => true],
            ['name_ar' => 'الإنفوجرافيك', 'name_en' => 'Infographics', 'slug' => 'infographics', 'icon' => 'image', 'sort_order' => 10, 'is_active' => true],
            ['name_ar' => 'الجداول', 'name_en' => 'Schedules', 'slug' => 'schedules', 'icon' => 'calendar', 'sort_order' => 11, 'is_active' => true],
            ['name_ar' => 'الاختبارات', 'name_en' => 'Tests', 'slug' => 'tests', 'icon' => 'check-square', 'sort_order' => 12, 'is_active' => true],
        ];

        foreach ($sections as $sectionData) {
            Section::updateOrCreate(
                ['slug' => $sectionData['slug']],
                $sectionData
            );
        }

        // الفئات الفرعية
        $categories = [
            // ملفات الإنجاز
            ['section_slug' => 'achievement-files', 'name_ar' => 'ملف إنجاز المستخدم', 'name_en' => 'User Achievement File', 'slug' => 'user-achievement', 'sort_order' => 1],
            ['section_slug' => 'achievement-files', 'name_ar' => 'ملف إنجاز مدير المدرسة', 'name_en' => 'Principal Achievement File', 'slug' => 'principal-achievement', 'sort_order' => 2],
            ['section_slug' => 'achievement-files', 'name_ar' => 'ملف إنجاز المساعد الإداري', 'name_en' => 'Admin Assistant Achievement', 'slug' => 'admin-achievement', 'sort_order' => 3],
            ['section_slug' => 'achievement-files', 'name_ar' => 'ملف إنجاز رياض الأطفال', 'name_en' => 'Kindergarten Achievement', 'slug' => 'kindergarten-achievement', 'sort_order' => 4],

            // شواهد الأداء الوظيفي
            ['section_slug' => 'performance-evidence', 'name_ar' => 'شواهد الالتزام الوظيفي', 'name_en' => 'Job Commitment Evidence', 'slug' => 'job-commitment', 'sort_order' => 1],
            ['section_slug' => 'performance-evidence', 'name_ar' => 'شواهد المهارات المهنية', 'name_en' => 'Professional Skills Evidence', 'slug' => 'professional-skills', 'sort_order' => 2],
            ['section_slug' => 'performance-evidence', 'name_ar' => 'شواهد التطوير المهني', 'name_en' => 'Professional Development Evidence', 'slug' => 'professional-development', 'sort_order' => 3],

            // التقارير
            ['section_slug' => 'reports', 'name_ar' => 'تقارير البرامج', 'name_en' => 'Program Reports', 'slug' => 'program-reports', 'sort_order' => 1],
            ['section_slug' => 'reports', 'name_ar' => 'تقارير الأنشطة', 'name_en' => 'Activity Reports', 'slug' => 'activity-reports', 'sort_order' => 2],
            ['section_slug' => 'reports', 'name_ar' => 'تقارير المبادرات', 'name_en' => 'Initiative Reports', 'slug' => 'initiative-reports', 'sort_order' => 3],
            ['section_slug' => 'reports', 'name_ar' => 'تقارير الزيارات الصفية', 'name_en' => 'Classroom Visit Reports', 'slug' => 'classroom-visits', 'sort_order' => 4],
            ['section_slug' => 'reports', 'name_ar' => 'تقارير التوظيف التقني', 'name_en' => 'Tech Integration Reports', 'slug' => 'tech-integration', 'sort_order' => 5],

            // الشهادات
            ['section_slug' => 'certificates', 'name_ar' => 'شهادات شكر وتقدير', 'name_en' => 'Appreciation Certificates', 'slug' => 'appreciation', 'sort_order' => 1],
            ['section_slug' => 'certificates', 'name_ar' => 'شهادات حضور', 'name_en' => 'Attendance Certificates', 'slug' => 'attendance', 'sort_order' => 2],
            ['section_slug' => 'certificates', 'name_ar' => 'شهادات تفوق', 'name_en' => 'Excellence Certificates', 'slug' => 'excellence', 'sort_order' => 3],

            // الخطط
            ['section_slug' => 'plans', 'name_ar' => 'خطط علاجية', 'name_en' => 'Remedial Plans', 'slug' => 'remedial-plans', 'sort_order' => 1],
            ['section_slug' => 'plans', 'name_ar' => 'خطط إثرائية', 'name_en' => 'Enrichment Plans', 'slug' => 'enrichment-plans', 'sort_order' => 2],
            ['section_slug' => 'plans', 'name_ar' => 'خطط تحسين', 'name_en' => 'Improvement Plans', 'slug' => 'improvement-plans', 'sort_order' => 3],

            // السجلات
            ['section_slug' => 'records', 'name_ar' => 'سجل الحضور والغياب', 'name_en' => 'Attendance Record', 'slug' => 'attendance-record', 'sort_order' => 1],
            ['section_slug' => 'records', 'name_ar' => 'سجل المتابعة', 'name_en' => 'Follow-up Record', 'slug' => 'follow-up-record', 'sort_order' => 2],
            ['section_slug' => 'records', 'name_ar' => 'سجل الدرجات', 'name_en' => 'Grades Record', 'slug' => 'grades-record', 'sort_order' => 3],

            // العروض التقديمية
            ['section_slug' => 'presentations', 'name_ar' => 'عروض تعليمية', 'name_en' => 'Educational Presentations', 'slug' => 'educational-presentations', 'sort_order' => 1],
            ['section_slug' => 'presentations', 'name_ar' => 'عروض إدارية', 'name_en' => 'Administrative Presentations', 'slug' => 'admin-presentations', 'sort_order' => 2],

            // السيرة الذاتية
            ['section_slug' => 'cv', 'name_ar' => 'سيرة ذاتية للمستخدم', 'name_en' => 'User CV', 'slug' => 'user-cv', 'sort_order' => 1],
            ['section_slug' => 'cv', 'name_ar' => 'سيرة ذاتية للإداري', 'name_en' => 'Admin CV', 'slug' => 'admin-cv', 'sort_order' => 2],

            // البطاقات
            ['section_slug' => 'cards', 'name_ar' => 'بطاقات تعريفية', 'name_en' => 'ID Cards', 'slug' => 'id-cards', 'sort_order' => 1],
            ['section_slug' => 'cards', 'name_ar' => 'بطاقات دعوة', 'name_en' => 'Invitation Cards', 'slug' => 'invitation-cards', 'sort_order' => 2],

            // الإنفوجرافيك
            ['section_slug' => 'infographics', 'name_ar' => 'إنفوجرافيك تعليمي', 'name_en' => 'Educational Infographics', 'slug' => 'educational-infographics', 'sort_order' => 1],
            ['section_slug' => 'infographics', 'name_ar' => 'إنفوجرافيك إحصائي', 'name_en' => 'Statistical Infographics', 'slug' => 'statistical-infographics', 'sort_order' => 2],

            // الجداول
            ['section_slug' => 'schedules', 'name_ar' => 'جدول الحصص', 'name_en' => 'Class Schedule', 'slug' => 'class-schedule', 'sort_order' => 1],
            ['section_slug' => 'schedules', 'name_ar' => 'جدول الاختبارات', 'name_en' => 'Test Schedule', 'slug' => 'test-schedule', 'sort_order' => 2],
            ['section_slug' => 'schedules', 'name_ar' => 'توزيع المنهج', 'name_en' => 'Curriculum Distribution', 'slug' => 'curriculum-distribution', 'sort_order' => 3],

            // الاختبارات
            ['section_slug' => 'tests', 'name_ar' => 'اختبارات قصيرة', 'name_en' => 'Quizzes', 'slug' => 'quizzes', 'sort_order' => 1],
            ['section_slug' => 'tests', 'name_ar' => 'اختبارات شاملة', 'name_en' => 'Comprehensive Tests', 'slug' => 'comprehensive-tests', 'sort_order' => 2],
        ];

        foreach ($categories as $categoryData) {
            $section = Section::where('slug', $categoryData['section_slug'])->first();
            if ($section) {
                Category::updateOrCreate(
                    ['slug' => $categoryData['slug']],
                    [
                        'section_id' => $section->id,
                        'name_ar' => $categoryData['name_ar'],
                        'name_en' => $categoryData['name_en'],
                        'slug' => $categoryData['slug'],
                        'sort_order' => $categoryData['sort_order'],
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
