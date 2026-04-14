# SERS Backend — Laravel API

**الواجهة الخلفية لنظام السجلات التعليمية الذكي**

---

[![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com)
[![AI](https://img.shields.io/badge/AI-Groq_LLaMA_3.3-F55036?style=for-the-badge&logo=meta&logoColor=white)](https://groq.com)

---

## 📋 نظرة عامة

هذا هو الـ Backend الخاص بمشروع **SERS** — يعمل كـ **RESTful API** مبني على **Laravel 12** ويخدم الواجهة الأمامية (Next.js) عبر Sanctum Token Authentication. يستخدم نموذج قاعدة بيانات هجين (Hybrid) يجمع بين MySQL للبيانات العلائقية و Firebase Firestore للبيانات الديناميكية.

---

## 🛠️ التقنيات والمكتبات

| التقنية | الوصف |
|---------|-------|
| **Laravel 12** | إطار العمل الأساسي |
| **PHP 8.2** | لغة البرمجة |
| **MySQL 8.0** | قاعدة البيانات العلائقية |
| **Firebase Firestore** | قاعدة البيانات غير العلائقية (NoSQL) |
| **Laravel Sanctum** | المصادقة (Token-based API Auth) |
| **Stripe PHP** | بوابة الدفع الإلكتروني |
| **DomPDF** | توليد ملفات PDF |
| **TCPDF** | توليد PDF متقدم (دعم العربية) |
| **Meilisearch** | محرك البحث النصي الكامل |
| **kreait/firebase-php** | SDK للتواصل مع Firebase |
| **Groq API (LLaMA 3.3 70B)** | الذكاء الاصطناعي (اقتراحات، تحليل، محادثة) |

---

## 🏗️ هيكل المشروع

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/              # 36 API Controller
│   │   │   │   ├── AIController           # الذكاء الاصطناعي
│   │   │   │   ├── AuthController         # المصادقة
│   │   │   │   ├── TemplateController     # إدارة القوالب
│   │   │   │   ├── OrderController        # الطلبات
│   │   │   │   ├── PaymentController      # الدفع
│   │   │   │   ├── ExportController       # التصدير (PDF/Image/Word)
│   │   │   │   ├── EducationalServiceController # الخدمات التعليمية
│   │   │   │   ├── StatsController        # الإحصائيات
│   │   │   │   ├── UserController         # المستخدمين
│   │   │   │   ├── ReviewController       # التقييمات
│   │   │   │   ├── CategoryController     # التصنيفات
│   │   │   │   ├── CouponController       # كوبونات الخصم
│   │   │   │   ├── ReferralController     # نظام الإحالة
│   │   │   │   ├── VersionController      # إصدارات المستندات
│   │   │   │   ├── AdminSchemaController  # هيكل القوالب (No-Code)
│   │   │   │   ├── AdminReportController  # تقارير الإدارة
│   │   │   │   ├── AdminWithdrawalController # طلبات السحب
│   │   │   │   ├── SettingsController     # إعدادات النظام
│   │   │   │   └── ...                    # (18 متحكم إضافي)
│   │   │   └── InteractivePDFAutomationController
│   │   └── Middleware/
│   ├── Models/                   # 29 Eloquent Model
│   │   ├── User                  # المستخدمين (مع المحفظة والإحالات)
│   │   ├── Template              # القوالب
│   │   ├── TemplateField         # حقول القوالب
│   │   ├── TemplateVariant       # متغيرات القوالب
│   │   ├── Order / OrderItem     # الطلبات
│   │   ├── Category / Section    # التصنيفات والأقسام
│   │   ├── Review                # التقييمات
│   │   ├── Coupon / CouponUsage  # الكوبونات
│   │   ├── Evidence              # الشواهد
│   │   ├── UserTemplateData      # بيانات المستخدم للقوالب
│   │   ├── TemplateDataVersion   # إصدارات البيانات
│   │   ├── AIConversation        # محادثات الذكاء الاصطناعي
│   │   ├── AIRequestLog          # سجل طلبات AI
│   │   ├── Notification          # الإشعارات
│   │   ├── WalletTransaction     # المعاملات المالية
│   │   ├── ContactMessage        # رسائل التواصل
│   │   └── ...
│   └── Services/                 # 14 خدمة منفصلة
│       ├── AIService             # الاتصال بـ Groq API
│       ├── DynamicPromptService  # بناء Prompts ديناميكية
│       ├── FirestoreService      # التعامل مع Firestore
│       ├── PDFGenerationService  # توليد PDF
│       ├── PurchaseService       # منطق الشراء
│       ├── StripePaymentService  # تكامل Stripe
│       ├── WalletService         # المحفظة الرقمية
│       ├── SearchService         # محرك البحث
│       ├── VersionControlService # إدارة الإصدارات
│       └── ...
├── database/
│   ├── migrations/               # 52 Migration
│   └── seeders/
├── routes/
│   ├── api.php                   # جميع مسارات API (255 مسار)
│   └── web.php
└── ...
```

---

## 📡 مسارات الـ API — Routes

### المسارات العامة (Public)
- `POST /api/auth/register` — تسجيل مستخدم
- `POST /api/auth/login` — تسجيل الدخول
- `POST /api/auth/social` — تسجيل دخول اجتماعي (Google OAuth)
- `GET /api/templates` — قائمة القوالب
- `GET /api/templates/featured` — القوالب المميزة
- `GET /api/categories` — التصنيفات
- `GET /api/sections` — الأقسام

### المسارات المحمية (Protected — Sanctum)
- `GET /api/auth/me` — بيانات المستخدم الحالي
- `POST /api/ai/suggest` — اقتراحات ذكية
- `POST /api/ai/chat` — محادثة مع المساعد الذكي
- `POST /api/ai/fill-all` — ملء تلقائي
- `POST /api/ai/generate-performance-report` — تقرير أداء
- `POST /api/ai/recommendations` — توصيات ذكية
- `POST /api/export/pdf` — تصدير PDF
- `POST /api/export/image` — تصدير صورة
- `POST /api/export/word` — تصدير Word
- `GET /api/orders` — طلباتي
- `POST /api/payments/create-intent` — بدء عملية دفع (Stripe)
- `GET /api/user-templates` — سجلاتي المحفوظة
- `GET /api/user-templates/{id}/versions` — سجل الإصدارات
- `GET /api/referrals/stats` — إحصائيات الإحالة
- `GET /api/notifications` — إشعاراتي
- `GET /api/services/{type}` — الخدمات التعليمية (Firestore)

### مسارات المشرف (Admin — Sanctum + is_admin)
- `GET /api/admin/stats/overview` — إحصائيات عامة
- `GET /api/admin/stats/sales` — إحصائيات المبيعات
- `GET /api/admin/users` — إدارة المستخدمين
- `POST /api/admin/templates` — إنشاء قالب
- `PUT /api/admin/templates/{id}/schema` — تعديل هيكل القالب
- `GET /api/admin/orders` — إدارة الطلبات
- `POST /api/admin/coupons` — إنشاء كوبون
- `GET /api/admin/reviews` — إدارة التقييمات
- `POST /api/admin/notifications/broadcast` — إشعار جماعي
- `POST /api/admin/settings/clear-cache` — مسح الكاش
- `GET /api/admin/ai/stats` — إحصائيات الذكاء الاصطناعي
- `GET /api/admin/withdrawals` — طلبات السحب
- `GET /api/admin/reports/*` — التقارير التحليلية

---

## 🗄️ نموذج قاعدة البيانات — Database Model

### MySQL (العلائقية)
| الجدول | الوصف |
|--------|-------|
| `users` | المستخدمين (مع أدوار Admin/User + المحفظة) |
| `templates` | بيانات القوالب الأساسية |
| `template_fields` | حقول القوالب الديناميكية |
| `template_variants` | متغيرات/نسخ القوالب |
| `categories` | التصنيفات |
| `sections` | الأقسام |
| `orders` / `order_items` | الطلبات |
| `reviews` | التقييمات |
| `coupons` / `coupon_usages` | كوبونات الخصم |
| `user_template_data` | بيانات المستخدم المحفوظة للقوالب |
| `template_data_versions` | سجل إصدارات البيانات |
| `notifications` | الإشعارات |
| `wallet_transactions` | المعاملات المالية |
| `evidences` | شواهد الأداء |
| `custom_requests` | الطلبات المخصصة |
| `activity_logs` | سجل النشاطات |
| `ai_conversations` | محادثات الذكاء الاصطناعي |
| `ai_request_logs` | سجل طلبات AI |
| `contact_messages` | رسائل التواصل |
| `referral_earnings` | أرباح الإحالة |
| `withdrawal_requests` | طلبات السحب |
| `system_settings` | إعدادات النظام |
| `sessions` | الجلسات النشطة |

### Firebase Firestore (غير العلائقية)
| المجموعة | الوصف |
|----------|-------|
| Interactive Templates | القوالب التفاعلية (Canvas + Fields JSON) |
| Educational Services | الخدمات التعليمية الديناميكية |
| Dynamic Forms | هياكل النماذج الديناميكية |

---

## ⚙️ التشغيل — Getting Started

### المتطلبات
- PHP >= 8.2
- Composer >= 2.x
- MySQL >= 8.0
- مشروع Firebase مع Firestore مفعّل

### خطوات التشغيل

```bash
# 1. تثبيت المكتبات
composer install

# 2. إعداد ملف البيئة
cp .env.example .env
php artisan key:generate

# 3. تعديل .env (قاعدة البيانات + Firebase + Stripe + Groq)

# 4. تنفيذ الترحيلات
php artisan migrate

# 5. تشغيل السيرفر
php artisan serve --port=8001
```

### متغيرات البيئة المهمة

| المتغير | الوصف |
|---------|-------|
| `DB_DATABASE` | اسم قاعدة البيانات (sers_db) |
| `FIREBASE_PROJECT_ID` | معرف مشروع Firebase |
| `FIREBASE_CREDENTIALS` | مسار ملف Service Account |
| `STRIPE_KEY` / `STRIPE_SECRET` | مفاتيح Stripe |
| `GROQ_API_KEY` | مفتاح Groq API (LLaMA 3.3) |
| `FRONTEND_URL` | رابط الفرونت إند (CORS) |

---

## 🧪 الاختبارات

```bash
php artisan test
```

---

## 👨‍💻 المطوّر

**أنس** — مؤسس ومطور SERS · مشروع تخرج
