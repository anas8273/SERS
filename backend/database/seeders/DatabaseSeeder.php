<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * DatabaseSeeder
 * 
 * Seeds the database with rich data for development and testing.
 * Creates admin user, regular users, categories, 10+ products, coupons, reviews, and wishlists.
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ===========================================================================
        // USERS
        // ===========================================================================

        // Admin User
        $admin = User::create([
            'name' => 'مدير النظام',
            'email' => 'admin@sers.com',
            'password' => Hash::make('password'),
            'phone' => '+966500000001',
            'role' => 'admin',
            'is_active' => true,
            'wallet_balance' => 0,
            'email_verified_at' => now(),
        ]);

        $this->command->info('✅ Admin user created: admin@sers.com / password');

        // Regular Users
        $user1 = User::create([
            'name' => 'سارة أحمد',
            'email' => 'user@sers.com',
            'password' => Hash::make('password'),
            'phone' => '+966500000002',
            'role' => 'user',
            'is_active' => true,
            'wallet_balance' => 100.00,
            'email_verified_at' => now(),
        ]);

        $user2 = User::create([
            'name' => 'محمد علي',
            'email' => 'teacher@sers.com',
            'password' => Hash::make('password'),
            'phone' => '+966500000003',
            'role' => 'user',
            'is_active' => true,
            'wallet_balance' => 50.00,
            'email_verified_at' => now(),
        ]);

        $user3 = User::create([
            'name' => 'نورة سعيد',
            'email' => 'noura@sers.com',
            'password' => Hash::make('password'),
            'phone' => '+966500000004',
            'role' => 'user',
            'is_active' => true,
            'wallet_balance' => 75.00,
            'email_verified_at' => now(),
        ]);

        $this->command->info('✅ 3 Regular users created');

        // ===========================================================================
        // CATEGORIES (6 Categories)
        // ===========================================================================

        $kindergarten = Category::create([
            'name_ar' => 'رياض الأطفال',
            'name_en' => 'Kindergarten',
            'slug' => 'kindergarten',
            'description_ar' => 'قوالب تعليمية مخصصة لمرحلة رياض الأطفال',
            'description_en' => 'Educational templates designed for kindergarten stage',
            'icon' => 'baby',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $primary = Category::create([
            'name_ar' => 'المرحلة الابتدائية',
            'name_en' => 'Primary',
            'slug' => 'primary',
            'description_ar' => 'قوالب تعليمية مخصصة للمرحلة الابتدائية',
            'description_en' => 'Educational templates designed for primary school',
            'icon' => 'book-open',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $intermediate = Category::create([
            'name_ar' => 'المرحلة المتوسطة',
            'name_en' => 'Intermediate',
            'slug' => 'intermediate',
            'description_ar' => 'قوالب تعليمية مخصصة للمرحلة المتوسطة',
            'description_en' => 'Educational templates designed for intermediate school',
            'icon' => 'graduation-cap',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        $secondary = Category::create([
            'name_ar' => 'المرحلة الثانوية',
            'name_en' => 'Secondary',
            'slug' => 'secondary',
            'description_ar' => 'قوالب تعليمية مخصصة للمرحلة الثانوية',
            'description_en' => 'Educational templates designed for secondary school',
            'icon' => 'school',
            'sort_order' => 4,
            'is_active' => true,
        ]);

        $specialEd = Category::create([
            'name_ar' => 'التعليم الخاص',
            'name_en' => 'Special Education',
            'slug' => 'special-education',
            'description_ar' => 'قوالب مخصصة لذوي الاحتياجات الخاصة',
            'description_en' => 'Templates designed for special needs education',
            'icon' => 'heart',
            'sort_order' => 5,
            'is_active' => true,
        ]);

        $activities = Category::create([
            'name_ar' => 'الأنشطة والفعاليات',
            'name_en' => 'Activities',
            'slug' => 'activities',
            'description_ar' => 'سجلات الأنشطة والفعاليات المدرسية',
            'description_en' => 'Activity and event records',
            'icon' => 'calendar',
            'sort_order' => 6,
            'is_active' => true,
        ]);

        $this->command->info('✅ 6 Categories created');

        // ===========================================================================
        // PRODUCTS (12 Products)
        // ===========================================================================

        $products = [];

        // Product 1 - Interactive
        $products[] = Product::create([
            'name_ar' => 'سجل الملاحظات الذكي',
            'name_en' => 'Smart Notes Record',
            'slug' => 'smart-notes-record',
            'description_ar' => 'سجل تفاعلي ذكي لتتبع ملاحظات الطلاب مع دعم الذكاء الاصطناعي للاقتراحات التلقائية. يساعدك في كتابة ملاحظات احترافية في ثوانٍ.',
            'description_en' => 'Smart interactive record for tracking student notes with AI support for automatic suggestions.',
            'price' => 49.99,
            'discount_price' => 39.99,
            'type' => 'interactive',
            'category_id' => $kindergarten->id,
            'thumbnail_url' => null,
            'template_structure' => [
                'fields' => [
                    ['name' => 'student_name', 'type' => 'text', 'label_ar' => 'اسم الطالب', 'label_en' => 'Student Name'],
                    ['name' => 'observation', 'type' => 'textarea', 'label_ar' => 'الملاحظة', 'label_en' => 'Observation'],
                    ['name' => 'date', 'type' => 'date', 'label_ar' => 'التاريخ', 'label_en' => 'Date'],
                    ['name' => 'rating', 'type' => 'select', 'label_ar' => 'التقييم', 'label_en' => 'Rating', 'options' => ['ممتاز', 'جيد جداً', 'جيد', 'مقبول']],
                ],
                'ai_enabled_fields' => ['observation'],
            ],
            'educational_stage' => 'kindergarten',
            'subject' => 'general',
            'tags' => ['ملاحظات', 'تقييم', 'رياض أطفال', 'ذكاء اصطناعي'],
            'is_featured' => true,
            'is_active' => true,
            'downloads_count' => 156,
        ]);

        // Product 2 - Downloadable
        $products[] = Product::create([
            'name_ar' => 'نموذج تقييم الطالب',
            'name_en' => 'Student Evaluation Template',
            'slug' => 'student-evaluation-template',
            'description_ar' => 'نموذج PDF قابل للتحميل لتقييم أداء الطلاب في المرحلة الابتدائية. يشمل جميع المعايير المطلوبة.',
            'description_en' => 'Downloadable PDF template for evaluating student performance in primary school.',
            'price' => 19.99,
            'discount_price' => null,
            'type' => 'downloadable',
            'category_id' => $primary->id,
            'thumbnail_url' => null,
            'file_path' => null,
            'file_name' => 'student-evaluation-template.pdf',
            'educational_stage' => 'primary',
            'subject' => 'general',
            'tags' => ['تقييم', 'ابتدائي', 'PDF'],
            'is_featured' => true,
            'is_active' => true,
            'downloads_count' => 89,
        ]);

        // Product 3 - Interactive
        $products[] = Product::create([
            'name_ar' => 'سجل الحضور والغياب',
            'name_en' => 'Attendance Record',
            'slug' => 'attendance-record',
            'description_ar' => 'سجل تفاعلي شامل لتتبع حضور وغياب الطلاب يومياً مع تقارير تلقائية وإحصائيات.',
            'description_en' => 'Comprehensive interactive record for tracking daily student attendance with automatic reports.',
            'price' => 34.99,
            'discount_price' => 29.99,
            'type' => 'interactive',
            'category_id' => $primary->id,
            'thumbnail_url' => null,
            'template_structure' => [
                'fields' => [
                    ['name' => 'student_name', 'type' => 'text', 'label_ar' => 'اسم الطالب', 'label_en' => 'Student Name'],
                    ['name' => 'status', 'type' => 'select', 'label_ar' => 'الحالة', 'label_en' => 'Status', 'options' => ['حاضر', 'غائب', 'متأخر', 'مستأذن']],
                    ['name' => 'date', 'type' => 'date', 'label_ar' => 'التاريخ', 'label_en' => 'Date'],
                    ['name' => 'notes', 'type' => 'textarea', 'label_ar' => 'ملاحظات', 'label_en' => 'Notes'],
                ],
            ],
            'educational_stage' => 'primary',
            'subject' => 'general',
            'tags' => ['حضور', 'غياب', 'تتبع'],
            'is_featured' => true,
            'is_active' => true,
            'downloads_count' => 234,
        ]);

        // Product 4 - Downloadable
        $products[] = Product::create([
            'name_ar' => 'خطة درس تفصيلية',
            'name_en' => 'Detailed Lesson Plan',
            'slug' => 'detailed-lesson-plan',
            'description_ar' => 'قالب Word لإعداد خطط الدروس التفصيلية يشمل الأهداف والأنشطة والتقييم.',
            'description_en' => 'Word template for preparing detailed lesson plans including objectives, activities, and assessment.',
            'price' => 24.99,
            'discount_price' => 19.99,
            'type' => 'downloadable',
            'category_id' => $intermediate->id,
            'thumbnail_url' => null,
            'file_path' => null,
            'file_name' => 'lesson-plan-template.docx',
            'educational_stage' => 'intermediate',
            'subject' => 'general',
            'tags' => ['خطة درس', 'تحضير', 'Word'],
            'is_featured' => false,
            'is_active' => true,
            'downloads_count' => 178,
        ]);

        // Product 5 - Interactive
        $products[] = Product::create([
            'name_ar' => 'سجل المتابعة السلوكية',
            'name_en' => 'Behavioral Tracking Record',
            'slug' => 'behavioral-tracking',
            'description_ar' => 'سجل تفاعلي لمتابعة سلوك الطلاب وتسجيل الملاحظات السلوكية مع توصيات تحسين.',
            'description_en' => 'Interactive record for tracking student behavior and logging observations with improvement recommendations.',
            'price' => 44.99,
            'discount_price' => null,
            'type' => 'interactive',
            'category_id' => $kindergarten->id,
            'thumbnail_url' => null,
            'template_structure' => [
                'fields' => [
                    ['name' => 'student_name', 'type' => 'text', 'label_ar' => 'اسم الطالب', 'label_en' => 'Student Name'],
                    ['name' => 'behavior_type', 'type' => 'select', 'label_ar' => 'نوع السلوك', 'label_en' => 'Behavior Type', 'options' => ['إيجابي', 'سلبي', 'يحتاج متابعة']],
                    ['name' => 'description', 'type' => 'textarea', 'label_ar' => 'الوصف', 'label_en' => 'Description'],
                    ['name' => 'action_taken', 'type' => 'textarea', 'label_ar' => 'الإجراء المتخذ', 'label_en' => 'Action Taken'],
                ],
                'ai_enabled_fields' => ['action_taken'],
            ],
            'educational_stage' => 'kindergarten',
            'subject' => 'general',
            'tags' => ['سلوك', 'متابعة', 'ملاحظات'],
            'is_featured' => true,
            'is_active' => true,
            'downloads_count' => 112,
        ]);

        // Product 6 - Downloadable
        $products[] = Product::create([
            'name_ar' => 'شهادات تقدير مميزة',
            'name_en' => 'Appreciation Certificates',
            'slug' => 'appreciation-certificates',
            'description_ar' => 'مجموعة من 15 تصميم لشهادات التقدير قابلة للتعديل بصيغة PDF.',
            'description_en' => 'Collection of 15 editable appreciation certificate designs in PDF format.',
            'price' => 14.99,
            'discount_price' => 9.99,
            'type' => 'downloadable',
            'category_id' => $activities->id,
            'thumbnail_url' => null,
            'file_path' => null,
            'file_name' => 'certificates-pack.zip',
            'educational_stage' => 'all',
            'subject' => 'general',
            'tags' => ['شهادات', 'تقدير', 'تصاميم'],
            'is_featured' => false,
            'is_active' => true,
            'downloads_count' => 345,
        ]);

        // Product 7 - Interactive
        $products[] = Product::create([
            'name_ar' => 'سجل التقييم المستمر',
            'name_en' => 'Continuous Assessment Record',
            'slug' => 'continuous-assessment',
            'description_ar' => 'سجل تفاعلي شامل للتقييم المستمر يشمل جميع المعايير مع إمكانية إنشاء تقارير تلقائية.',
            'description_en' => 'Comprehensive interactive continuous assessment record with automatic report generation.',
            'price' => 59.99,
            'discount_price' => 49.99,
            'type' => 'interactive',
            'category_id' => $intermediate->id,
            'thumbnail_url' => null,
            'template_structure' => [
                'fields' => [
                    ['name' => 'student_name', 'type' => 'text', 'label_ar' => 'اسم الطالب', 'label_en' => 'Student Name'],
                    ['name' => 'subject', 'type' => 'select', 'label_ar' => 'المادة', 'label_en' => 'Subject', 'options' => ['رياضيات', 'علوم', 'لغة عربية', 'لغة إنجليزية']],
                    ['name' => 'skill', 'type' => 'text', 'label_ar' => 'المهارة', 'label_en' => 'Skill'],
                    ['name' => 'level', 'type' => 'select', 'label_ar' => 'المستوى', 'label_en' => 'Level', 'options' => ['متقن', 'متمكن', 'غير متمكن']],
                ],
            ],
            'educational_stage' => 'intermediate',
            'subject' => 'general',
            'tags' => ['تقييم مستمر', 'مهارات', 'تقارير'],
            'is_featured' => true,
            'is_active' => true,
            'downloads_count' => 198,
        ]);

        // Product 8 - Downloadable
        $products[] = Product::create([
            'name_ar' => 'دفتر تحضير المعلم',
            'name_en' => 'Teacher Preparation Notebook',
            'slug' => 'teacher-preparation-notebook',
            'description_ar' => 'دفتر تحضير كامل للمعلم يشمل الخطة السنوية والفصلية واليومية.',
            'description_en' => 'Complete teacher preparation notebook including yearly, semester, and daily plans.',
            'price' => 29.99,
            'discount_price' => null,
            'type' => 'downloadable',
            'category_id' => $secondary->id,
            'thumbnail_url' => null,
            'file_path' => null,
            'file_name' => 'teacher-notebook.pdf',
            'educational_stage' => 'secondary',
            'subject' => 'general',
            'tags' => ['تحضير', 'خطة', 'دفتر'],
            'is_featured' => false,
            'is_active' => true,
            'downloads_count' => 267,
        ]);

        // Product 9 - Interactive
        $products[] = Product::create([
            'name_ar' => 'سجل الخطة التربوية الفردية',
            'name_en' => 'Individual Education Plan Record',
            'slug' => 'individual-education-plan',
            'description_ar' => 'سجل تفاعلي لإعداد ومتابعة الخطط التربوية الفردية لذوي الاحتياجات الخاصة.',
            'description_en' => 'Interactive record for creating and tracking individual education plans for special needs.',
            'price' => 54.99,
            'discount_price' => 44.99,
            'type' => 'interactive',
            'category_id' => $specialEd->id,
            'thumbnail_url' => null,
            'template_structure' => [
                'fields' => [
                    ['name' => 'student_name', 'type' => 'text', 'label_ar' => 'اسم الطالب', 'label_en' => 'Student Name'],
                    ['name' => 'goal', 'type' => 'textarea', 'label_ar' => 'الهدف', 'label_en' => 'Goal'],
                    ['name' => 'current_level', 'type' => 'textarea', 'label_ar' => 'المستوى الحالي', 'label_en' => 'Current Level'],
                    ['name' => 'target_level', 'type' => 'textarea', 'label_ar' => 'المستوى المستهدف', 'label_en' => 'Target Level'],
                ],
                'ai_enabled_fields' => ['goal'],
            ],
            'educational_stage' => 'all',
            'subject' => 'special_education',
            'tags' => ['خطة فردية', 'تعليم خاص', 'متابعة'],
            'is_featured' => true,
            'is_active' => true,
            'downloads_count' => 87,
        ]);

        // Product 10 - Downloadable
        $products[] = Product::create([
            'name_ar' => 'استمارات النشاط المدرسي',
            'name_en' => 'School Activity Forms',
            'slug' => 'school-activity-forms',
            'description_ar' => 'مجموعة استمارات شاملة للأنشطة المدرسية تشمل الرحلات والفعاليات والمسابقات.',
            'description_en' => 'Comprehensive forms for school activities including trips, events, and competitions.',
            'price' => 17.99,
            'discount_price' => null,
            'type' => 'downloadable',
            'category_id' => $activities->id,
            'thumbnail_url' => null,
            'file_path' => null,
            'file_name' => 'activity-forms.zip',
            'educational_stage' => 'all',
            'subject' => 'activities',
            'tags' => ['أنشطة', 'استمارات', 'فعاليات'],
            'is_featured' => false,
            'is_active' => true,
            'downloads_count' => 156,
        ]);

        // Product 11 - Interactive
        $products[] = Product::create([
            'name_ar' => 'سجل التواصل مع أولياء الأمور',
            'name_en' => 'Parent Communication Record',
            'slug' => 'parent-communication-record',
            'description_ar' => 'سجل تفاعلي لتوثيق جميع اتصالات ولقاءات أولياء الأمور مع إمكانية إرسال تقارير.',
            'description_en' => 'Interactive record for documenting all parent communications and meetings.',
            'price' => 39.99,
            'discount_price' => 34.99,
            'type' => 'interactive',
            'category_id' => $primary->id,
            'thumbnail_url' => null,
            'template_structure' => [
                'fields' => [
                    ['name' => 'parent_name', 'type' => 'text', 'label_ar' => 'اسم ولي الأمر', 'label_en' => 'Parent Name'],
                    ['name' => 'student_name', 'type' => 'text', 'label_ar' => 'اسم الطالب', 'label_en' => 'Student Name'],
                    ['name' => 'communication_type', 'type' => 'select', 'label_ar' => 'نوع التواصل', 'label_en' => 'Type', 'options' => ['اتصال هاتفي', 'لقاء شخصي', 'رسالة']],
                    ['name' => 'summary', 'type' => 'textarea', 'label_ar' => 'ملخص', 'label_en' => 'Summary'],
                ],
            ],
            'educational_stage' => 'primary',
            'subject' => 'general',
            'tags' => ['أولياء أمور', 'تواصل', 'اجتماعات'],
            'is_featured' => false,
            'is_active' => true,
            'downloads_count' => 143,
        ]);

        // Product 12 - Downloadable
        $products[] = Product::create([
            'name_ar' => 'بطاقات التعزيز السلوكي',
            'name_en' => 'Behavioral Reinforcement Cards',
            'slug' => 'behavioral-reinforcement-cards',
            'description_ar' => 'مجموعة من 50 بطاقة تعزيز سلوكي ملونة وجذابة للطباعة.',
            'description_en' => 'Collection of 50 colorful behavioral reinforcement cards for printing.',
            'price' => 12.99,
            'discount_price' => 9.99,
            'type' => 'downloadable',
            'category_id' => $kindergarten->id,
            'thumbnail_url' => null,
            'file_path' => null,
            'file_name' => 'reinforcement-cards.pdf',
            'educational_stage' => 'kindergarten',
            'subject' => 'general',
            'tags' => ['تعزيز', 'سلوك', 'بطاقات'],
            'is_featured' => false,
            'is_active' => true,
            'downloads_count' => 412,
        ]);

        $this->command->info('✅ 12 Products created');

        // ===========================================================================
        // COUPONS
        // ===========================================================================

        Coupon::create([
            'code' => 'WELCOME10',
            'description_ar' => 'خصم 10% للمستخدمين الجدد',
            'description_en' => '10% discount for new users',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'max_discount' => 50,
            'min_order_amount' => 20,
            'max_uses' => 1000,
            'used_count' => 45,
            'max_uses_per_user' => 1,
            'starts_at' => now()->subMonth(),
            'expires_at' => now()->addYear(),
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'SAVE20',
            'description_ar' => 'خصم 20 ريال مباشر',
            'description_en' => '20 SAR direct discount',
            'discount_type' => 'fixed',
            'discount_value' => 20,
            'max_discount' => null,
            'min_order_amount' => 50,
            'max_uses' => 500,
            'used_count' => 23,
            'max_uses_per_user' => 2,
            'starts_at' => now()->subWeek(),
            'expires_at' => now()->addMonths(3),
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'HALFPRICE',
            'description_ar' => 'خصم 50% لفترة محدودة',
            'description_en' => '50% off for limited time',
            'discount_type' => 'percentage',
            'discount_value' => 50,
            'max_discount' => 100,
            'min_order_amount' => 0,
            'max_uses' => 100,
            'used_count' => 12,
            'max_uses_per_user' => 1,
            'starts_at' => now(),
            'expires_at' => now()->addWeeks(2),
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'TEACHER25',
            'description_ar' => 'خصم خاص للمعلمين 25%',
            'description_en' => 'Special 25% teacher discount',
            'discount_type' => 'percentage',
            'discount_value' => 25,
            'max_discount' => 75,
            'min_order_amount' => 30,
            'max_uses' => 500,
            'used_count' => 0,
            'max_uses_per_user' => 3,
            'starts_at' => now(),
            'expires_at' => now()->addMonths(6),
            'is_active' => true,
        ]);

        $this->command->info('✅ 4 Coupons created: WELCOME10, SAVE20, HALFPRICE, TEACHER25');

        // ===========================================================================
        // SAMPLE ORDERS (for reviews and testing)
        // ===========================================================================

        // Order 1 - User 1
        $order1 = Order::create([
            'user_id' => $user1->id,
            'order_number' => 'SERS-2026-' . strtoupper(Str::random(6)),
            'subtotal' => 69.98,
            'discount' => 0,
            'tax' => 0,
            'total' => 69.98,
            'status' => 'completed',
            'payment_method' => 'stripe',
            'payment_id' => 'pi_test_' . Str::random(24),
            'paid_at' => now()->subDays(10),
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $products[0]->id,
            'price' => 39.99,
            'product_name' => $products[0]->name_ar,
            'product_type' => $products[0]->type,
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $products[2]->id,
            'price' => 29.99,
            'product_name' => $products[2]->name_ar,
            'product_type' => $products[2]->type,
        ]);

        // Order 2 - User 2
        $order2 = Order::create([
            'user_id' => $user2->id,
            'order_number' => 'SERS-2026-' . strtoupper(Str::random(6)),
            'subtotal' => 49.99,
            'discount' => 5,
            'tax' => 0,
            'total' => 44.99,
            'status' => 'completed',
            'payment_method' => 'paypal',
            'payment_id' => 'pi_test_' . Str::random(24),
            'paid_at' => now()->subDays(5),
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $products[6]->id,
            'price' => 49.99,
            'product_name' => $products[6]->name_ar,
            'product_type' => $products[6]->type,
        ]);

        // Order 3 - User 3
        $order3 = Order::create([
            'user_id' => $user3->id,
            'order_number' => 'SERS-2026-' . strtoupper(Str::random(6)),
            'subtotal' => 29.98,
            'discount' => 0,
            'tax' => 0,
            'total' => 29.98,
            'status' => 'completed',
            'payment_method' => 'stripe',
            'payment_id' => 'pi_test_' . Str::random(24),
            'paid_at' => now()->subDays(3),
        ]);

        OrderItem::create([
            'order_id' => $order3->id,
            'product_id' => $products[1]->id,
            'price' => 19.99,
            'product_name' => $products[1]->name_ar,
            'product_type' => $products[1]->type,
        ]);

        OrderItem::create([
            'order_id' => $order3->id,
            'product_id' => $products[11]->id,
            'price' => 9.99,
            'product_name' => $products[11]->name_ar,
            'product_type' => $products[11]->type,
        ]);

        $this->command->info('✅ 3 Sample orders created');

        // ===========================================================================
        // REVIEWS
        // ===========================================================================

        // Review 1 - User 1 reviews Product 1
        Review::create([
            'user_id' => $user1->id,
            'product_id' => $products[0]->id,
            'order_id' => $order1->id,
            'rating' => 5,
            'comment' => 'سجل رائع جداً! ساعدني كثيراً في تنظيم ملاحظاتي اليومية. الذكاء الاصطناعي يقترح عبارات مميزة.',
            'is_approved' => true,
        ]);
        $products[0]->recalculateRating();

        // Review 2 - User 1 reviews Product 3
        Review::create([
            'user_id' => $user1->id,
            'product_id' => $products[2]->id,
            'order_id' => $order1->id,
            'rating' => 4,
            'comment' => 'سجل حضور وغياب ممتاز وسهل الاستخدام. أتمنى إضافة خاصية التقارير الشهرية.',
            'is_approved' => true,
        ]);
        $products[2]->recalculateRating();

        // Review 3 - User 2 reviews Product 7
        Review::create([
            'user_id' => $user2->id,
            'product_id' => $products[6]->id,
            'order_id' => $order2->id,
            'rating' => 5,
            'comment' => 'أفضل سجل تقييم مستمر استخدمته! شامل ويوفر الوقت بشكل كبير.',
            'is_approved' => true,
        ]);
        $products[6]->recalculateRating();

        // Review 4 - User 3 reviews Product 2
        Review::create([
            'user_id' => $user3->id,
            'product_id' => $products[1]->id,
            'order_id' => $order3->id,
            'rating' => 4,
            'comment' => 'نموذج تقييم جيد ومنظم. التصميم احترافي والمحتوى شامل.',
            'is_approved' => true,
        ]);
        $products[1]->recalculateRating();

        // Review 5 - User 3 reviews Product 12
        Review::create([
            'user_id' => $user3->id,
            'product_id' => $products[11]->id,
            'order_id' => $order3->id,
            'rating' => 5,
            'comment' => 'بطاقات تعزيز رائعة! الأطفال يحبونها والألوان جذابة جداً.',
            'is_approved' => true,
        ]);
        $products[11]->recalculateRating();

        $this->command->info('✅ 5 Reviews created');

        // ===========================================================================
        // WISHLISTS
        // ===========================================================================

        Wishlist::create([
            'user_id' => $user1->id,
            'product_id' => $products[1]->id,
        ]);

        Wishlist::create([
            'user_id' => $user1->id,
            'product_id' => $products[4]->id,
        ]);

        Wishlist::create([
            'user_id' => $user2->id,
            'product_id' => $products[0]->id,
        ]);

        Wishlist::create([
            'user_id' => $user3->id,
            'product_id' => $products[8]->id,
        ]);

        $this->command->info('✅ 4 Wishlist items created');

        // ===========================================================================
        // SUMMARY
        // ===========================================================================

        $this->command->newLine();
        $this->command->info('╔══════════════════════════════════════════╗');
        $this->command->info('║       🎉 SEEDING COMPLETE!               ║');
        $this->command->info('╠══════════════════════════════════════════╣');
        $this->command->info('║ Users:         4 (1 admin + 3 regular)   ║');
        $this->command->info('║ Categories:    6                         ║');
        $this->command->info('║ Products:      12 (6 interactive, 6 DL)  ║');
        $this->command->info('║ Coupons:       4                         ║');
        $this->command->info('║ Orders:        3                         ║');
        $this->command->info('║ Reviews:       5                         ║');
        $this->command->info('║ Wishlists:     4                         ║');
        $this->command->info('╚══════════════════════════════════════════╝');
        $this->command->newLine();
        $this->command->info('🔑 Login Credentials:');
        $this->command->info('   Admin:   admin@sers.com / password');
        $this->command->info('   User 1:  user@sers.com / password');
        $this->command->info('   User 2:  teacher@sers.com / password');
        $this->command->info('   User 3:  noura@sers.com / password');
        $this->command->newLine();
        $this->command->info('🎟️ Coupon Codes: WELCOME10, SAVE20, HALFPRICE, TEACHER25');
    }
}
