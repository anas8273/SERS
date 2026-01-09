<?php
// app/Http/Resources/ProductResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'slug' => $this->slug,
            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,
            'price' => (float) $this->price,
            'discount_price' => $this->discount_price ? (float) $this->discount_price : null,
            'effective_price' => (float) $this->effective_price,
            'type' => $this->type,
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name_ar' => $this->category->name_ar,
                    'name_en' => $this->category->name_en,
                    'slug' => $this->category->slug,
                ];
            }),
            'thumbnail_url' => $this->thumbnail_url,
            'preview_images' => $this->preview_images,
            'educational_stage' => $this->educational_stage,
            'subject' => $this->subject,
            'tags' => $this->tags,
            'downloads_count' => $this->downloads_count,
            'average_rating' => (float) $this->average_rating,
            'reviews_count' => $this->reviews_count,
            'is_featured' => $this->is_featured,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}