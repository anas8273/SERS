<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_ar',
        'name_en',
        'slug',
        'icon',
        'order',
    ];

    /**
     * Get the categories for the section.
     */
    public function categories()
    {
        return $this->hasMany(Category::class)->orderBy('order');
    }

    /**
     * Get all templates through categories.
     */
    public function templates()
    {
        return $this->hasManyThrough(Template::class, Category::class);
    }
}
