<?php

require_once 'vendor/autoload.php';

echo "🧪 Testing AI Controller with Authentication\n";
echo "=============================================\n\n";

$baseUrl = 'http://localhost:8000/api';

function testEndpoint($url, $method = 'GET', $data = null, $token = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    
    if ($token) {
        $headers[] = "Authorization: Bearer $token";
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'response' => json_decode($response, true),
        'error' => $error
    ];
}

// Step 1: Register a test user
echo "1. Registering test user...\n";
$registerData = [
    'name' => 'AI Test User',
    'email' => 'aitest' . time() . '@example.com',
    'password' => 'password123',
    'password_confirmation' => 'password123'
];

$result = testEndpoint("$baseUrl/auth/register", 'POST', $registerData);
echo "   Status: {$result['status']}\n";

if ($result['status'] !== 201 || !$result['response']['success']) {
    echo "❌ Registration failed. Cannot proceed with AI testing.\n";
    exit(1);
}

$token = $result['response']['data']['token'];
echo "   ✅ User registered successfully\n\n";

// Step 2: Test AI fill-all (existing method)
echo "2. Testing AI Fill All...\n";
$testData = [
    'template_id' => 1,
    'title' => 'سجل تقييم طالب في مادة الرياضيات',
    'current_values' => []
];

$result = testEndpoint("$baseUrl/ai/fill-all", 'POST', $testData, $token);
echo "   Status: {$result['status']}\n";

if ($result['error']) {
    echo "   ❌ cURL Error: {$result['error']}\n";
} elseif ($result['status'] === 200 && $result['response']['success']) {
    echo "   ✅ AI Fill All Success!\n";
    echo "   Generated Suggestions:\n";
    foreach ($result['response']['data']['suggestions'] as $field => $value) {
        echo "     - $field: $value\n";
    }
} else {
    echo "   ❌ AI Fill All Failed:\n";
    echo "   Response: " . json_encode($result['response'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n" . str_repeat("=", 50) . "\n\n";

// Step 3: Test search endpoint (public)
echo "3. Testing Search Endpoint...\n";
$result = testEndpoint("$baseUrl/search?query=رياضيات");
echo "   Status: {$result['status']}\n";

if ($result['status'] === 200 && $result['response']['success']) {
    echo "   ✅ Search Success: " . ($result['response']['count'] ?? 0) . " items found\n";
    if (!empty($result['response']['data'])) {
        echo "   Sample results:\n";
        foreach (array_slice($result['response']['data'], 0, 3) as $item) {
            echo "     - {$item['type']}: {$item['title']}\n";
        }
    }
} else {
    echo "   ❌ Search Failed\n";
    if ($result['response']) {
        echo "   Response: " . json_encode($result['response'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    }
}

echo "\n🎯 AI Testing Complete!\n";