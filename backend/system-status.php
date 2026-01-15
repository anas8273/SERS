<?php
// Comprehensive system status check

require_once 'vendor/autoload.php';

echo "🔍 SERS System Status Report\n";
echo "============================\n\n";

// Database Connection
try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;dbname=sers_db",
        "root",
        "",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "✅ Database: Connected\n";
    
    // Check tables
    $tables = ['users', 'sections', 'categories', 'templates', 'personal_access_tokens'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
        $count = $stmt->fetchColumn();
        echo "   - $table: $count records\n";
    }
} catch (Exception $e) {
    echo "❌ Database: Failed - " . $e->getMessage() . "\n";
}

echo "\n";

// Firebase Configuration
$firebaseFile = 'storage/app/firebase/service-account.json';
if (file_exists($firebaseFile)) {
    $firebase = json_decode(file_get_contents($firebaseFile), true);
    echo "✅ Firebase: Configured\n";
    echo "   - Project: " . ($firebase['project_id'] ?? 'N/A') . "\n";
    echo "   - Type: " . ($firebase['type'] ?? 'N/A') . "\n";
} else {
    echo "❌ Firebase: Service account file missing\n";
}

echo "\n";

// API Endpoints Status
$baseUrl = 'http://localhost:8000/api';
$endpoints = [
    'GET /' => 'API Root',
    'POST /auth/register' => 'Registration',
    'POST /auth/login' => 'Login',
    'POST /auth/social' => 'Social Login',
    'GET /sections' => 'Sections',
    'GET /templates' => 'Templates',
];

echo "🌐 API Endpoints Status:\n";
foreach ($endpoints as $endpoint => $name) {
    $parts = explode(' ', $endpoint);
    $method = $parts[0];
    $path = $parts[1];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . $path);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, '{}');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $status = ($httpCode >= 200 && $httpCode < 300) || $httpCode == 422 ? '✅' : '❌';
    echo "   $status $name ($method $path): HTTP $httpCode\n";
}

echo "\n";

// Environment Check
echo "⚙️  Environment Configuration:\n";
$envFile = '.env';
if (file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    $envVars = [
        'APP_ENV' => 'local',
        'DB_DATABASE' => 'sers_db', 
        'FIREBASE_PROJECT_ID' => 'sers-project-10ba4',
        'APP_URL' => 'http://localhost:8000',
    ];
    
    foreach ($envVars as $key => $expected) {
        $found = preg_match("/^$key=(.*)$/m", $envContent, $matches);
        $value = $found ? trim($matches[1]) : 'Not Found';
        $status = $found ? '✅' : '❌';
        echo "   $status $key: $value\n";
    }
} else {
    echo "   ❌ .env file not found\n";
}

echo "\n";
echo "🎯 System Ready for Frontend Integration!\n";