<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Template;
use App\Models\UserLibrary;
use Illuminate\Support\Facades\Auth;

class PaymentWall
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
                'error_code' => 'AUTH_REQUIRED'
            ], 401);
        }

        // Get template ID from route or request
        $templateId = $request->route('templateId') ?? 
                     $request->route('template') ?? 
                     $request->input('template_id');

        if (!$templateId) {
            return response()->json([
                'success' => false,
                'message' => 'Template ID required',
                'error_code' => 'TEMPLATE_ID_REQUIRED'
            ], 400);
        }

        // Get template
        $template = Template::find($templateId);
        
        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found',
                'error_code' => 'TEMPLATE_NOT_FOUND'
            ], 404);
        }

        // [FIX-9] Reject access to deactivated templates — return 404 to avoid
        // discoverability (403 would expose that the template exists but is blocked)
        if (!$template->is_active) {
            return response()->json([
                'success'    => false,
                'message'    => 'هذا القالب غير متاح حالياً',
                'error_code' => 'TEMPLATE_NOT_FOUND'
            ], 404);
        }

        // Check if template is free
        if ($template->is_free || $template->price <= 0) {
            return $next($request);
        }

        // Check if user has purchased this template via UserLibrary (O(1) single-table lookup)
        if (!UserLibrary::userOwnsTemplate($user->id, $templateId)) {
            return response()->json([
                'success' => false,
                'message' => 'Payment required to access this template',
                'error_code' => 'PAYMENT_REQUIRED',
                'data' => [
                    'template_id' => $templateId,
                    'template_name' => $template->name_ar,
                    'price' => $template->discount_price ?? $template->price,
                    'original_price' => $template->price,
                    'purchase_url' => "/checkout?template={$templateId}"
                ]
            ], 403);
        }

        return $next($request);
    }
}