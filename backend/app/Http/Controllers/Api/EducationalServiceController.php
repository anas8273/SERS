<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FirestoreService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * EducationalServiceController
 * 
 * Handles all educational services using Firebase Firestore as the data store.
 * Supports: analyses, certificates, plans, achievements, performances, tests,
 * distributions, work-evidence, knowledge-production, follow-up-log,
 * question-bank, worksheets.
 * 
 * Security fixes applied:
 *   - Strict identity comparison (!==) for ownership checks
 *   - Field whitelisting per service type
 *   - Pagination support
 *   - Soft delete support
 *   - Admin CRUD endpoints (no ownership check)
 */
class EducationalServiceController extends Controller
{
    protected FirestoreService $firestoreService;

    // Valid service types
    protected array $validServices = [
        'analyses',
        'certificates', 
        'plans',
        'achievements',
        'performances',
        'performance',  // Alias — frontend uses singular form
        'tests',
        'distributions',
        'work-evidence',
        'knowledge-production',
        'follow-up-log',
        'question-bank',
        'worksheets',
        'curriculum',
        // Sub-types
        'weekly-plans',
        'lesson-preparations',
        'unit-plans',
        'portfolio-sections',
    ];

    /**
     * Allowed fields per service type (whitelist).
     * Fields not in this list will be stripped from user input.
     * Common fields (title, description, type, status) are always allowed.
     */
    protected array $allowedFields = [
        'analyses' => [
            'subject', 'grade', 'semester', 'class_name', 'students_count',
            'scores', 'average', 'highest', 'lowest', 'pass_count', 'fail_count',
            'chart_type', 'notes', 'recommendations', 'objectives',
        ],
        'certificates' => [
            'recipient_name', 'recipient_role', 'certificate_type', 'template_id',
            'date', 'reason', 'issuer_name', 'issuer_title', 'organization',
            'logo_url', 'signature_url', 'batch_recipients',
        ],
        'plans' => [
            'plan_type', 'subject', 'grade', 'semester', 'duration', 'week',
            'objectives', 'activities', 'resources', 'assessment', 'notes',
            'start_date', 'end_date', 'students', 'strategies',
        ],
        'achievements' => [
            'achievement_type', 'date', 'category', 'details', 'attachments',
            'is_verified', 'evidence_url', 'impact', 'participants',
        ],
        'performances' => [
            'period', 'rating', 'criteria', 'strengths', 'weaknesses',
            'goals', 'supervisor_notes', 'attachments', 'overall_score',
        ],
        'tests' => [
            'subject', 'grade', 'test_type', 'total_marks', 'duration',
            'questions', 'students_scores', 'date', 'semester', 'class_name',
        ],
        'distributions' => [
            'subject', 'grade', 'semester', 'distribution_type', 'weeks',
            'units', 'lessons', 'start_date', 'end_date', 'notes',
        ],
        'work-evidence' => [
            'item_number', 'item_title', 'evidence_text', 'attachments',
            'rating', 'notes', 'date', 'category', 'supporting_docs',
            'criterion', 'title', 'description', // admin edit form fields
        ],
        'knowledge-production' => [
            'production_type', 'topic', 'date', 'summary', 'content',
            'attachments', 'tags', 'collaborators', 'published', 'link',
            'url', 'title', 'type', 'description', // admin edit form fields
        ],
        'follow-up-log' => [
            'visit_date', 'visitor_name', 'visitor_role', 'observations',
            'recommendations', 'action_items', 'follow_up_date', 'completed',
            'notes', 'attachments',
            'student_name', 'subject', 'date', 'status', // admin edit form fields
        ],
        'question-bank' => [
            'subject', 'grade', 'question_type', 'question_text', 'options',
            'correct_answer', 'difficulty', 'marks', 'topic', 'tags',
            'explanation', 'semester',
            'question', 'type', 'bloom_level', 'answer', // admin edit form fields
        ],
        'worksheets' => [
            'subject', 'grade', 'topic', 'worksheet_type', 'content',
            'instructions', 'questions', 'answer_key', 'difficulty',
            'estimated_time', 'attachments',
        ],
        'weekly-plans' => [
            'week_number', 'subject', 'grade', 'objectives', 'activities',
            'resources', 'assessment', 'start_date', 'end_date', 'notes',
        ],
        'lesson-preparations' => [
            'lesson', 'subject', 'grade', 'unit', 'objectives', 'introduction',
            'presentation', 'practice', 'assessment', 'homework', 'resources',
            'duration', 'date', 'notes',
        ],
        'unit-plans' => [
            'unitTitle', 'subject', 'grade', 'objectives', 'lessons',
            'duration', 'assessment_plan', 'resources', 'notes',
        ],
        'portfolio-sections' => [
            'section_name', 'section_type', 'content', 'attachments',
            'order', 'notes',
        ],
    ];

