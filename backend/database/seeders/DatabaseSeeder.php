<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * DatabaseSeeder
 * 
 * Seeds the database with initial data for development and testing.
 * Creates admin user, regular user, categories, and sample products.
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

        // Regular User
        $user = User::create([
            'name' => 'أحمد محمد',
            'email' => 'user@sers.com',
            'password' => Hash::make('password'),
            'phone' => '+966500000002',
            'role' => 'user',
            'is_active' => true,
            'wallet_balance' => 100.00,
            'email_verified_at' => now(),
        ]);

        $this->command->info('✅ Regular user created: user@sers.com / password');

        // ===========================================================================
        // CATEGORIES
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

        $this->command->info('✅ Categories created: Kindergarten, Primary, Intermediate');

        // ===========================================================================
        // PRODUCTS
        // ===========================================================================

        // Interactive Product
        Product::create([
            'name_ar' => 'سجل الملاحظات الذكي',
            'name_en' => 'Smart Notes Record',
            'slug' => 'smart-notes-record',
            'description_ar' => 'سجل تفاعلي ذكي لتتبع ملاحظات الطلاب مع دعم الذكاء الاصطناعي للاقتراحات التلقائية.',
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
            'downloads_count' => 0,
            'average_rating' => 4.5,
            'reviews_count' => 0,
        ]);

        // Downloadable Product
        Product::create([
            'name_ar' => 'نموذج تقييم الطالب',
            'name_en' => 'Student Evaluation Template',
            'slug' => 'student-evaluation-template',
            'description_ar' => 'نموذج PDF قابل للتحميل لتقييم أداء الطلاب في المرحلة الابتدائية.',
            'description_en' => 'Downloadable PDF template for evaluating student performance in primary school.',
            'price' => 19.99,
            'discount_price' => null,
            'type' => 'downloadable',
            'category_id' => $primary->id,
            'thumbnail_url' => null,
            'file_path' => null, // Will be set when admin uploads file
            'file_name' => 'student-evaluation-template.pdf',
            'file_size' => null,
            'educational_stage' => 'primary',
            'subject' => 'general',
            'tags' => ['تقييم', 'ابتدائي', 'PDF', 'قابل للتحميل'],
            'is_featured' => true,
            'is_active' => true,
            'downloads_count' => 0,
            'average_rating' => 4.0,
            'reviews_count' => 0,
        ]);

        // Another Interactive Product
        Product::create([
            'name_ar' => 'سجل الحضور والغياب',
            'name_en' => 'Attendance Record',
            'slug' => 'attendance-record',
            'description_ar' => 'سجل تفاعلي لتتبع حضور وغياب الطلاب بشكل يومي مع تقارير شهرية.',
            'description_en' => 'Interactive record for daily student attendance tracking with monthly reports.',
            'price' => 29.99,
            'discount_price' => null,
            'type' => 'interactive',
            'category_id' => $intermediate->id,
            'thumbnail_url' => null,
            'template_structure' => [
                'fields' => [
                    ['name' => 'student_name', 'type' => 'text', 'label_ar' => 'اسم الطالب', 'label_en' => 'Student Name'],
                    ['name' => 'date', 'type' => 'date', 'label_ar' => 'التاريخ', 'label_en' => 'Date'],
                    ['name' => 'status', 'type' => 'select', 'label_ar' => 'الحالة', 'label_en' => 'Status', 'options' => ['حاضر', 'غائب', 'متأخر', 'مستأذن']],
                    ['name' => 'notes', 'type' => 'textarea', 'label_ar' => 'ملاحظات', 'label_en' => 'Notes'],
                ],
                'ai_enabled_fields' => ['notes'],
            ],
            'educational_stage' => 'intermediate',
            'subject' => 'general',
            'tags' => ['حضور', 'غياب', 'متوسط', 'تقارير'],
            'is_featured' => false,
            'is_active' => true,
            'downloads_count' => 0,
            'average_rating' => 0,
            'reviews_count' => 0,
        ]);

        $this->command->info('✅ Products created: Smart Notes Record, Student Evaluation Template, Attendance Record');

        // ===========================================================================
        // SUMMARY
        // ===========================================================================
        $this->command->newLine();
        $this->command->info('🎉 Database seeding completed successfully!');
        $this->command->table(
            ['Entity', 'Count'],
            [
                ['Users', User::count()],
                ['Categories', Category::count()],
                ['Products', Product::count()],
            ]
        );
    }
}
