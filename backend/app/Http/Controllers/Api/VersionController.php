<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\VersionControlService;
use App\Services\UniversalAnalysisService;
use App\Services\PDFGenerationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class VersionController extends Controller
{
    private $versionService;
    private $analysisService;
    private $pdfService;

    public function __construct(
        VersionControlService $versionService,
        UniversalAnalysisService $analysisService,
        PDFGenerationService $pdfService
    ) {
        $this->versionService = $versionService;
        $this->analysisService = $analysisService;
        $this->pdfService = $pdfService;
    }

    /**
     * Get version history for a record
     */
    public function getVersionHistory(string $recordId): JsonResponse
    {
        try {
            $result = $this->versionService->getVersionHistory($recordId);
            
            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل في تحميل تاريخ الإصدارات',
                    'error' => $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحميل تاريخ الإصدارات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new version
     * 
     * POST /api/records/{recordId}/versions
     */
    public function createVersion(Request $request, string $recordId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'data' => 'required|array',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $result = $this->versionService->createVersion(
                $recordId,
                $request->input('data'),
                $request->input('title', ''),
                $request->input('metadata', [])
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم إنشاء الإصدار بنجاح',
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل في إنشاء الإصدار',
                    'error' => $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء الإصدار',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore a specific version
     * 
     * POST /api/records/{recordId}/versions/{versionId}/restore
     */
    public function restoreVersion(string $recordId, string $versionId): JsonResponse
    {
        try {
            $result = $this->versionService->restoreVersion($recordId, $versionId);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم استرداد الإصدار بنجاح',
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل في استرداد الإصدار',
                    'error' => $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء استرداد الإصدار',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Compare two versions
     */
    public function compareVersions(string $recordId, string $version1Id, string $version2Id): JsonResponse
    {
        try {
            $result = $this->versionService->compareVersions($recordId, $version1Id, $version2Id);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل في مقارنة الإصدارات',
                    'error' => $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء مقارنة الإصدارات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cleanup old versions
     */
    public function cleanupOldVersions(Request $request, string $recordId): JsonResponse
    {
        $keepCount = $request->input('keep_count', 10);

        try {
            $result = $this->versionService->cleanupOldVersions($recordId, $keepCount);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم تنظيف الإصدارات القديمة بنجاح',
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل في تنظيف الإصدارات',
                    'error' => $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تنظيف الإصدارات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Analyze record using Universal Analysis Engine
     */
    public function analyzeRecord(Request $request, string $recordId): JsonResponse
    {
        try {
            $options = $request->all();
            $result = $this->analysisService->analyzeTemplate($recordId, $options);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل في تحليل السجل',
                    'error' => $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحليل السجل',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Batch analyze multiple records
     */
    public function batchAnalyze(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'record_ids' => 'required|array',
            'record_ids.*' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'معرفات السجلات مطلوبة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $recordIds = $request->input('record_ids');
            $options = $request->except(['record_ids']);
            
            $result = $this->analysisService->batchAnalyze($recordIds, $options);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل في التحليل المجمع',
                    'error' => $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التحليل المجمع',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate PDF (Payment Wall Protected)
     */
    public function generatePDF(Request $request, string $recordId): JsonResponse
    {
        try {
            $options = $request->all();
            $result = $this->pdfService->generatePDF($recordId, $options);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم إنشاء ملف PDF بنجاح',
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل في إنشاء ملف PDF',
                    'error' => $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء ملف PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate Cross-Template PDF (Payment Wall Protected)
     */
    public function generateCrossTemplatePDF(Request $request, string $recordId, string $targetTemplateId): JsonResponse
    {
        try {
            $options = $request->all();
            $result = $this->pdfService->generateCrossTemplateView($recordId, $targetTemplateId, $options);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم إنشاء ملف PDF بالقالب المختلف بنجاح',
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل في إنشاء ملف PDF بالقالب المختلف',
                    'error' => $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء ملف PDF بالقالب المختلف',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}