    // Common fields allowed for ALL service types
    protected array $commonFields = [
        'title', 'description', 'type', 'status', 'name',
        'subject', 'lesson', 'unitTitle',
    ];

    public function __construct(FirestoreService $firestoreService)
    {
        $this->firestoreService = $firestoreService;
    }

    /**
     * [PERF] Clear cached educational service data for a user.
     * Called after store/update/delete to ensure fresh data on next fetch.
     */
    private function clearUserServiceCache(string $serviceType, string $userId): void
    {
        // Clear all filter variations for this user+service
        $patterns = [
            "edu_svc:{$serviceType}:{$userId}:" . md5('[]'),
            "edu_svc:{$serviceType}:{$userId}:" . md5(json_encode([])),
        ];
        foreach ($patterns as $key) {
            \Illuminate\Support\Facades\Cache::forget($key);
        }
        // Also clear the dashboard summary cache
        \Illuminate\Support\Facades\Cache::forget("dashboard_summary:{$userId}");
    }

    /**
     * Get all items for a specific service type (user-scoped).
     * [PERF] Cached for 5 minutes — Firestore calls take 1-3s each without cache.
     */
    public function index(Request $request, string $serviceType): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $userId = (string) Auth::id();
            $filters = $request->only(['status', 'type']);
            $page = max(1, (int) $request->input('page', 1));
            $perPage = min(50, max(1, (int) $request->input('per_page', 20)));
            
