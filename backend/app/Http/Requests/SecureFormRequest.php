<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

abstract class SecureFormRequest extends FormRequest
{
    /**
     * Sanitize input data before validation
     */
    protected function prepareForValidation(): void
    {
        $this->sanitizeInput();
    }

    /**
     * Sanitize all string inputs
     */
    protected function sanitizeInput(): void
    {
        $input = $this->all();
        $sanitized = $this->sanitizeArray($input);
        $this->replace($sanitized);
    }

    /**
     * Recursively sanitize array values
     */
    protected function sanitizeArray(array $data): array
    {
        $result = [];

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $result[$key] = $this->sanitizeArray($value);
            } elseif (is_string($value)) {
                $result[$key] = $this->sanitizeString($value);
            } else {
                $result[$key] = $value;
            }
        }

        return $result;
    }

    /**
     * Sanitize a single string value
     */
    protected function sanitizeString(string $value): string
    {
        // Remove null bytes
        $value = str_replace(chr(0), '', $value);

        // Remove control characters except newlines and tabs
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);

        // Trim whitespace
        $value = trim($value);

        return $value;
    }

    /**
     * Get common validation rules
     */
    protected function commonRules(): array
    {
        return [
            'email' => ['email:rfc,dns', 'max:255'],
            'password' => ['string', 'min:8', 'max:128'],
            'phone' => ['regex:/^(05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/'],
            'url' => ['url', 'max:2048'],
            'text' => ['string', 'max:65535'],
            'name' => ['string', 'max:255', 'regex:/^[\p{L}\p{N}\s\-\.]+$/u'],
        ];
    }

    /**
     * Get custom error messages in Arabic
     */
    public function messages(): array
    {
        return [
            'required' => 'حقل :attribute مطلوب.',
            'string' => 'حقل :attribute يجب أن يكون نصاً.',
            'email' => 'حقل :attribute يجب أن يكون بريداً إلكترونياً صالحاً.',
            'min' => 'حقل :attribute يجب أن يكون على الأقل :min حرفاً.',
            'max' => 'حقل :attribute يجب ألا يتجاوز :max حرفاً.',
            'unique' => ':attribute مستخدم بالفعل.',
            'confirmed' => 'تأكيد :attribute غير متطابق.',
            'regex' => 'صيغة :attribute غير صالحة.',
            'url' => 'حقل :attribute يجب أن يكون رابطاً صالحاً.',
            'image' => 'حقل :attribute يجب أن يكون صورة.',
            'mimes' => 'حقل :attribute يجب أن يكون من نوع: :values.',
            'size' => 'حقل :attribute يجب أن يكون :size.',
            'between' => 'حقل :attribute يجب أن يكون بين :min و :max.',
            'in' => 'القيمة المحددة لـ :attribute غير صالحة.',
            'exists' => ':attribute المحدد غير موجود.',
            'date' => 'حقل :attribute يجب أن يكون تاريخاً صالحاً.',
            'numeric' => 'حقل :attribute يجب أن يكون رقماً.',
            'integer' => 'حقل :attribute يجب أن يكون عدداً صحيحاً.',
            'array' => 'حقل :attribute يجب أن يكون مصفوفة.',
            'boolean' => 'حقل :attribute يجب أن يكون صح أو خطأ.',
        ];
    }

    /**
     * Get custom attribute names in Arabic
     */
    public function attributes(): array
    {
        return [
            'email' => 'البريد الإلكتروني',
            'password' => 'كلمة المرور',
            'name' => 'الاسم',
            'phone' => 'رقم الهاتف',
            'title' => 'العنوان',
            'description' => 'الوصف',
            'content' => 'المحتوى',
            'image' => 'الصورة',
            'file' => 'الملف',
            'category_id' => 'التصنيف',
            'price' => 'السعر',
            'quantity' => 'الكمية',
            'date' => 'التاريخ',
            'time' => 'الوقت',
            'status' => 'الحالة',
            'type' => 'النوع',
            'message' => 'الرسالة',
            'subject' => 'الموضوع',
            'address' => 'العنوان',
            'city' => 'المدينة',
            'country' => 'الدولة',
        ];
    }
}
