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

        $this->command->info('✅ 2 Regular users created');

        // ===========================================================================
        // SECTIONS & CATEGORIES
        // ===========================================================================
        // Use the comprehensive SectionsAndCategoriesSeeder for all sections/categories
        $this->call(SectionsAndCategoriesSeeder::class);
        
        $this->command->info('✅ Sections and Categories seeded');

        // ===========================================================================
        // SUMMARY
        // ===========================================================================

        $this->command->newLine();
        $this->command->info('╔══════════════════════════════════════════╗');
        $this->command->info('║       🎉 SEEDING COMPLETE!               ║');
        $this->command->info('╠══════════════════════════════════════════╣');
        $this->command->info('║  Admin: admin@sers.com / password        ║');
        $this->command->info('║  User1: user@sers.com / password         ║');
        $this->command->info('║  User2: teacher@sers.com / password      ║');
        $this->command->info('╚══════════════════════════════════════════╝');
        $this->command->newLine();
    }
}
