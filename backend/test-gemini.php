<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\Http;

// Load environment
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🤖 Testing Gemini AI Integration\n";
echo "================================\n\n";

$apiKey = $_ENV['GEMINI_API_KEY'] ?? null;

if (!$apiKey) {
    echo "❌ GEMINI_API_KEY not found in .env\n";
    exit(1);
}

echo "✅ API Key found: " . substr($apiKey, 0, 10) . "...\n\n";

// Test API call
$url = "https://generativelanguage.googleapis.com/v1beta/models?key={$apiKey}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Available Models (HTTP $httpCode):\n";
if ($httpCode === 200) {
    $data = json_decode($response, true);
    foreach ($data['models'] ?? [] as $model) {
        if (strpos($model['name'], 'generateContent') !== false || 
            in_array('generateContent', $model['supportedGenerationMethods'] ?? [])) {
            echo "✅ " . $model['name'] . "\n";
        }
    }
} else {
    echo $response . "\n";
}

echo "\n" . str_repeat("=", 50) . "\n\n";

// Now test with correct model
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";

$data = [
    'contents' => [
        [
            'parts' => [
                ['text' => 'اكتب جملة واحدة باللغة العربية عن التعليم']
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.7,
        'maxOutputTokens' => 100,
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Status: $httpCode\n";

if ($error) {
    echo "❌ cURL Error: $error\n";
    exit(1);
}

if ($httpCode === 200) {
    $responseData = json_decode($response, true);
    if (isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
        $generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'];
        echo "✅ Gemini AI Response:\n";
        echo "   $generatedText\n\n";
        echo "🎯 Gemini AI integration is working perfectly!\n";
    } else {
        echo "❌ Unexpected response format:\n";
        echo $response . "\n";
    }
} else {
    echo "❌ API Error (HTTP $httpCode):\n";
    echo $response . "\n";
}