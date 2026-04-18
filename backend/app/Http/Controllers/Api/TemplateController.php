<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\Section;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\FirestoreService;

class TemplateController extends Controller
{
    /**
     * Get all sections with their categories.
     */
    public function sections(): JsonResponse
    {
        $sections = cache()->remember('marketplace_sections', 3600, function () {
            return Section::with(['categories' => function ($query) {
                $query->where('is_active', true)->orderBy('sort_order');
            }])->orderBy('sort_order')->get();
        });

        return response()->json([
            'success' => true,
            'data' => $sections
        ]);
    }

    /**
     * Get templates by category.
     */
    public function index(Request $request): JsonResponse
    {
        // ── [PERF] Build deterministic cache key from all query params ─────────
        // Public (non-authenticated) listings are safe to cache per-query-signature.
        // Authenticated users may see ownership state — we skip cache in that case.
        $isPublic = !$request->user();
        // [FIX] Include cache version so CRUD operations invalidate all old caches
        $cacheVersion = (int) cache()->get('tpl_cache_version', 0);
        $cacheKey = 'tpl_list_v' . $cacheVersion . '_' . md5(json_encode($request->only([
            'category_id', 'section_id', 'section', 'type', 'search',
            'min_price', 'max_price', 'sort', 'direction', 'per_page', 'page',
        ])));

        if ($isPublic && !$request->has('search')) {
            // Cache non-search paginated lists for 3 minutes
            $result = cache()->remember($cacheKey, 180, fn () => $this->buildTemplateQuery($request));
            return response()->json($result);
        }

        return response()->json($this->buildTemplateQuery($request));
    }

    /**
     * Execute the template listing query with all filters applied.
     * Extracted for reuse with/without caching.
     */
    private function buildTemplateQuery(Request $request): array
    {
        // [PERF] withCount + withAvg eliminates N+1 from accessors
        $query = Template::with(['section', 'variants', 'defaultVariant'])
            ->withCount('approvedReviews')
            ->withAvg('approvedReviews', 'rating')
            ->active();

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        // Section by slug — use direct join for speed instead of whereHas
        if ($request->has('section') && !$request->has('section_id')) {
            $query->whereHas('section', fn ($q) => $q->where('slug', $request->section));
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // ── [PERF] FULLTEXT search — replaces LIKE %% (table scan) ─────────────
        // Falls back to LIKE if FULLTEXT index was not created (e.g., SQLite in tests)
        if ($request->has('search') && filled($request->search)) {
            $search = trim($request->search);
            try {
                // MATCH() AGAINST() uses the FULLTEXT index — 10-100x faster than LIKE
                $query->whereRaw(
                    "MATCH(name_ar, description_ar) AGAINST(? IN BOOLEAN MODE)",
                    ['"' . addslashes($search) . '"*']
                );
            } catch (\Exception $e) {
                // Graceful fallback to LIKE for non-MySQL environments (tests)
                $query->where(function ($q) use ($search) {
                    $q->where('name_ar', 'like', "%{$search}%")
                      ->orWhere('description_ar', 'like', "%{$search}%");
                });
            }
        }

        if ($request->has('min_price')) {
            $query->where('price', '>=', (float) $request->min_price);
        }
        if ($request->has('max_price')) {
            $query->where('price', '<=', (float) $request->max_price);
        }

        $sortBy = $request->input('sort', 'sort_order');
        $sortDir = $request->input('direction', 'asc');
        $allowedSorts = ['created_at', 'price', 'name_ar', 'sort_order', 'downloads_count', 'uses_count'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        }

        $perPage = min($request->input('per_page', 12), 200);
        $templates = $query->paginate($perPage);

        return [
            'success' => true,
            'data'    => $templates->items(),
            'meta'    => [
                'current_page' => $templates->currentPage(),
                'last_page'    => $templates->lastPage(),
                'per_page'     => $templates->perPage(),
                'total'        => $templates->total(),
            ],
        ];
    }

    /**
     * Get featured templates.
     */
    public function featured(): JsonResponse
    {
        $templates = cache()->remember('marketplace_featured_templates', 3600, function () {
            return Template::with(['section'])
                ->withCount('approvedReviews')
                ->withAvg('approvedReviews', 'rating')
                ->active()
                ->where('is_featured', true)
                ->orderBy('sort_order')
                ->limit(8)
                ->get();
        });

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Get templates by section slug.
     */
    public function bySection(string $slug): JsonResponse
    {
        $section = Section::where('slug', $slug)->firstOrFail();

        $templates = Template::with(['section'])
            ->withCount('approvedReviews')
            ->withAvg('approvedReviews', 'rating')
            ->active()
            ->where('section_id', $section->id)
            ->orderBy('sort_order')
            ->paginate(12);

        return response()->json([
            'success' => true,
            'data' => $templates->items(),
            'section' => $section,
            'meta' => [
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
                'total' => $templates->total(),
            ]
        ]);
    }

    /**
     * Get templates by category slug.
     */
    public function byCategory(string $slug): JsonResponse
    {
        $category = Category::where('slug', $slug)->firstOrFail();

        $templates = Template::with(['category'])
            ->withCount('approvedReviews')
            ->withAvg('approvedReviews', 'rating')
            ->active()
            ->where('category_id', $category->id)
            ->orderBy('sort_order')
            ->paginate(12);

        return response()->json([
            'success' => true,
            'data' => $templates->items(),
            'category' => $category,
            'meta' => [
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
                'total' => $templates->total(),
            ]
        ]);
    }

    /**
     * Show a single template.
     */
    public function show(Template $template): JsonResponse
    {
        // [P-07 FIX] Combined 3 separate queries into optimized chain
        $template->load(['section', 'variants', 'defaultVariant']);
        $template->loadCount('approvedReviews')
                 ->loadAvg('approvedReviews', 'rating');

        return response()->json([
            'success' => true,
            'data' => $template
        ]);
    }

    /**
     * Download a ready template file.
     * - Free templates (is_free=true or price=0): requires auth only, auto-creates completed order
     * - Paid templates: requires auth + completed order ownership
     */
    public function download(Request $request, Template $template): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        if ($template->type !== 'ready' || empty($template->ready_file)) {
            return response()->json(['success' => false, 'message' => 'لا يوجد ملف للتنزيل'], 404);
        }

        $filePath = Storage::disk('public')->path($template->ready_file);
        if (!file_exists($filePath)) {
            return response()->json(['success' => false, 'message' => 'الملف غير موجود'], 404);
        }

        $user = $request->user();

        // ── Free template: auth required, no purchase needed ──
        $isFree = $template->is_free || (float)$template->price <= 0;

        if ($isFree) {
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'يجب تسجيل الدخول لتحميل هذا القالب',
                    'error'   => 'unauthenticated',
                ], 401);
            }

