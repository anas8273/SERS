<?php

require_once 'vendor/autoload.php';

echo "🔍 Testing AIController Class Methods\n";
echo "=====================================\n\n";

try {
    $reflection = new ReflectionClass('App\Http\Controllers\Api\AIController');
    
    echo "Class: " . $reflection->getName() . "\n";
    echo "File: " . $reflection->getFileName() . "\n\n";
    
    echo "Public Methods:\n";
    $methods = $reflection->getMethods(ReflectionMethod::IS_PUBLIC);
    foreach ($methods as $method) {
        if ($method->getDeclaringClass()->getName() === 'App\Http\Controllers\Api\AIController') {
            echo "  ✅ " . $method->getName() . "\n";
        }
    }
    
    echo "\nChecking specific methods:\n";
    $methodsToCheck = ['generatePreview', 'search', 'suggest', 'fillAll', 'acceptSuggestion'];
    
    foreach ($methodsToCheck as $methodName) {
        if ($reflection->hasMethod($methodName)) {
            $method = $reflection->getMethod($methodName);
            if ($method->isPublic()) {
                echo "  ✅ $methodName (public)\n";
            } else {
                echo "  ❌ $methodName (not public)\n";
            }
        } else {
            echo "  ❌ $methodName (not found)\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}