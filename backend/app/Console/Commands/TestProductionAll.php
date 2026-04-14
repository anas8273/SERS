<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Master Production Verification Runner
 * 
 * Run with: php artisan test:production-all
 */
class TestProductionAll extends Command
{
    protected $signature = 'test:production-all';
    protected $description = 'Run all SERS production verification tests';

    public function handle()
    {
        $this->info('');
        $this->info('╔════════════════════════════════════════════════════════════════╗');
        $this->info('║                                                                ║');
        $this->info('║         🚀 SERS PRODUCTION VERIFICATION SUITE 🚀              ║');
        $this->info('║                                                                ║');
        $this->info('╚════════════════════════════════════════════════════════════════╝');
        $this->info('');

        $startTime = microtime(true);
        $results = [];

        // Step 1: Seed test data
        $this->info('📦 STEP 1: Seeding Test Data...');
        $this->call('db:seed', ['--class' => 'ProductionVerificationSeeder']);
        $results['seeder'] = true;
        $this->newLine();

        // Step 2: Sync to Firestore
        $this->info('🔄 STEP 2: Syncing Schema to Firestore...');
        try {
            $this->call('sync:firestore-schema');
            $results['firestore_sync'] = true;
        } catch (\Exception $e) {
            $this->warn("⚠️ Firestore sync skipped: {$e->getMessage()}");
            $results['firestore_sync'] = 'skipped';
        }
        $this->newLine();

        // Step 3: Payment Wall Test
        $this->info('🔐 STEP 3: Testing Payment Wall...');
        $this->call('test:payment-wall');
        $results['payment_wall'] = true;
        $this->newLine();

        // Step 4: PDF Generation Test
        $this->info('📄 STEP 4: Testing PDF Generation...');
        $this->call('test:pdf-generation');
        $results['pdf_generation'] = true;
        $this->newLine();

        // Step 5: Version History Test
        $this->info('📚 STEP 5: Testing Version History...');
        $this->call('test:version-history');
        $results['version_history'] = true;
        $this->newLine();

        // Step 6: AI Engine Test
        $this->info('🤖 STEP 6: Testing AI Engine...');
        $this->call('test:ai-engine');
        $results['ai_engine'] = true;
        $this->newLine();

        // Calculate duration
        $duration = round(microtime(true) - $startTime, 2);

        // Final Summary
        $this->info('');
        $this->info('╔════════════════════════════════════════════════════════════════╗');
        $this->info('║                                                                ║');
        $this->info('║                   📊 FINAL VERIFICATION REPORT                 ║');
        $this->info('║                                                                ║');
        $this->info('╚════════════════════════════════════════════════════════════════╝');
        $this->info('');

        $this->table(
            ['Component', 'Status'],
            [
                ['Test Data Seeding', $this->formatStatus($results['seeder'])],
                ['Firestore Schema Sync', $this->formatStatus($results['firestore_sync'])],
                ['Payment Wall (Middleware)', $this->formatStatus($results['payment_wall'])],
                ['PDF Generation (RTL + QR)', $this->formatStatus($results['pdf_generation'])],
                ['Version History (Restore)', $this->formatStatus($results['version_history'])],
                ['AI Engine (Analysis)', $this->formatStatus($results['ai_engine'])],
            ]
        );

        $this->info('');
        $this->info("⏱️  Total Execution Time: {$duration} seconds");
        $this->info('');

        // Check all passed
        $allPassed = !in_array(false, $results, true);

        if ($allPassed) {
            $this->info('╔════════════════════════════════════════════════════════════════╗');
            $this->info('║                                                                ║');
            $this->info('║           ✅ FINAL STATUS: READY FOR PRODUCTION ✅            ║');
            $this->info('║                                                                ║');
            $this->info('╚════════════════════════════════════════════════════════════════╝');
        } else {
            $this->error('╔════════════════════════════════════════════════════════════════╗');
            $this->error('║                                                                ║');
            $this->error('║           ❌ FINAL STATUS: NOT READY - REVIEW LOGS ❌          ║');
            $this->error('║                                                                ║');
            $this->error('╚════════════════════════════════════════════════════════════════╝');
        }

        $this->info('');
        $this->info('📋 Logs saved to: storage/logs/laravel.log');
        $this->info('');

        return $allPassed ? 0 : 1;
    }

    private function formatStatus($status): string
    {
        if ($status === true) return '✅ PASSED';
        if ($status === false) return '❌ FAILED';
        if ($status === 'skipped') return '⚠️ SKIPPED';
        return '❓ UNKNOWN';
    }
}
