<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evidence;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeController extends Controller
{
    /**
     * Generate QR code from URL.
     */
    public function generateFromUrl(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'url' => 'required|url',
            'size' => 'nullable|integer|min:100|max:1000',
            'format' => 'nullable|in:png,svg',
            'user_template_data_id' => 'nullable|exists:user_template_data,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $url = $request->url;
        $size = $request->get('size', 300);
        $format = $request->get('format', 'png');

        $qrCode = QrCode::format($format)
            ->size($size)
            ->margin(1)
            ->generate($url);

        $filename = 'qr_' . md5($url . time()) . '.' . $format;
        $path = 'qrcodes/' . $filename;

        Storage::disk('public')->put($path, $qrCode);

        // Create evidence if user_template_data_id provided
        $evidence = null;
        if ($request->has('user_template_data_id')) {
            $evidence = Evidence::create([
                'user_id' => $request->user()->id,
                'user_template_data_id' => $request->user_template_data_id,
                'title' => 'رابط QR Code',
                'description' => $url,
                'type' => 'qrcode',
                'external_url' => $url,
                'qr_code_path' => $path,
            ]);
        }

        return response()->json([
            'success' => true,
            'qr_code_url' => asset('storage/' . $path),
            'path' => $path,
            'evidence' => $evidence,
            'message' => 'تم توليد الباركود بنجاح',
        ]);
    }

    /**
     * Generate QR code from uploaded file.
     */
    public function generateFromFile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB max
            'size' => 'nullable|integer|min:100|max:1000',
            'user_template_data_id' => 'nullable|exists:user_template_data,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Store the file
        $file = $request->file('file');
        $filePath = $file->store('evidence_files', 'public');
        $fileUrl = asset('storage/' . $filePath);

        // Generate QR code pointing to the file
        $size = $request->get('size', 300);
        $qrCode = QrCode::format('png')
            ->size($size)
            ->margin(1)
            ->generate($fileUrl);

        $filename = 'qr_file_' . md5($filePath . time()) . '.png';
        $qrPath = 'qrcodes/' . $filename;

        Storage::disk('public')->put($qrPath, $qrCode);

        // Create evidence
        $evidence = null;
        if ($request->has('user_template_data_id')) {
            $evidence = Evidence::create([
                'user_id' => $request->user()->id,
                'user_template_data_id' => $request->user_template_data_id,
                'title' => $file->getClientOriginalName(),
                'type' => 'qrcode',
                'file_path' => $filePath,
                'qr_code_path' => $qrPath,
                'metadata' => [
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'file_url' => $fileUrl,
            'qr_code_url' => asset('storage/' . $qrPath),
            'evidence' => $evidence,
            'message' => 'تم رفع الملف وتوليد الباركود بنجاح',
        ]);
    }

    /**
     * Generate QR code from text.
     */
    public function generateFromText(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'text' => 'required|string|max:2000',
            'size' => 'nullable|integer|min:100|max:1000',
            'format' => 'nullable|in:png,svg',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $text = $request->text;
        $size = $request->get('size', 300);
        $format = $request->get('format', 'png');

        $qrCode = QrCode::format($format)
            ->size($size)
            ->margin(1)
            ->generate($text);

        $filename = 'qr_text_' . md5($text . time()) . '.' . $format;
        $path = 'qrcodes/' . $filename;

        Storage::disk('public')->put($path, $qrCode);

        return response()->json([
            'success' => true,
            'qr_code_url' => asset('storage/' . $path),
            'path' => $path,
            'message' => 'تم توليد الباركود بنجاح',
        ]);
    }
}
