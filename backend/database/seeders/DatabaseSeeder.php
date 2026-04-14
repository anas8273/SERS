<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Section;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * DatabaseSeeder
 * 
 * Seeds the database with basic data for development and testing.
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

        // ⚠️ SECURITY: Change passwords before production deployment!
        // Use: SEEDER_PASSWORD=YourStrongPassword php artisan db:seed
        $seederPassword = env('SEEDER_PASSWORD', 'Sers@2026!Dev');

        // Admin User
        $admin = User::updateOrCreate(
            ['email' => 'admin@sers.com'],
            [
                'name' => 'مدير النظام',
                'password' => $seederPassword,
                'phone' => '+966500000001',
                'role' => 'admin',
                'is_active' => true,
                'wallet_balance' => 0,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info("✅ Admin user created: admin@sers.com / {$seederPassword}");

        // Regular Users
        $user1 = User::updateOrCreate(
            ['email' => 'user@sers.com'],
            [
                'name' => 'سارة أحمد',
                'password' => $seederPassword,
                'phone' => '+966500000002',
                'role' => 'user',
                'is_active' => true,
                'wallet_balance' => 100.00,
                'email_verified_at' => now(),
            ]
        );

        $user2 = User::updateOrCreate(
            ['email' => 'teacher@sers.com'],
            [
                'name' => 'محمد علي',
                'password' => $seederPassword,
                'phone' => '+966500000003',
                'role' => 'user',
                'is_active' => true,
                'wallet_balance' => 50.00,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('✅ 2 Regular users created');

        // ===========================================================================
        // SECTIONS & CATEGORIES
        // ===========================================================================
        // Use the comprehensive SectionsAndCategoriesSeeder for all sections/categories
        $this->call(SectionsAndCategoriesSeeder::class);

        $this->command->info('✅ Sections and Categories seeded');

        // ===========================================================================
        // TEMPLATES
        // ===========================================================================
        // Seed sample templates using the TemplateSeeder
        $this->call(TemplateSeeder::class);

        $this->command->info('✅ Sample Templates seeded');

        // ===========================================================================
        // SUMMARY
        // ===========================================================================

        $this->command->newLine();
        $this->command->info('╔══════════════════════════════════════════╗');
        $this->command->info('║       🎉 SEEDING COMPLETE!               ║');
        $this->command->info('╠══════════════════════════════════════════╣');
        $this->command->info("║  Admin: admin@sers.com / {$seederPassword}");
        $this->command->info("║  User1: user@sers.com / {$seederPassword}");
        $this->command->info("║  User2: teacher@sers.com / {$seederPassword}");
        $this->command->info('╚══════════════════════════════════════════╝');
        $this->command->newLine();
    }
}
