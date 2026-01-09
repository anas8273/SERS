<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'total' => (float) $this->total,
            'items_count' => $this->items->count(),
            'created_at' => $this->created_at->toISOString(),
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(function ($item) {
                    return [
                        'product_name' => $item->product_name,
                        'price' => (float) $item->price,
                        'type' => $item->product_type,
                        'download_url' => $item->product_type === 'downloadable' ? $item->product->file_path : null,
                    ];
                });
            }),
        ];
    }
}