            // [PERF] Cache Firestore data for 5 minutes — biggest performance win
            // [FIX GAP-NEW-03] Cache key must include page+perPage so pagination is correct
            $cacheKey = "edu_svc:{$serviceType}:{$userId}:" . md5(json_encode($filters));
            $allItems = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($serviceType, $userId, $filters) {
                $raw = $this->firestoreService->getUserEducationalServices(
                    $serviceType,
                    $userId,
                    $filters
                );
                // Exclude soft-deleted items
                return array_values(array_filter($raw, function ($item) {
                    return empty($item['deleted_at']);
                }));
            });

            // Simple pagination (applied AFTER cache — cache stores all items)
            $total = count($allItems);
            $offset = ($page - 1) * $perPage;
            $paginatedItems = array_slice($allItems, $offset, $perPage);

            return response()->json([
                'success' => true,
                'data' => $paginatedItems,
                'count' => count($paginatedItems),
                'meta' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => max(1, (int) ceil($total / $perPage)),
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error("EducationalService index error", [
                'service' => $serviceType,
                'user_id' => Auth::id(),
                'error'   => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'حدث خطأ في جلب البيانات. يرجى المحاولة لاحقاً.',
            ], 500);
        }
    }

    /**
     * Get a specific item.
     */
    public function show(string $serviceType, string $id): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $item = $this->firestoreService->getEducationalService($serviceType, $id);

            if (!$item || !empty($item['deleted_at'])) {
                return response()->json([
                    'success' => false,
                    'error' => 'العنصر غير موجود',
                ], 404);
            }

            // [SECURITY FIX] Strict identity comparison with string cast
            if ((string) ($item['user_id'] ?? '') !== (string) Auth::id()) {
                return response()->json([
                    'success' => false,
                    'error' => 'غير مصرح لك بالوصول لهذا العنصر',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $item,
            ]);

        } catch (\Throwable $e) {
            Log::error("EducationalService show error", [
                'service' => $serviceType, 'id' => $id,
                'user_id' => Auth::id(), 'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'حدث خطأ في جلب البيانات. يرجى المحاولة لاحقاً.',
            ], 500);
        }
    }

    /**
     * Create a new item.
     */
    public function store(Request $request, string $serviceType): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $userId = (string) Auth::id();

            $allInput = $request->all();

            // Build title from various service-specific fields if not provided
            if (empty($allInput['title'])) {
                $allInput['title'] = $allInput['subject']
                    ?? $allInput['lesson']
                    ?? $allInput['unitTitle']
                    ?? $allInput['name']
                    ?? 'بدون عنوان';
            }

            $data = validator($allInput, [
                'title'       => 'required|string|max:500',
                'description' => 'nullable|string|max:5000',
                'type'        => 'nullable|string|max:200',
                'status'      => 'nullable|string|max:100',
            ])->validate();

            // [SECURITY FIX] Whitelist fields — only allow known fields for this service type
            $sanitizedData = $this->sanitizeInputFields($allInput, $serviceType);
            $data = array_merge($sanitizedData, $data);

            $documentId = $this->firestoreService->createEducationalService(
                $serviceType,
                $userId,
                $data
            );

            // [PERF] Invalidate cache so next fetch gets fresh data
            $this->clearUserServiceCache($serviceType, $userId);

            return response()->json([
                'success' => true,
                'data' => [
                    'id'      => $documentId,
                    'message' => 'تم إنشاء العنصر بنجاح',
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error'   => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error("EducationalService store error", [
                'service' => $serviceType, 'user_id' => Auth::id(), 'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'حدث خطأ أثناء الحفظ. يرجى المحاولة لاحقاً.',
            ], 500);
        }
    }

    /**
     * Update an item.
     */
    public function update(Request $request, string $serviceType, string $id): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $item = $this->firestoreService->getEducationalService($serviceType, $id);
            
            if (!$item || !empty($item['deleted_at'])) {
                return response()->json([
                    'success' => false,
                    'error' => 'العنصر غير موجود',
                ], 404);
            }

            // [SECURITY FIX] Strict identity comparison
            if ((string) ($item['user_id'] ?? '') !== (string) Auth::id()) {
                return response()->json([
                    'success' => false,
                    'error' => 'غير مصرح لك بتعديل هذا العنصر',
                ], 403);
            }

            $allInput = $request->all();
            if (empty($allInput['title'])) {
                $allInput['title'] = $allInput['subject']
                    ?? $allInput['lesson']
                    ?? $allInput['unitTitle']
                    ?? $allInput['name']
                    ?? $item['title']
                    ?? 'بدون عنوان';
            }

            $data = validator($allInput, [
                'title'       => 'sometimes|string|max:500',
                'description' => 'nullable|string|max:5000',
                'type'        => 'nullable|string|max:200',
                'status'      => 'nullable|string|max:100',
            ])->validate();

            // [SECURITY FIX] Whitelist fields
            $sanitizedData = $this->sanitizeInputFields($allInput, $serviceType);
            $data = array_merge($sanitizedData, $data);

            $this->firestoreService->updateEducationalService($serviceType, $id, $data);

            // [PERF] Invalidate cache
            $this->clearUserServiceCache($serviceType, (string) Auth::id());

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث العنصر بنجاح',
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error'   => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error("EducationalService update error", [
                'service' => $serviceType, 'id' => $id,
                'user_id' => Auth::id(), 'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'حدث خطأ أثناء التحديث. يرجى المحاولة لاحقاً.',
            ], 500);
        }
    }

    /**
     * Delete an item (soft delete).
     */
    public function destroy(string $serviceType, string $id): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $item = $this->firestoreService->getEducationalService($serviceType, $id);
            
            if (!$item || !empty($item['deleted_at'])) {
                return response()->json([
                    'success' => false,
                    'error' => 'العنصر غير موجود',
                ], 404);
            }

            // [SECURITY FIX] Strict identity comparison
            if ((string) ($item['user_id'] ?? '') !== (string) Auth::id()) {
                return response()->json([
                    'success' => false,
                    'error' => 'غير مصرح لك بحذف هذا العنصر',
                ], 403);
            }

            // [IMPROVEMENT] Soft delete instead of hard delete
            $this->firestoreService->updateEducationalService($serviceType, $id, [
                'deleted_at' => now()->toIso8601String(),
                'status' => 'deleted',
            ]);

            // [PERF] Invalidate cache
            $this->clearUserServiceCache($serviceType, (string) Auth::id());

            return response()->json([
                'success' => true,
                'message' => 'تم حذف العنصر بنجاح',
            ]);

        } catch (\Throwable $e) {
            Log::error("EducationalService destroy error", [
                'service' => $serviceType, 'id' => $id,
                'user_id' => Auth::id(), 'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'حدث خطأ أثناء الحذف. يرجى المحاولة لاحقاً.',
            ], 500);
        }
    }

    /**
     * Export an item (client-side redirect).
     */
    public function export(Request $request, string $serviceType, string $id): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $item = $this->firestoreService->getEducationalService($serviceType, $id);
            
            if (!$item || !empty($item['deleted_at'])) {
                return response()->json([
                    'success' => false,
                    'error' => 'العنصر غير موجود',
                ], 404);
            }

            // [SECURITY FIX] Strict identity comparison
            if ((string) ($item['user_id'] ?? '') !== (string) Auth::id()) {
                return response()->json([
                    'success' => false,
                    'error'   => 'غير مصرح لك بتصدير هذا العنصر',
                ], 403);
            }

            // Return the full item data for client-side export (html-to-image/jspdf)
            return response()->json([
                'success' => true,
                'message' => 'يرجى استخدام التصدير من واجهة المستخدم.',
                'data'    => $item,
                'export_hint' => 'client_side',
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'حدث خطأ أثناء التصدير. يرجى المحاولة لاحقاً.',
            ], 500);
        }
    }

    /**
     * Get statistics for a service type (optimized).
     */
    public function statistics(string $serviceType): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $userId = (string) Auth::id();
            $items = $this->firestoreService->getUserEducationalServices($serviceType, $userId);

            $stats = [
                'total'     => 0,
                'draft'     => 0,
                'completed' => 0,
                'exported'  => 0,
                'deleted'   => 0,
                'this_week' => 0,
                'this_month'=> 0,
            ];

            $weekAgo  = now()->subWeek()->toIso8601String();
            $monthAgo = now()->subMonth()->toIso8601String();

            foreach ($items as $item) {
                // Count deleted separately
                if (!empty($item['deleted_at'])) {
                    $stats['deleted']++;
                    continue;
                }

                $stats['total']++;

                $status = $item['status'] ?? 'draft';
                if (isset($stats[$status])) {
                    $stats[$status]++;
                }

                // Time-based stats
                $createdAt = $item['created_at'] ?? null;
                if ($createdAt) {
                    $createdStr = is_string($createdAt) ? $createdAt : '';
                    if ($createdStr > $weekAgo) {
                        $stats['this_week']++;
                    }
                    if ($createdStr > $monthAgo) {
                        $stats['this_month']++;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Throwable $e) {
            Log::error("EducationalService statistics error", [
                'service' => $serviceType, 'user_id' => Auth::id(), 'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error' => 'حدث خطأ في جلب الإحصائيات.',
            ], 500);
        }
    }

    // ===================================================================
    // ADMIN ENDPOINTS — no ownership check, all users' data
    // ===================================================================

    /**
     * [ADMIN] List all items for a service type across all users.
     */
    public function adminIndex(Request $request, string $serviceType): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            // Get ALL items from the collection (no user filter)
            // [FIX] Use REST-based listDocuments instead of broken gRPC getFirestore()
            $allDocs = $this->firestoreService->listDocuments($serviceType, 1000);

            $items = [];
            foreach ($allDocs as $data) {
                // Exclude soft-deleted unless explicitly requested
                if (empty($data['deleted_at']) || $request->input('include_deleted')) {
                    $items[] = $data;
                }
            }

            // ── Enrich with user_name from MySQL ─────────────────────────
            $userIds = array_unique(array_filter(array_column($items, 'user_id')));
            $userNames = [];
            if (!empty($userIds)) {
                $userNames = \App\Models\User::whereIn('id', $userIds)
                    ->pluck('name', 'id')
                    ->toArray();
            }
            foreach ($items as &$item) {
                $uid = $item['user_id'] ?? null;
                $item['user_name'] = $uid ? ($userNames[$uid] ?? 'مستخدم محذوف') : '—';
            }
            unset($item);
            // ─────────────────────────────────────────────────────────────

            // Sort by created_at desc
            usort($items, function ($a, $b) {
                return ($b['created_at'] ?? '') <=> ($a['created_at'] ?? '');
            });

            // Pagination
            $page = max(1, (int) $request->input('page', 1));
            $perPage = min(100, max(1, (int) $request->input('per_page', 20)));
            $total = count($items);
            $paginatedItems = array_slice($items, ($page - 1) * $perPage, $perPage);

            return response()->json([
                'success' => true,
                'data' => $paginatedItems,
                'count' => count($paginatedItems),
                'meta' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => max(1, (int) ceil($total / $perPage)),
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error("EducationalService adminIndex error", [
                'service' => $serviceType, 'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'حدث خطأ في جلب البيانات.',
            ], 500);
        }
    }

    /**
     * [ADMIN] Show a specific item (no ownership check).
     */
    public function adminShow(string $serviceType, string $id): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $item = $this->firestoreService->getEducationalService($serviceType, $id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'error' => 'العنصر غير موجود',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $item,
            ]);

        } catch (\Throwable $e) {
            Log::error("EducationalService adminShow error", [
                'service' => $serviceType, 'id' => $id, 'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'حدث خطأ في جلب البيانات.',
            ], 500);
        }
    }

    /**
     * [ADMIN] Create a new item for any user (no ownership restriction).
     */
    public function adminStore(Request $request, string $serviceType): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $validated = $request->validate([
                'user_id'     => 'required|string|exists:users,id',
                'title'       => 'required|string|max:500',
                'description' => 'nullable|string|max:5000',
                'type'        => 'nullable|string|max:200',
                'status'      => 'nullable|string|max:100',
            ]);

            $userId = $validated['user_id'];
            $allInput = $request->all();

            // Sanitize and merge fields
            $sanitizedData = $this->sanitizeInputFields($allInput, $serviceType);
            $data = array_merge($sanitizedData, $validated);
            unset($data['user_id']); // user_id is passed separately to FirestoreService

            // Allow admin-only fields
            $adminExtra = $request->only(['is_verified', 'admin_notes', 'is_featured']);
            $data = array_merge($data, $adminExtra);

            $documentId = $this->firestoreService->createEducationalService(
                $serviceType,
                $userId,
                $data
            );

            // Invalidate user's cache
            $this->clearUserServiceCache($serviceType, $userId);

            return response()->json([
                'success' => true,
                'data'    => [
                    'id'      => $documentId,
                    'message' => 'تم إنشاء العنصر بنجاح',
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error'   => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error("EducationalService adminStore error", [
                'service' => $serviceType, 'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'حدث خطأ أثناء الحفظ.',
            ], 500);
        }
    }

    /**
     * [ADMIN] Update any item (no ownership check).
     */
    public function adminUpdate(Request $request, string $serviceType, string $id): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $item = $this->firestoreService->getEducationalService($serviceType, $id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'error' => 'العنصر غير موجود',
                ], 404);
            }

            $allInput = $request->all();
            $sanitizedData = $this->sanitizeInputFields($allInput, $serviceType);

            // Allow admin to set additional fields
            $adminExtra = $request->only(['is_verified', 'admin_notes', 'is_featured', 'status']);
            $data = array_merge($sanitizedData, $adminExtra);

            $this->firestoreService->updateEducationalService($serviceType, $id, $data);

            // [FIX] Invalidate the target user's cache so changes reflect immediately
            $ownerId = $item['user_id'] ?? null;
            if ($ownerId) {
                $this->clearUserServiceCache($serviceType, (string) $ownerId);
            }

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث العنصر بنجاح',
            ]);

        } catch (\Throwable $e) {
            Log::error("EducationalService adminUpdate error", [
                'service' => $serviceType, 'id' => $id, 'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'حدث خطأ أثناء التحديث.',
            ], 500);
        }
    }

    /**
     * [ADMIN] Delete any item (hard delete — admin has full authority).
     */
    public function adminDestroy(string $serviceType, string $id): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $item = $this->firestoreService->getEducationalService($serviceType, $id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'error' => 'العنصر غير موجود',
                ], 404);
            }

            // Admin hard-deletes
            $this->firestoreService->deleteEducationalService($serviceType, $id);

            // [FIX] Invalidate the target user's cache
            $ownerId = $item['user_id'] ?? null;
            if ($ownerId) {
                $this->clearUserServiceCache($serviceType, (string) $ownerId);
            }

            return response()->json([
                'success' => true,
                'message' => 'تم حذف العنصر نهائياً',
            ]);

        } catch (\Throwable $e) {
            Log::error("EducationalService adminDestroy error", [
                'service' => $serviceType, 'id' => $id, 'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'حدث خطأ أثناء الحذف.',
            ], 500);
        }
    }

    /**
     * [ADMIN] Get statistics across all users for a service type.
     */
    public function adminStatistics(Request $request, string $serviceType): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            // [FIX] Use REST-based listDocuments instead of broken gRPC getFirestore()
            $allDocs = $this->firestoreService->listDocuments($serviceType, 1000);

            $stats = [
                'total' => 0,
                'active' => 0,
                'draft' => 0,
                'completed' => 0,
                'deleted' => 0,
                'unique_users' => [],
            ];

            foreach ($allDocs as $data) {
                if (!empty($data['deleted_at'])) {
                    $stats['deleted']++;
                    continue;
                }

                $stats['total']++;
                $status = $data['status'] ?? 'draft';
                if (isset($stats[$status])) {
                    $stats[$status]++;
                } else {
                    $stats['active']++;
                }

                if (!empty($data['user_id'])) {
                    $stats['unique_users'][$data['user_id']] = true;
                }
            }

            $stats['unique_users'] = count($stats['unique_users']);

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Throwable $e) {
            Log::error("EducationalService adminStatistics error", [
                'service' => $serviceType, 'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'error' => 'حدث خطأ في جلب الإحصائيات.',
            ], 500);
        }
    }

    // ===================================================================
    // PRIVATE HELPERS
    // ===================================================================

    /**
     * Check if service type is valid.
     */
    protected function isValidServiceType(string $serviceType): bool
    {
        return in_array($serviceType, $this->validServices);
    }

    /**
     * Sanitize input fields based on the service type whitelist.
     * Strips any fields not in the whitelist to prevent injection of arbitrary data.
     */
    protected function sanitizeInputFields(array $input, string $serviceType): array
    {
        $allowed = array_merge(
            $this->commonFields,
            $this->allowedFields[$serviceType] ?? []
        );

        return array_intersect_key($input, array_flip($allowed));
    }
}
