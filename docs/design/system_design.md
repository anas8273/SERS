# تصميم النظام وخطة التطوير لمشروع SERS

## تاريخ التصميم: 18 يناير 2026

---

## 1. مقدمة

بناءً على تحليل الفجوات والمتطلبات، يهدف هذا المستند إلى وضع تصميم شامل لنظام SERS وخطة تطوير مفصلة لدمج جميع الميزات المطلوبة، وتحويل المشروع إلى منصة متكاملة للخدمات التعليمية.

---

## 2. تصميم قاعدة البيانات (Database Schema)

سيتم إضافة الجداول التالية إلى قاعدة البيانات لدعم الميزات الجديدة. سيتم استخدام UUIDs كمعرفات أساسية لضمان التوافق مع Firestore.

### 2.1. جدول تحليل النتائج (Analyses)

```sql
CREATE TABLE `analyses` (
  `id` char(36) NOT NULL, -- UUID
  `user_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL, -- اسم التحليل (مثال: نتائج الصف الأول ثانوي)
  `data` json NOT NULL, -- بيانات الطلاب والدرجات
  `results` json DEFAULT NULL, -- نتائج التحليل (المتوسط، الانحراف، إلخ)
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `analyses_user_id_foreign` (`user_id`),
  CONSTRAINT `analyses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2. جدول الشهادات (Certificates)

```sql
CREATE TABLE `certificates` (
  `id` char(36) NOT NULL, -- UUID
  `user_id` char(36) NOT NULL,
  `template_id` char(36) NOT NULL, -- قالب الشهادة المستخدم
  `recipient_name` varchar(255) NOT NULL, -- اسم المستلم
  `data` json NOT NULL, -- بيانات الشهادة (تاريخ، سبب، إلخ)
  `file_path` varchar(255) DEFAULT NULL, -- مسار الملف (PDF/Image)
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `certificates_user_id_foreign` (`user_id`),
  KEY `certificates_template_id_foreign` (`template_id`),
  CONSTRAINT `certificates_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `certificates_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.3. جدول الخطط (Plans)

```sql
CREATE TABLE `plans` (
  `id` char(36) NOT NULL, -- UUID
  `user_id` char(36) NOT NULL,
  `type` enum('remedial', 'enrichment', 'weekly') NOT NULL, -- نوع الخطة
  `name` varchar(255) NOT NULL, -- اسم الخطة
  `description` text DEFAULT NULL,
  `content` json NOT NULL, -- محتوى الخطة
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `plans_user_id_foreign` (`user_id`),
  CONSTRAINT `plans_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.4. جدول الإنجازات (Achievements)

```sql
CREATE TABLE `achievements` (
  `id` char(36) NOT NULL, -- UUID
  `user_id` char(36) NOT NULL,
  `type` enum('daily', 'weekly', 'monthly') NOT NULL, -- نوع الإنجاز
  `date` date NOT NULL,
  `title` varchar(255) NOT NULL, -- عنوان الإنجاز
  `description` text NOT NULL,
  `evidence_id` char(36) DEFAULT NULL, -- رابط للشاهد
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `achievements_user_id_foreign` (`user_id`),
  CONSTRAINT `achievements_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.5. جدول تقييم الأداء (Performances)

```sql
CREATE TABLE `performances` (
  `id` char(36) NOT NULL, -- UUID
  `user_id` char(36) NOT NULL, -- المعلم
  `evaluator_id` char(36) NOT NULL, -- المقيم (مدير المدرسة)
  `year` int NOT NULL,
  `data` json NOT NULL, -- بيانات التقييم (العناصر والدرجات)
  `notes` text DEFAULT NULL,
  `status` enum('draft', 'submitted', 'approved') NOT NULL DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `performances_user_id_foreign` (`user_id`),
  KEY `performances_evaluator_id_foreign` (`evaluator_id`),
  CONSTRAINT `performances_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `performances_evaluator_id_foreign` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.6. جدول الاختبارات (Tests)

```sql
CREATE TABLE `tests` (
  `id` char(36) NOT NULL, -- UUID
  `user_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `questions` json NOT NULL, -- الأسئلة والإجابات
  `settings` json DEFAULT NULL, -- إعدادات الاختبار (وقت، إلخ)
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tests_user_id_foreign` (`user_id`),
  CONSTRAINT `tests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.7. جدول المدارس (Schools)

```sql
CREATE TABLE `schools` (
  `id` char(36) NOT NULL, -- UUID
  `name` varchar(255) NOT NULL,
  `owner_id` char(36) NOT NULL, -- مدير المدرسة
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `schools_owner_id_foreign` (`owner_id`),
  CONSTRAINT `schools_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.8. جدول أعضاء المدرسة (School Members)

```sql
CREATE TABLE `school_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role` enum('teacher', 'assistant', 'admin') NOT NULL, -- دور العضو في المدرسة
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `school_members_school_id_user_id_unique` (`school_id`,`user_id`),
  KEY `school_members_user_id_foreign` (`user_id`),
  CONSTRAINT `school_members_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `school_members_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. تصميم الواجهة البرمجية (API Design)

سيتم إضافة نقاط النهاية (Endpoints) التالية إلى `routes/api.php`.

### 3.1. تحليل النتائج (Analysis API)
- `POST /api/analyses` - إنشاء تحليل جديد
- `GET /api/analyses` - الحصول على جميع التحليلات
- `GET /api/analyses/{id}` - الحصول على تحليل محدد
- `PUT /api/analyses/{id}` - تحديث تحليل
- `DELETE /api/analyses/{id}` - حذف تحليل

### 3.2. الشهادات (Certificates API)
- `POST /api/certificates` - إنشاء شهادة جديدة
- `GET /api/certificates` - الحصول على جميع الشهادات
- `GET /api/certificates/{id}` - الحصول على شهادة محددة
- `DELETE /api/certificates/{id}` - حذف شهادة

### 3.3. الخطط (Plans API)
- `POST /api/plans` - إنشاء خطة جديدة
- `GET /api/plans` - الحصول على جميع الخطط
- `GET /api/plans/{id}` - الحصول على خطة محددة
- `PUT /api/plans/{id}` - تحديث خطة
- `DELETE /api/plans/{id}` - حذف خطة

### 3.4. الإنجازات (Achievements API)
- `POST /api/achievements` - إنشاء إنجاز جديد
- `GET /api/achievements` - الحصول على جميع الإنجازات
- `PUT /api/achievements/{id}` - تحديث إنجاز
- `DELETE /api/achievements/{id}` - حذف إنجاز

### 3.5. تقييم الأداء (Performance API)
- `POST /api/performances` - إنشاء تقييم جديد
- `GET /api/performances` - الحصول على جميع التقييمات
- `GET /api/performances/{id}` - الحصول على تقييم محدد
- `PUT /api/performances/{id}` - تحديث تقييم

### 3.6. الاختبارات (Tests API)
- `POST /api/tests` - إنشاء اختبار جديد
- `GET /api/tests` - الحصول على جميع الاختبارات
- `GET /api/tests/{id}` - الحصول على اختبار محدد
- `PUT /api/tests/{id}` - تحديث اختبار
- `DELETE /api/tests/{id}` - حذف اختبار

### 3.7. المدارس (Schools API)
- `POST /api/schools` - إنشاء مدرسة جديدة
- `GET /api/schools` - الحصول على مدارس المستخدم
- `GET /api/schools/{id}` - الحصول على مدرسة محددة
- `PUT /api/schools/{id}` - تحديث مدرسة
- `POST /api/schools/{id}/members` - إضافة عضو جديد
- `DELETE /api/schools/{id}/members/{userId}` - حذف عضو

### 3.8. الذكاء الاصطناعي (AI API) - تحديث
- `POST /api/ai/suggest/analysis` - اقتراح تحليل للنتائج
- `POST /api/ai/suggest/plan` - اقتراح خطة علاجية/إثرائية
- `POST /api/ai/suggest/certificate` - اقتراح نص لشهادة
- `POST /api/ai/chatbot` - محادثة مع المساعد الذكي

---

## 4. تصميم الواجهة الأمامية (Frontend Design)

سيتم إنشاء الصفحات والمكونات التالية في الواجهة الأمامية.

### 4.1. الصفحات الجديدة
- `/dashboard/analysis` - صفحة تحليل النتائج
- `/dashboard/certificates` - صفحة الشهادات
- `/dashboard/plans` - صفحة الخطط التعليمية
- `/dashboard/achievements` - صفحة الإنجازات
- `/dashboard/performance` - صفحة تقييم الأداء
- `/dashboard/tests` - صفحة الاختبارات
- `/dashboard/schools` - صفحة إدارة المدارس

### 4.2. المكونات الجديدة
- `components/analysis/` - مكونات تحليل النتائج (رسوم بيانية، جداول)
- `components/certificates/` - مكونات إنشاء وتصميم الشهادات
- `components/plans/` - مكونات إنشاء وتعديل الخطط
- `components/achievements/` - مكونات عرض وإدارة الإنجازات
- `components/performance/` - مكونات تقييم الأداء
- `components/tests/` - مكونات إنشاء وتعديل الاختبارات
- `components/schools/` - مكونات إدارة المدارس والأعضاء
- `components/ai/` - مكونات الذكاء الاصطناعي (chatbot, suggestions)

---

## 5. خطة التطوير (Development Plan)

| المرحلة | المهمة | المدة التقديرية |
|---|---|---|
| **1. الإعداد** | إنشاء migrations و models للجداول الجديدة | يوم واحد |
| | إنشاء controllers و routes للـ API الجديد | يومان |
| **2. الخدمات الأساسية** | تطوير نظام تحليل النتائج (Backend + Frontend) | 3 أيام |
| | تطوير نظام الشهادات (Backend + Frontend) | 3 أيام |
| **3. الخدمات التعليمية**| تطوير نظام الخطط (Backend + Frontend) | 4 أيام |
| | تطوير نظام الإنجازات (Backend + Frontend) | يومان |
| **4. تقييم الأداء** | تطوير نظام تقييم الأداء (Backend + Frontend) | 3 أيام |
| | تطوير نظام الاختبارات (Backend + Frontend) | 4 أيام |
| **5. الذكاء الاصطناعي** | تطوير المساعد الذكي (Chatbot) | 3 أيام |
| | دمج اقتراحات الذكاء الاصطناعي في جميع الخدمات | يومان |
| **6. نظام المدارس** | تطوير نظام إدارة المدارس والأعضاء | 3 أيام |
| **7. الاختبار والتسليم** | اختبار شامل وإصلاح الأخطاء | 4 أيام |
| | تحديث وثيقة المشروع | يومان |
| | التسليم النهائي | يوم واحد |

**المدة الإجمالية التقديرية: 35 يوم عمل**

---

## 6. التقنيات المقترحة

- **Backend**: Laravel 11, PHP 8.2
- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Database**: MySQL, Firebase (للمصادقة والإشعارات)
- **AI**: OpenAI API (GPT-4)
- **PDF Generation**: Laravel-DomPDF أو Puppeteer
- **Charts**: Chart.js
- **Deployment**: Docker, Nginx

