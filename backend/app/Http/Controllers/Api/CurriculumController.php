<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * CurriculumController
 * 
 * Manages Saudi curriculum data (stages, grades, subjects).
 * Data is stored in Cache with 24h TTL.
 * 
 * [REFACTOR] Extracted from 70 lines of inline closures in api.php
 * [SECURITY] Added input validation + UUID-based IDs
 */
class CurriculumController extends Controller
{
    // Default stages (Saudi curriculum)
    private const DEFAULT_STAGES = [
        ['id' => '1', 'name' => 'رياض الأطفال', 'grades_count' => 2],
        ['id' => '2', 'name' => 'ابتدائي', 'grades_count' => 6],
        ['id' => '3', 'name' => 'متوسط', 'grades_count' => 3],
        ['id' => '4', 'name' => 'ثانوي', 'grades_count' => 3],
    ];

    private const CACHE_TTL = 86400; // 24 hours

    // ── Stages ───────────────────────────────────────────────

    public function getStages(): JsonResponse
    {
        $stages = Cache::get('curriculum_stages', self::DEFAULT_STAGES);
        return response()->json(['success' => true, 'data' => $stages]);
    }

    public function storeStage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'grades_count' => 'nullable|integer|min:0|max:20',
        ]);

        $stages = Cache::get('curriculum_stages', self::DEFAULT_STAGES);
        $new = array_merge(['id' => Str::uuid()->toString()], $data);
        $stages[] = $new;
        Cache::put('curriculum_stages', $stages, self::CACHE_TTL);

        return response()->json(['success' => true, 'data' => $new], 201);
    }

    public function updateStage(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'sometimes|string|max:100',
            'grades_count' => 'nullable|integer|min:0|max:20',
        ]);

        $stages = Cache::get('curriculum_stages', self::DEFAULT_STAGES);
        $found = false;
        $stages = array_map(function ($s) use ($id, $data, &$found) {
            if ($s['id'] === $id) {
                $found = true;
                return array_merge($s, $data);
            }
            return $s;
        }, $stages);

        if (!$found) {
            return response()->json(['success' => false, 'error' => 'المرحلة غير موجودة'], 404);
        }

        Cache::put('curriculum_stages', $stages, self::CACHE_TTL);
        return response()->json(['success' => true]);
    }

    public function deleteStage(string $id): JsonResponse
    {
        $stages = Cache::get('curriculum_stages', self::DEFAULT_STAGES);
        $stages = array_values(array_filter($stages, fn($s) => $s['id'] !== $id));
        Cache::put('curriculum_stages', $stages, self::CACHE_TTL);
        return response()->json(['success' => true]);
    }

    // ── Grades ────────────────────────────────────────────────

    public function getGrades(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Cache::get('curriculum_grades', [])]);
    }

    public function storeGrade(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:100',
            'stage_id' => 'nullable|string|max:50',
        ]);

        $items = Cache::get('curriculum_grades', []);
        $new = array_merge(['id' => Str::uuid()->toString()], $data);
        $items[] = $new;
        Cache::put('curriculum_grades', $items, self::CACHE_TTL);

        return response()->json(['success' => true, 'data' => $new], 201);
    }

    public function updateGrade(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'sometimes|string|max:100',
            'stage_id' => 'nullable|string|max:50',
        ]);

        $items = Cache::get('curriculum_grades', []);
        $items = array_map(fn($s) => $s['id'] === $id ? array_merge($s, $data) : $s, $items);
        Cache::put('curriculum_grades', $items, self::CACHE_TTL);

        return response()->json(['success' => true]);
    }

    public function deleteGrade(string $id): JsonResponse
    {
        $items = array_values(array_filter(Cache::get('curriculum_grades', []), fn($s) => $s['id'] !== $id));
        Cache::put('curriculum_grades', $items, self::CACHE_TTL);
        return response()->json(['success' => true]);
    }

    // ── Subjects ──────────────────────────────────────────────

    public function getSubjects(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Cache::get('curriculum_subjects', [])]);
    }

    public function storeSubject(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:200',
            'grade_id' => 'nullable|string|max:50',
            'stage_id' => 'nullable|string|max:50',
        ]);

        $items = Cache::get('curriculum_subjects', []);
        $new = array_merge(['id' => Str::uuid()->toString()], $data);
        $items[] = $new;
        Cache::put('curriculum_subjects', $items, self::CACHE_TTL);

        return response()->json(['success' => true, 'data' => $new], 201);
    }

    public function updateSubject(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'sometimes|string|max:200',
            'grade_id' => 'nullable|string|max:50',
            'stage_id' => 'nullable|string|max:50',
        ]);

        $items = Cache::get('curriculum_subjects', []);
        $items = array_map(fn($s) => $s['id'] === $id ? array_merge($s, $data) : $s, $items);
        Cache::put('curriculum_subjects', $items, self::CACHE_TTL);

        return response()->json(['success' => true]);
    }

    public function deleteSubject(string $id): JsonResponse
    {
        $items = array_values(array_filter(Cache::get('curriculum_subjects', []), fn($s) => $s['id'] !== $id));
        Cache::put('curriculum_subjects', $items, self::CACHE_TTL);
        return response()->json(['success' => true]);
    }
}
