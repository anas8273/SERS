<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * OrderResource
 * 
 * API Resource for Order model.
 * Updated to use templates instead of products.
 */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'subtotal' => (float) $this->subtotal,
            'discount' => (float) $this->discount,
            'total' => (float) $this->total,
            'items_count' => $this->items->count(),
            'payment_method' => $this->payment_method,
            'paid_at' => $this->paid_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ];
            }),
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'template_id' => $item->template_id,
                        'template_name' => $item->template_name,
                        'price' => (float) $item->price,
                        'type' => $item->template_type,
                        'template' => $item->relationLoaded('template') && $item->template ? [
                            'id' => $item->template->id,
                            'name_ar' => $item->template->name_ar,
                            'name_en' => $item->template->name_en,
                            'slug' => $item->template->slug,
                            'thumbnail_url' => $item->template->thumbnail_url,
                            'type' => $item->template->type,
                        ] : null,
                    ];
                });
            }),
        ];
    }
}
