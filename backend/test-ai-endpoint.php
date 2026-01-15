<?php

require_once 'vendor/autoload.php';

echo "🧪 Testing AI Controller Endpoint\n";
echo "==================================\n\n";

$baseUrl = 'http://localhost:8000/api';

// Test AI generate preview endpoint
$testData = [
    'template_id' => '1',
    'description' => 'سجل تقييم طالب في مادة الرياضيات للصف الخامس',
    'fields' => [
        [
            'name' => 'student_name',
            'label_ar' => 'اسم الطالب',
            'type' => 'text'
        ],
        [
            'name' => 'subject',
            'label_ar' => 'المادة',
            'type' => 'text'
        ],
        [
            'name' => 'grade',
            'label_ar' => 'الدرجة',
            'type' => 'number'
        ],
        [
            'name' => 'notes',
            'label_ar' => 'ملاحظات',
            'type' => 'textarea'
        ]
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$baseUrl/ai/generate-preview");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Status: $httpCode\n";

if ($error) {
    echo "❌ cURL Error: $error\n";
    exit(1);
}

$responseData = json_decode($response, true);

if ($httpCode === 200 && $responseData['success']) {
    echo "✅ AI Generate Preview Success!\n\n";
    echo "Generated Fields:\n";
    foreach ($responseData['data']['fields'] as $field => $value) {
        echo "  - $field: $value\n";
    }
    echo "\n🎯 AI Controller is working perfectly!\n";
} else {
    echo "❌ AI Generate Preview Failed:\n";
    echo "Response: " . json_encode($responseData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n" . str_repeat("=", 50) . "\n\n";

// Test search endpoint
echo "Testing Search Endpoint...\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$baseUrl/search?query=رياضيات");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Search HTTP Status: $httpCode\n";

if ($httpCode === 200) {
    $searchData = json_decode($response, true);
    echo "✅ Search Results: " . ($searchData['count'] ?? 0) . " items found\n";
} else {
    echo "❌ Search Failed\n";
    echo "Response: $response\n";
}