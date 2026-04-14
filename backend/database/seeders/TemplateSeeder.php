<?php

namespace Database\Seeders;

use App\Models\Template;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Creates comprehensive sample templates for the education templates store.
     */
    public function run(): void
    {
        // Clear old templates
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Template::withTrashed()->forceDelete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        $this->command->info('🗑️ Cleared old templates.');

        $categories = Category::all();
        
        if ($categories->isEmpty()) {
            $this->command->warn('No categories found. Run SectionsAndCategoriesSeeder first.');
            return;
        }

        $catMap = $categories->keyBy('slug');

        $sampleTemplates = [
            // ===== ملفات الإنجاز =====
            [
                'name_ar' => 'ملف إنجاز المعلم الاحترافي',
                'description_ar' => 'ملف إنجاز شامل للمعلم يتضمن السيرة الذاتية، الرؤية والرسالة، شواهد الأداء، والإنتاج المعرفي. تصميم أنيق وجاهز للتعديل بصيغة PDF',
                'price' => 45.00,
                'format' => 'pdf',
                'is_featured' => true,
                'category_slug' => 'teacher-portfolio',
                'tags' => 'ملف,إنجاز,معلم,سيرة ذاتية,شواهد أداء',
                'sort_order' => 1,
            ],
            [
                'name_ar' => 'ملف إنجاز مدير المدرسة',
                'description_ar' => 'ملف إنجاز متكامل لمدير المدرسة يشمل خطة التطوير المدرسي، المبادرات، التقارير الإدارية، وتوثيق الإنجازات',
                'price' => 55.00,
                'format' => 'pdf',
                'is_featured' => true,
                'category_slug' => 'principal-portfolio',
                'tags' => 'ملف,إنجاز,مدير,مدرسة,تطوير',
                'sort_order' => 2,
            ],
            [
                'name_ar' => 'ملف إنجاز رياض الأطفال',
                'description_ar' => 'ملف إنجاز مصمم خصيصاً لمعلمات رياض الأطفال بألوان مبهجة وتصميم جذاب يشمل الأنشطة والفعاليات',
                'price' => 40.00,
                'format' => 'pdf',
                'is_featured' => false,
                'category_slug' => 'kindergarten-portfolio',
                'tags' => 'ملف,إنجاز,رياض أطفال,أنشطة,معلمة',
                'sort_order' => 3,
            ],
            [
                'name_ar' => 'ملف إنجاز وكيل المدرسة',
                'description_ar' => 'ملف إنجاز شامل لوكيل المدرسة يوثق الإنجازات الإدارية والأكاديمية، الخطط التطويرية، ونماذج المتابعة',
                'price' => 50.00,
                'format' => 'pdf',
                'is_featured' => false,
                'category_slug' => 'admin-portfolio',
                'tags' => 'ملف,إنجاز,وكيل,مدرسة,إداري',
                'sort_order' => 4,
            ],
            [
                'name_ar' => 'ملف إنجاز المساعد الإداري',
                'description_ar' => 'ملف إنجاز للمساعد الإداري يتضمن المهام الإدارية، السجلات، والإنجازات المهنية بتصميم رسمي',
                'price' => 35.00,
                'format' => 'pdf',
                'is_featured' => false,
                'category_slug' => 'admin-portfolio',
                'tags' => 'ملف,إنجاز,مساعد إداري,سجلات',
                'sort_order' => 5,
            ],

            // ===== شواهد الأداء الوظيفي =====
            [
                'name_ar' => 'سجل شواهد الأداء الوظيفي',
                'description_ar' => 'سجل شامل لتوثيق شواهد الأداء الوظيفي الـ 11 المعتمدة. يشمل جميع المعايير مع أمثلة توضيحية وروابط QR تفاعلية',
                'price' => 60.00,
                'format' => 'pdf',
                'is_featured' => true,
                'category_slug' => 'job-commitment',
                'tags' => 'شواهد,أداء وظيفي,معايير,تقييم',
                'sort_order' => 1,
            ],
            [
                'name_ar' => 'شواهد التطوير المهني المستمر',
                'description_ar' => 'ملف توثيق شواهد التطوير المهني يشمل الدورات التدريبية، الشهادات، المؤتمرات، وورش العمل',
                'price' => 30.00,
                'format' => 'pdf',
                'is_featured' => false,
                'category_slug' => 'professional-development',
                'tags' => 'تطوير مهني,دورات,شهادات,ورش عمل',
                'sort_order' => 2,
            ],

            // ===== التقارير =====
            [
                'name_ar' => 'نموذج التقرير الأسبوعي',
                'description_ar' => 'قالب تقرير أسبوعي منظم يشمل الإنجازات، الملاحظات، التوصيات، وخطة الأسبوع القادم. جاهز للتعبئة',
                'price' => 20.00,
                'format' => 'pdf',
                'is_featured' => true,
                'category_slug' => 'weekly-reports',
                'tags' => 'تقرير,أسبوعي,إنجازات,ملاحظات',
                'sort_order' => 1,
            ],
            [
                'name_ar' => 'تقرير الزيارة الصفية',
                'description_ar' => 'نموذج تقرير زيارة صفية شامل يتضمن الملاحظات والتوصيات ونقاط القوة ومجالات التحسين',
                'price' => 15.00,
                'format' => 'pdf',
                'is_featured' => false,
                'category_slug' => 'classroom-visits',
                'tags' => 'تقرير,زيارة صفية,ملاحظات,تقييم',
                'sort_order' => 2,
            ],

            // ===== الشهادات =====
            [
                'name_ar' => 'حزمة شهادات الشكر والتقدير (10 تصاميم)',
                'description_ar' => 'مجموعة من 10 تصاميم مختلفة لشهادات الشكر والتقدير. مناسبة للطلاب والمعلمين والموظفين بألوان وأنماط متنوعة',
                'price' => 25.00,
                'format' => 'pdf',
                'is_featured' => true,
                'category_slug' => 'appreciation',
                'tags' => 'شهادات,شكر,تقدير,تصميم',
                'sort_order' => 1,
            ],
            [
                'name_ar' => 'شهادات التفوق والتميز الذهبية',
                'description_ar' => 'شهادات تفوق بتصاميم ذهبية فاخرة مع حقول قابلة للتعديل لإضافة اسم الطالب والمادة والمعلم',
                'price' => 20.00,
                'format' => 'pdf',
                'is_featured' => false,
                'category_slug' => 'excellence',
                'tags' => 'شهادات,تفوق,تميز,ذهبي',
                'sort_order' => 2,
            ],

            // ===== الخطط =====
            [
                'name_ar' => 'الخطة العلاجية الشاملة',
                'description_ar' => 'خطة علاجية للطلاب ضعاف التحصيل تشمل التشخيص والأهداف والاستراتيجيات والمتابعة وتقييم التقدم',
                'price' => 30.00,
                'format' => 'pdf',
                'is_featured' => true,
                'category_slug' => 'remedial-plans',
                'tags' => 'خطة,علاجية,طلاب,تحصيل',
                'sort_order' => 1,
            ],
            [
                'name_ar' => 'الخطة الإثرائية للموهوبين',
                'description_ar' => 'خطة إثرائية مصممة للطلاب المتفوقين والموهوبين تشمل أنشطة إبداعية ومشاريع تعليمية متقدمة',
                'price' => 25.00,
                'format' => 'pdf',
                'is_featured' => false,
                'category_slug' => 'enrichment-plans',
                'tags' => 'خطة,إثرائية,موهوبين,متفوقين',
                'sort_order' => 2,
            ],

            // ===== السجلات =====
            [
                'name_ar' => 'سجل المتابعة اليومية للطلاب',
                'description_ar' => 'سجل متابعة يومي لرصد أداء الطلاب والملاحظات السلوكية والأكاديمية مع خانات منظمة للأسابيع',
                'price' => 35.00,
                'format' => 'pdf',
                'is_featured' => true,
                'category_slug' => 'daily-followup',
                'tags' => 'سجل,متابعة,يومي,طلاب,أداء',
                'sort_order' => 1,
            ],
            [
                'name_ar' => 'سجل الحضور والغياب',
                'description_ar' => 'سجل حضور وغياب منظم بحساب النسب والإحصائيات مع خانات واضحة للفصل الدراسي كامل',
                'price' => 30.00,
                'format' => 'pdf',
                'is_featured' => false,
                'category_slug' => 'attendance-record',
                'tags' => 'سجل,حضور,غياب,نسب',
                'sort_order' => 2,
            ],
            [
                'name_ar' => 'سجل الدرجات والتقويم المستمر',
                'description_ar' => 'سجل درجات شامل مع التقويم المستمر ونماذج رصد الأداء لجميع الفترات الدراسية',
                'price' => 35.00,
                'format' => 'pdf',
                'is_featured' => false,
                'category_slug' => 'grades-record',
                'tags' => 'سجل,درجات,تقويم,أداء',
                'sort_order' => 3,
            ],

            // ===== الجداول والتوزيعات =====
            [
                'name_ar' => 'جدول الحصص الأسبوعي الأنيق',
                'description_ar' => 'جدول حصص أسبوعي بتصميم عصري وأنيق قابل للتعديل مع إمكانية إضافة ملاحظات وواجبات',
                'price' => 10.00,
                'format' => 'pdf',
                'is_featured' => false,
                'category_slug' => 'class-schedule',
                'tags' => 'جدول,حصص,أسبوعي,تصميم',
                'sort_order' => 1,
            ],
            [
                'name_ar' => 'توزيع المنهج الدراسي على الأسابيع',
                'description_ar' => 'قالب توزيع المنهج الدراسي على أسابيع الفصل مع مراعاة الإجازات والاختبارات والمناسبات',
                'price' => 15.00,
                'format' => 'pdf',
                'is_featured' => false,
                'category_slug' => 'curriculum-distribution',
                'tags' => 'توزيع,منهج,أسابيع,فصل دراسي',
                'sort_order' => 2,
            ],

            // ===== مجاني =====
            [
                'name_ar' => 'نموذج التقييم الذاتي للمعلم',
                'description_ar' => 'نموذج مجاني للتقييم الذاتي يساعد المعلم على تقييم أدائه وتحديد نقاط القوة ومجالات التحسين',
                'price' => 0.00,
                'format' => 'pdf',
                'is_free' => true,
                'is_featured' => false,
                'category_slug' => 'professional-skills',
                'tags' => 'تقييم,ذاتي,معلم,مجاني',
                'sort_order' => 1,
            ],
            [
                'name_ar' => 'شهادة شكر وتقدير (مجانية)',
                'description_ar' => 'شهادة شكر مجانية بتصميم بسيط وأنيق. مناسبة للاستخدام السريع في المدارس والمؤسسات التعليمية',
                'price' => 0.00,
                'format' => 'pdf',
                'is_free' => true,
                'is_featured' => false,
                'category_slug' => 'appreciation',
                'tags' => 'شهادة,شكر,مجاني,تقدير',
                'sort_order' => 2,
            ],
            [
                'name_ar' => 'دليل إعداد ملف الإنجاز (مجاني)',
                'description_ar' => 'دليل شامل ومجاني يشرح كيفية إعداد ملف إنجاز احترافي خطوة بخطوة مع نماذج توضيحية',
                'price' => 0.00,
                'format' => 'pdf',
                'is_free' => true,
                'is_featured' => true,
                'category_slug' => 'teacher-portfolio',
                'tags' => 'دليل,ملف إنجاز,مجاني,شرح',
                'sort_order' => 10,
            ],
        ];

        foreach ($sampleTemplates as $templateData) {
            $catSlug = $templateData['category_slug'] ?? null;
            $tags = $templateData['tags'] ?? null;
            $sortOrder = $templateData['sort_order'] ?? 0;
            unset($templateData['category_slug'], $templateData['tags'], $templateData['sort_order']);

            $category = $catSlug && isset($catMap[$catSlug])
                ? $catMap[$catSlug]
                : $categories->random();

            $slug = Str::slug($templateData['name_ar'], '-');
            $counter = 1;
            while (Template::where('slug', $slug)->exists()) {
                $slug = Str::slug($templateData['name_ar'], '-') . '-' . $counter++;
            }

            Template::create([
                'category_id' => $category->id,
                'name_ar' => $templateData['name_ar'],

                'slug' => $slug,
                'description_ar' => $templateData['description_ar'],

                'price' => $templateData['price'],
                'type' => 'ready',
                'format' => $templateData['format'] ?? 'pdf',
                'is_free' => $templateData['is_free'] ?? ($templateData['price'] == 0),
                'is_active' => true,
                'is_featured' => $templateData['is_featured'] ?? false,
                'tags' => $tags,
                'sort_order' => $sortOrder,
                'thumbnail' => null,
            ]);
        }

        $this->command->info('✅ Created ' . count($sampleTemplates) . ' sample templates (all type=ready).');
    }
}
