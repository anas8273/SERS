<?php
// Test script to verify all authentication endpoints

require_once 'vendor/autoload.php';

$baseUrl = 'http://localhost:8000/api';

function testEndpoint($url, $method = 'GET', $data = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

echo "🧪 SERS API Endpoint Testing\n";
echo "============================\n\n";

// Test 1: API Root
echo "1. Testing API Root...\n";
$result = testEndpoint("$baseUrl/");
echo "   Status: {$result['status']}\n";
echo "   Service: " . ($result['response']['service'] ?? 'N/A') . "\n\n";

// Test 2: Register
echo "2. Testing Registration...\n";
$registerData = [
    'name' => 'Test User ' . time(),
    'email' => 'test' . time() . '@example.com',
    'password' => 'password123',
    'password_confirmation' => 'password123'
];
$result = testEndpoint("$baseUrl/auth/register", 'POST', $registerData);
echo "   Status: {$result['status']}\n";
echo "   Success: " . ($result['response']['success'] ? 'Yes' : 'No') . "\n";
$token = $result['response']['data']['token'] ?? null;
echo "   Token: " . ($token ? 'Generated' : 'None') . "\n\n";

// Test 3: Login
echo "3. Testing Login...\n";
$loginData = [
    'email' => $registerData['email'],
    'password' => $registerData['password']
];
$result = testEndpoint("$baseUrl/auth/login", 'POST', $loginData);
echo "   Status: {$result['status']}\n";
echo "   Success: " . ($result['response']['success'] ? 'Yes' : 'No') . "\n\n";

// Test 4: Sections
echo "4. Testing Sections...\n";
$result = testEndpoint("$baseUrl/sections");
echo "   Status: {$result['status']}\n";
echo "   Count: " . (count($result['response']['data'] ?? []) ?: 'N/A') . "\n\n";

// Test 5: Templates
echo "5. Testing Templates...\n";
$result = testEndpoint("$baseUrl/templates");
echo "   Status: {$result['status']}\n";
echo "   Count: " . (count($result['response']['data'] ?? []) ?: 'N/A') . "\n\n";

echo "✅ Testing Complete!\n";