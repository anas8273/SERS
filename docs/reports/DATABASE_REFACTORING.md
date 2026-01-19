# إصلاحات قاعدة البيانات - SERS

## ملخص التغييرات

تم تنفيذ إعادة هيكلة شاملة لقاعدة البيانات لتوحيد مفهوم "القوالب" (Templates) بدلاً من "المنتجات" (Products)، مع تطبيق UUID كمعرفات أساسية لجميع الجداول.

---

## التغييرات الرئيسية

### 1. توحيد المصطلحات

| القديم | الجديد |
|--------|--------|
| `products` | `templates` |
| `product_id` | `template_id` |
| `downloadable` / `interactive` | `ready` / `interactive` |

### 2. استخدام UUID

تم تحويل جميع الجداول لاستخدام UUID بدلاً من Auto-increment IDs:

- `sections`
- `categories`
- `templates`
- `template_variants`
- `template_fields`
- `user_template_data`
- `template_data_versions`
- `evidences`
- `orders`
- `order_items`
- `reviews`
- `user_libraries`
- `wishlists`
- `favorite_templates`

### 3. هيكل الجداول الجديد

#### جدول `sections` (الأقسام الرئيسية)
```
- id (UUID, PK)
- name_ar, name_en
- slug (unique)
- description_ar, description_en
- icon
- sort_order
- is_active
```

#### جدول `categories` (التصنيفات)
```
- id (UUID, PK)
- section_id (UUID, FK → sections)
- name_ar, name_en
- slug (unique)
- description_ar, description_en
- icon
- sort_order
- is_active
```

#### جدول `templates` (القوالب)
```
- id (UUID, PK)
- category_id (UUID, FK → categories)
- name_ar, name_en
- slug (unique)
- description_ar, description_en
- price, discount_price
- type: 'ready' | 'interactive'
- thumbnail_url, preview_images
- ready_file (للقوالب الجاهزة)
- educational_stage, subject, tags
- is_featured, is_active
```

#### جدول `template_variants` (متغيرات القالب)
```
- id (UUID, PK)
- template_id (UUID, FK → templates)
- name_ar, name_en
- color_code, preview_image
- is_default
- sort_order
```

#### جدول `template_fields` (حقول القالب التفاعلي)
```
- id (UUID, PK)
- variant_id (UUID, FK → template_variants)
- name, type
- label_ar, label_en
- placeholder_ar, placeholder_en
- options (JSON)
- is_required
- validation rules
- AI settings
- styling properties
```

#### جدول `user_template_data` (بيانات المستخدم)
```
- id (UUID, PK)
- user_id (UUID, FK → users)
- template_id (UUID, FK → templates)
- variant_id (UUID, FK → template_variants, nullable)
- title
- data (JSON)
- status: 'draft' | 'completed' | 'exported'
- exported_file, exported_at
```

#### جدول `template_data_versions` (إصدارات البيانات)
```
- id (UUID, PK)
- user_template_data_id (UUID, FK)
- version_number
- data (JSON)
- note
- change_type: 'manual' | 'auto_save' | 'ai_fill'
```

#### جدول `evidences` (الشواهد)
```
- id (UUID, PK)
- user_id (UUID, FK → users)
- user_template_data_id (UUID, FK, required)
- name, description
- type: 'image' | 'file' | 'link' | 'qrcode' | 'barcode'
- file_path, file_url, link, qr_code, barcode
- sort_order, is_active
```

---

## تحديثات الكود

### Backend (Laravel)

#### Models المحدثة:
- `Template.php` - استخدام UUID trait وعلاقات جديدة
- `TemplateVariant.php` - ربط بالقالب والحقول
- `TemplateField.php` - ربط بالمتغير
- `UserTemplateData.php` - ربط بالقالب والمتغير
- `TemplateDataVersion.php` - ربط ببيانات المستخدم
- `Evidence.php` - ربط إلزامي ببيانات المستخدم
- `OrderItem.php` - استخدام template_id بدلاً من product_id
- `Review.php` - استخدام template_id
- `UserLibrary.php` - استخدام template_id
- `Wishlist.php` - استخدام template_id
- `FavoriteTemplate.php` - تصحيح العلاقات

#### Controllers المحدثة:
- `TemplateController.php` - تحديث الاستعلامات
- `OrderController.php` - استخدام template بدلاً من product
- `ReviewController.php` - تحديث العلاقات
- `WishlistController.php` - استخدام template_id
- `DownloadController.php` - تحديث للقوالب الجاهزة
- `StatsController.php` - تحديث الإحصائيات

#### Services المحدثة:
- `PurchaseService.php` - استخدام Template بدلاً من Product

#### Resources المحدثة:
- `OrderResource.php` - تضمين بيانات القالب

### Frontend (Next.js)

#### Types المحدثة:
- `types/index.ts` - إضافة Template, TemplateVariant, TemplateField, etc.

#### API Client:
- `lib/api.ts` - تحديث endpoints لاستخدام templates

#### Stores:
- `cartStore.ts` - استخدام templateId بدلاً من productId
- `wishlistStore.ts` - استخدام templateIds

#### Components:
- `WishlistButton.tsx` - استخدام templateId
- صفحات marketplace, cart, checkout - تحديث للقوالب

---

## الملفات المحذوفة

### Backend:
- `app/Models/Product.php`
- `app/Models/InteractiveTemplate.php`
- `app/Http/Controllers/Api/ProductController.php`
- `app/Http/Controllers/ProductController.php`
- `app/Http/Resources/ProductResource.php`
- `app/Http/Resources/ProductCollection.php`
- Migrations القديمة المكررة

---

## التوافق العكسي

تم إضافة aliases في الواجهة الأمامية للحفاظ على التوافق:
- `Product` = `Template`
- `ProductFormData` = `TemplateFormData`
- `getProducts()` → `getTemplates()`
- `getProduct()` → `getTemplate()`

---

## خطوات التطبيق

1. **تشغيل Migrations:**
   ```bash
   cd backend
   php artisan migrate:fresh --seed
   ```

2. **تحديث الـ Cache:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   ```

3. **تثبيت Frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

---

## ملاحظات مهمة

1. **UUID Performance:** تم استخدام `ordered UUID` لتحسين أداء الفهرسة
2. **Soft Deletes:** يمكن إضافتها لاحقاً للجداول الرئيسية
3. **Indexes:** تم إضافة فهارس على الأعمدة المستخدمة في البحث والفلترة
4. **Foreign Keys:** جميع العلاقات محمية بـ CASCADE للحذف

---

*تاريخ التحديث: 14 يناير 2026*
