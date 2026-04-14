<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InteractivePDFAutomationController;

// 🎯 Interactive PDF Automation Routes
Route::prefix('interactive-pdf')->group(function () {
    // Main automation endpoint
    Route::post('/automate', [InteractivePDFAutomationController::class, 'automate'])
        ->name('interactive-pdf.automate');
    
    // Upload and process template
    Route::post('/upload-process', [InteractivePDFAutomationController::class, 'uploadAndProcess'])
        ->name('interactive-pdf.upload-process');
    
    // Verify generated PDFs
    Route::get('/verify', [InteractivePDFAutomationController::class, 'verify'])
        ->name('interactive-pdf.verify');
    
    // List all generated PDFs
    Route::get('/list', [InteractivePDFAutomationController::class, 'list'])
        ->name('interactive-pdf.list');
    
    // Get template schema
    Route::get('/schema/{templateId}', [InteractivePDFAutomationController::class, 'getSchema'])
        ->name('interactive-pdf.schema');
    
    // Download PDF
    Route::get('/download/{templateId}', [InteractivePDFAutomationController::class, 'download'])
        ->name('interactive-pdf.download');
    
    // Delete PDF
    Route::delete('/delete/{templateId}', [InteractivePDFAutomationController::class, 'delete'])
        ->name('interactive-pdf.delete');
});