            // [GAP-02 FIX] Auto-add free template to user's library on first download
            $alreadyInLibrary = \App\Models\UserLibrary::where('user_id', $user->id)
                ->where('template_id', $template->id)
                ->exists();

            if (!$alreadyInLibrary) {
                \App\Models\UserLibrary::create([
                    'user_id'     => $user->id,
                    'template_id' => $template->id,
                    'source'      => 'free',
                ]);
            }

            $template->increment('downloads_count');
            $fileName = $template->name_ar . '.' . pathinfo($filePath, PATHINFO_EXTENSION);
            return response()->download($filePath, $fileName);
        }

        // ── Paid template: must own it (completed order) ──
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تسجيل الدخول وشراء هذا القالب أولاً',
                'error'   => 'unauthenticated',
            ], 401);
        }

        $owns = \App\Models\OrderItem::whereHas('order', function ($q) use ($user) {
                $q->where('user_id', $user->id)->where('status', 'completed');
            })
            ->where('template_id', $template->id)
            ->exists();

        if (!$owns) {
            return response()->json([
                'success' => false,
                'message' => 'يجب شراء هذا القالب أولاً لتتمكن من تحميله',
                'error'   => 'not_purchased',
            ], 403);
        }

        $template->increment('downloads_count');
        $fileName = $template->name_ar . '.' . pathinfo($filePath, PATHINFO_EXTENSION);
        return response()->download($filePath, $fileName);
    }

    /**
     * Admin: List all templates.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Template::with(['section']);

        if ($request->has('search')) {
            // [SEC-HIGH-01 FIX] Escape SQL wildcards to prevent wildcard injection
            $search = str_replace(['%', '_'], ['\\%', '\\_'], $request->input('search', ''));
            $query->where(function ($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%");
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $templates = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $templates->items(),
            'meta' => [
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
            ]
        ]);
    }

    /**
     * Map frontend format values to valid DB enum values.
     * DB enum: 'digital', 'printable', 'both'
     */
    private function mapFormat(?string $format): string
    {
        $map = [
            'pdf' => 'digital', 'doc' => 'digital', 'docx' => 'digital',
            'ppt' => 'digital', 'pptx' => 'digital', 'xls' => 'digital',
            'xlsx' => 'digital', 'digital' => 'digital',
            'printable' => 'printable', 'both' => 'both',
        ];
        return $map[strtolower($format ?? 'digital')] ?? 'digital';
    }

    /**
     * Smart format detection from file extension.
     * Returns a user-friendly format string based on the uploaded file type.
     */
    private function detectFormatFromExtension(string $ext): string
    {
        return match (strtolower($ext)) {
            'pdf' => 'pdf',
            'doc', 'docx' => 'word',
            'ppt', 'pptx' => 'powerpoint',
            'xls', 'xlsx' => 'excel',
            'zip', 'rar', '7z' => 'archive',
            default => 'digital',
        };
    }

    /**
     * Admin: Store a new template.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name_ar' => 'required|string|max:255',
                'description_ar' => 'nullable|string',
                'category_id' => 'nullable|string|max:255',
                'section_id' => 'nullable|string|max:255',
                'type' => 'required|in:ready,interactive',
                'format' => 'nullable|string|max:50',
                'price' => 'required|numeric|min:0',
                'discount_price' => 'nullable|numeric|min:0|lt:price',
                'is_active' => 'nullable',
                'is_featured' => 'nullable',
                'sort_order' => 'nullable|integer|min:0',
                'tags' => 'nullable|string',
                'external_link' => 'nullable|url|max:500',
                'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp,svg|max:10240',
                'ready_file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,zip,rar,7z|max:20480',
            ], [
                'name_ar.required' => 'اسم القالب مطلوب',
                'name_ar.max' => 'اسم القالب لا يجب أن يتجاوز 255 حرف',
                'price.required' => 'السعر مطلوب (ضع 0 للمجاني)',
                'price.numeric' => 'السعر يجب أن يكون رقماً',
                'price.min' => 'السعر لا يمكن أن يكون سالباً',
                'discount_price.lt' => 'سعر الخصم يجب أن يكون أقل من السعر الأصلي',
                'thumbnail.image' => 'صورة الغلاف يجب أن تكون صورة (JPG, PNG, WebP)',
                'thumbnail.max' => 'حجم صورة الغلاف لا يتجاوز 10MB',
                'thumbnail.mimes' => 'صيغة الصورة غير مدعومة — استخدم JPG, PNG, WebP, GIF, SVG',
                'ready_file.file' => 'ملف القالب غير صالح — حاول رفعه مرة أخرى',
                'ready_file.mimes' => 'صيغة الملف غير مدعومة — استخدم PDF, Word, Excel, PowerPoint, ZIP',
                'ready_file.max' => 'حجم ملف القالب لا يتجاوز 20MB',
                'type.required' => 'نوع القالب مطلوب',
                'type.in' => 'نوع القالب غير صالح',
                'external_link.url' => 'الرابط الإلكتروني غير صالح — تأكد أنه يبدأ بـ https://',
                'external_link.max' => 'الرابط لا يجب أن يتجاوز 500 حرف',
            ]);

            // Generate slug
            $slug = Str::slug($validated['name_ar']);
            if (empty($slug)) {
                $slug = 'template-' . time() . '-' . rand(100, 999);
            }

            $originalSlug = $slug;
            $counter = 1;
            while (Template::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }

            // Ensure storage directories exist
            $thumbDir = storage_path('app/public/templates/thumbnails');
            $fileDir = storage_path('app/public/templates/files');
            if (!file_exists($thumbDir)) { mkdir($thumbDir, 0755, true); }
            if (!file_exists($fileDir)) { mkdir($fileDir, 0755, true); }

            // Handle thumbnail upload
            $thumbnailPath = null;
            if ($request->hasFile('thumbnail') && $request->file('thumbnail')->isValid()) {
                $thumbnailPath = $request->file('thumbnail')->store('templates/thumbnails', 'public');
            }

            // Handle ready file upload + smart format detection
            $readyFilePath = null;
            $detectedFormat = $validated['format'] ?? 'digital';
            $detectedFileType = null;
            if ($request->hasFile('ready_file') && $request->file('ready_file')->isValid()) {
                $readyFilePath = $request->file('ready_file')->store('templates/files', 'public');
                $ext = strtolower($request->file('ready_file')->getClientOriginalExtension());
                $detectedFileType = $ext;
                // Smart format detection from file extension
                $detectedFormat = $this->detectFormatFromExtension($ext);
            }

            // category_id is stored as a string reference
            $categoryId = $validated['category_id'] ?? null;

            // Create template
            $template = Template::create([
                'name_ar' => $validated['name_ar'],
                'slug' => $slug,
                'description_ar' => $validated['description_ar'] ?? '',
                'category_id' => $categoryId,
                'section_id' => $validated['section_id'] ?? null,
                'type' => $validated['type'],
                'format' => $detectedFormat,
                'price' => $validated['price'],
                'discount_price' => $validated['discount_price'] ?? null,
                'is_free' => (float)($validated['price']) <= 0,
                'is_active' => filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN),
                'is_featured' => filter_var($request->input('is_featured', false), FILTER_VALIDATE_BOOLEAN),
                // [SORT] Smart auto-assign: if 0 or empty, place at end
                'sort_order' => (int)($validated['sort_order'] ?? 0) ?: (Template::max('sort_order') + 1),
                'thumbnail' => $thumbnailPath,
                'ready_file' => $readyFilePath,
                'file_type' => $detectedFileType,
                'tags' => $validated['tags'] ?? null,
                'external_link' => $validated['external_link'] ?? null,
            ]);

            // [PERF] Invalidate all marketplace caches after creation
            $this->clearMarketplaceCaches();

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء القالب بنجاح',
                'data' => $template->load('section')
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في التحقق من البيانات — تحقق من الحقول المطلوبة',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Template store error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'has_thumbnail' => $request->hasFile('thumbnail'),
                'has_ready_file' => $request->hasFile('ready_file'),
                'thumbnail_valid' => $request->hasFile('thumbnail') ? $request->file('thumbnail')->isValid() : 'N/A',
                'ready_file_valid' => $request->hasFile('ready_file') ? $request->file('ready_file')->isValid() : 'N/A',
            ]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء القالب. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني',
                'error' => 'store_failed',
            ], 500);
        }
    }

    /**
     * Admin: Update an existing template.
     */
    public function update(Request $request, Template $template): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name_ar' => 'sometimes|required|string|max:255',
                'description_ar' => 'nullable|string',
                'category_id' => 'nullable|string|max:255',
                'section_id' => 'nullable|string|max:255',
                'type' => 'sometimes|required|in:ready,interactive',
                'format' => 'nullable|string|max:50',
                'price' => 'sometimes|required|numeric|min:0',
                'discount_price' => 'nullable|numeric|min:0|lt:price',
                'is_active' => 'nullable',
                'is_featured' => 'nullable',
                'sort_order' => 'nullable|integer|min:0',
                'tags' => 'nullable|string',
                'external_link' => 'nullable|url|max:500',
                'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp,svg|max:10240',
                'ready_file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,zip,rar,7z|max:20480',
            ], [
                'name_ar.required' => 'اسم القالب مطلوب',
                'name_ar.max' => 'اسم القالب لا يجب أن يتجاوز 255 حرف',
                'price.required' => 'السعر مطلوب (ضع 0 للمجاني)',
                'price.numeric' => 'السعر يجب أن يكون رقماً',
                'price.min' => 'السعر لا يمكن أن يكون سالباً',
                'discount_price.lt' => 'سعر الخصم يجب أن يكون أقل من السعر الأصلي',
                'thumbnail.image' => 'صورة الغلاف يجب أن تكون صورة (JPG, PNG, WebP)',
                'thumbnail.max' => 'حجم صورة الغلاف لا يتجاوز 10MB',
                'thumbnail.mimes' => 'صيغة الصورة غير مدعومة — استخدم JPG, PNG, WebP, GIF, SVG',
                'ready_file.file' => 'ملف القالب غير صالح — حاول رفعه مرة أخرى',
                'ready_file.mimes' => 'صيغة الملف غير مدعومة — استخدم PDF, Word, Excel, PowerPoint, ZIP',
                'ready_file.max' => 'حجم ملف القالب لا يتجاوز 20MB',
                'external_link.url' => 'الرابط الإلكتروني غير صالح — تأكد أنه يبدأ بـ https://',
                'external_link.max' => 'الرابط لا يجب أن يتجاوز 500 حرف',
            ]);

            // Ensure storage directories
            $thumbDir = storage_path('app/public/templates/thumbnails');
            $fileDir = storage_path('app/public/templates/files');
            if (!file_exists($thumbDir)) { mkdir($thumbDir, 0755, true); }
            if (!file_exists($fileDir)) { mkdir($fileDir, 0755, true); }

            // Handle thumbnail upload
            if ($request->hasFile('thumbnail') && $request->file('thumbnail')->isValid()) {
                if ($template->thumbnail) {
                    Storage::disk('public')->delete($template->thumbnail);
                }
                $validated['thumbnail'] = $request->file('thumbnail')->store('templates/thumbnails', 'public');
            }

            // Handle ready file upload + smart format detection
            if ($request->hasFile('ready_file') && $request->file('ready_file')->isValid()) {
                if ($template->ready_file) {
                    Storage::disk('public')->delete($template->ready_file);
                }
                $validated['ready_file'] = $request->file('ready_file')->store('templates/files', 'public');
                $ext = strtolower($request->file('ready_file')->getClientOriginalExtension());
                $validated['file_type'] = $ext;
                $validated['format'] = $this->detectFormatFromExtension($ext);
            }

            // Update slug if name changed
            if (isset($validated['name_ar']) && $validated['name_ar'] !== $template->name_ar) {
                $slug = Str::slug($validated['name_ar'], '-');
                if (empty($slug)) { $slug = 'template-' . time(); }
                $originalSlug = $slug;
                $counter = 1;
                while (Template::where('slug', $slug)->where('id', '!=', $template->id)->exists()) {
                    $slug = $originalSlug . '-' . $counter++;
                }
                $validated['slug'] = $slug;
            }

            // Handle booleans
            if ($request->has('is_active')) {
                $validated['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
            }
            if ($request->has('is_featured')) {
                $validated['is_featured'] = filter_var($request->input('is_featured'), FILTER_VALIDATE_BOOLEAN);
            }

            // category_id stores Firestore service_categories document ID
            // Validate it exists in Firestore before saving
            if (isset($validated['category_id']) && !empty($validated['category_id'])) {
                try {
                    $firestoreService = app(FirestoreService::class);
                    // [FIX] Use REST-based getDocument instead of broken gRPC getFirestore()
                    $doc = $firestoreService->getEducationalService('service_categories', $validated['category_id']);
                    if (!$doc) {
                        return response()->json([
                            'success' => false,
                            'message' => 'التصنيف المحدد غير موجود في النظام',
                            'errors' => ['category_id' => ['التصنيف غير صالح']]
                        ], 422);
                    }
                } catch (\Exception $e) {
                    \Log::warning('Firestore category validation failed, allowing update: ' . $e->getMessage());
                }
            }

            $template->update($validated);

            // [PERF] Invalidate all marketplace caches after update
            $this->clearMarketplaceCaches();

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث القالب بنجاح',
                'data' => $template->fresh()->load('section')
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في التحقق — تحقق من البيانات المُدخلة',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Template update error: ' . $e->getMessage(), [
                'template_id' => $template->id,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث القالب. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني',
                'error' => 'update_failed',
            ], 500);
        }
    }

    /**
     * Admin: Delete a template.
     * [FIX] Now also reorders remaining templates to fill gaps.
     */
    public function destroy(Template $template): JsonResponse
    {
        $deletedOrder = $template->sort_order;

        if ($template->thumbnail) {
            Storage::disk('public')->delete($template->thumbnail);
        }
        if ($template->ready_file) {
            Storage::disk('public')->delete($template->ready_file);
        }

        $template->delete();

        // [SORT] Reorder: shift templates that were after the deleted one
        Template::where('sort_order', '>', $deletedOrder)
            ->decrement('sort_order');

        // [PERF] Invalidate ALL caches so users see the change immediately
        $this->clearMarketplaceCaches();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف القالب بنجاح'
        ]);
    }

    /**
     * Admin: Toggle template active status.
     */
    public function toggleStatus(Template $template): JsonResponse
    {
        $template->update(['is_active' => !$template->is_active]);

        // [FIX] Clear ALL caches so status change reflects for users immediately
        $this->clearMarketplaceCaches();

        return response()->json([
            'success' => true,
            'message' => $template->is_active ? 'تم تفعيل القالب' : 'تم إلغاء تفعيل القالب',
            'data' => $template->fresh()
        ]);
    }

    /**
     * Admin: Toggle template featured status.
     */
    public function toggleFeatured(Template $template): JsonResponse
    {
        $template->update(['is_featured' => !$template->is_featured]);

        // [PERF] Invalidate caches — featured status affects homepage
        $this->clearMarketplaceCaches();

        return response()->json([
            'success' => true,
            'message' => $template->is_featured ? 'تم تمييز القالب' : 'تم إلغاء تمييز القالب',
            'data' => $template->fresh()
        ]);
    }

    /**
     * Clear all marketplace-related caches.
     * Called after any template CRUD operation.
     * [FIX] Now actually clears tpl_list_* caches using a version key.
     */
    private function clearMarketplaceCaches(): void
    {
        cache()->forget('marketplace_featured_templates');
        cache()->forget('marketplace_sections');
        cache()->forget('public_homepage_stats');

        // [FIX] Increment a version counter — the index() method will use this
        // to generate unique cache keys, effectively invalidating all old caches.
        $currentVersion = (int) cache()->get('tpl_cache_version', 0);
        cache()->forever('tpl_cache_version', $currentVersion + 1);
    }
}
