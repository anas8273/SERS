<div align="center">
  <img src="https://img.shields.io/badge/SERS-Smart_Educational_Records_System-006C35?style=for-the-badge&logo=education" alt="SERS Logo" />
  
  <h1>نظام السجلات التعليمية الذكي (SERS)</h1>
  
  <p>
    <strong>منصة تعليمية متكاملة لخدمة جميع العاملين في القطاع التعليمي</strong>
  </p>

  <p>
    <a href="#-المميزات-الرئيسية">المميزات</a> •
    <a href="#-الخدمات-التعليمية">الخدمات</a> •
    <a href="#-البنية-التقنية">التقنيات</a> •
    <a href="#-التثبيت-والتشغيل">التشغيل</a> •
    <a href="#-الأمان-والحماية">الأمان</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=flat-square&logo=laravel" alt="Laravel" />
    <img src="https://img.shields.io/badge/Next.js-15.x-000000?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat-square&logo=mysql" alt="MySQL" />
    <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase" alt="Firebase" />
    <img src="https://img.shields.io/badge/AI-Groq_LLaMA_3.3-F55036?style=flat-square&logo=meta" alt="Groq AI" />
    <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe" alt="Stripe" />
  </p>
</div>

---

## 🎯 نبذة عن المشروع

**SERS (Smart Educational Records System)** هو مشروع تخرج أكاديمي متكامل يهدف إلى رقمنة وأتمتة العمليات الإدارية والتعليمية في المدارس. يحل النظام مشكلة التشتت في السجلات الورقية والأنظمة المتعددة من خلال توفير منصة مركزية واحدة تجمع بين متجر القوالب التعليمية، الخدمات الإدارية، وأدوات الذكاء الاصطناعي.

تم تصميم النظام ليتوافق مع متطلبات البيئة التعليمية، مع دعم كامل للغتين العربية والإنجليزية (RTL/LTR).

---

## ✨ المميزات الرئيسية

### 🏪 متجر القوالب التعليمية
- **7+ فئات وظيفية:** (مدير مدرسة، وكيل، موجه طلابي، رائد نشاط، معلم، إداري، مشرف تربوي، وأي مستخدم عام).
- **13 قسم محتوى:** (سجلات، خطط، تقارير، نماذج، شهادات، إلخ).
- **محرر تفاعلي ذكي:** محرر قوالب متقدم يدعم المتغيرات الديناميكية (Dynamic Variables) مع نظام حفظ تلقائي وإدارة الإصدارات.
- **توليد جماعي:** إمكانية رفع ملفات Excel لتوليد مئات الشهادات أو النماذج بضغطة زر.

### 🤖 المساعد الذكي (سيرس)
- مدعوم بنموذج **LLaMA 3.3 70B Versatile** عبر Groq API.
- **10 خدمات ذكاء اصطناعي متخصصة:**
  - تحليل نتائج الطلاب واقتراح خطط علاجية.
  - توليد خطط الدروس الأسبوعية.
  - صياغة خطابات رسمية للإدارة وأولياء الأمور.
  - بناء بنوك أسئلة وأوراق عمل مخصصة.

### 📋 الخدمات التعليمية المتكاملة
يضم النظام **13 خدمة تعليمية** متكاملة تشمل:
1. **سجل المتابعة اليومي:** تتبع الحضور والمشاركة.
2. **بنوك الأسئلة:** إنشاء وإدارة الأسئلة.
3. **الاختبارات:** تصميم اختبارات إلكترونية وورقية.
4. **أوراق العمل:** نماذج تفاعلية للطلاب.
5. **التحليلات:** رسوم بيانية وإحصائيات متقدمة.
6. **ملف الإنجاز (Portfolio):** توثيق أعمال المعلم والطالب.
7. **المنهج الدراسي:** تخطيط وتوزيع المناهج.
8. **الشهادات:** تصميم وإصدار الشهادات.
9. **الخطط:** الخطط العلاجية والإثرائية.
10. **الإنجازات:** تتبع إنجازات المدرسة.
11. **التوزيعات:** توزيع المهام والجدول المدرسي.
12. **شواهد العمل:** توثيق الأداء.
13. **الإنتاج المعرفي:** نشر الأبحاث والمقالات.

---

## 🏗 البنية التقنية (Architecture)

يعتمد المشروع على بنية **Hybrid Decoupled SPA**، حيث يتم فصل الواجهة الأمامية عن الخلفية تماماً، مع استخدام قاعدة بيانات هجينة لتحقيق أقصى أداء.

### 🔙 الواجهة الخلفية (Backend)
- **الإطار:** Laravel 12 (PHP 8.2+)
- **قاعدة البيانات العلائقية:** MySQL (28 جدول، 52 Migration) لإدارة المستخدمين، المعاملات المالية، والإعدادات.
- **قاعدة البيانات غير العلائقية:** Firebase Firestore لتخزين القوالب، السجلات الديناميكية، والمحتوى غير المهيكل.
- **المصادقة:** Laravel Sanctum (SPA Authentication).
- **الخدمات:** 14 خدمة (Services) مفصولة منطقياً (AI, Payment, Export, Analytics, etc).

### 🔜 الواجهة الأمامية (Frontend)
- **الإطار:** Next.js 15 (App Router) + React 18
- **اللغة:** TypeScript
- **إدارة الحالة:** Zustand (مع Persist للمصادقة والسلة)
- **التصميم:** Tailwind CSS + Radix UI + Shadcn UI
- **جلب البيانات:** Fetch API مع طبقة Cache مخصصة (useApiCache Hook).
- **التصدير:** html2canvas + jsPDF لتصدير المستندات بجودة عالية.

---

## 🛡️ الأمان والحماية (Security)

تم تطبيق **9 طبقات من الأمان (Defense in Depth)** لضمان حماية بيانات المستخدمين:

1. **المصادقة والتفويض (Auth & Authz):** نظام صلاحيات دقيق (Role-Based Access Control).
2. **حماية المسارات (Route Protection):** Middleware في Next.js لمنع الوصول غير المصرح به.
3. **تنقية المدخلات (Sanitization):** استخدام Zod في Frontend و Form Requests في Backend.
4. **منع الهجمات (XSS & CSRF):** حماية مدمجة في Laravel و React.
5. **تحديد المعدل (Rate Limiting):** حماية مسارات API الحساسة (مثل تسجيل الدخول والذكاء الاصطناعي) من هجمات Brute Force.
6. **أمان المعاملات المالية:** تكامل آمن مع Stripe باستخدام Webhooks والتحقق من التوقيع.
7. **حماية الجلسات:** تخزين آمن للـ Tokens وإدارة الجلسات.
8. **إخفاء الأخطاء (Error Handling):** عدم عرض تفاصيل الأخطاء التقنية للمستخدم النهائي.
9. **حماية الملفات:** منع الوصول المباشر للملفات المرفوعة.

---

## 🚀 التثبيت والتشغيل (Installation)

### المتطلبات الأساسية
- PHP 8.2 أو أحدث
- Composer 2.x
- Node.js 20.x أو أحدث
- npm 10.x أو أحدث
- MySQL 8.x
- حساب Firebase (لـ Firestore)
- حساب Groq (لخدمات الذكاء الاصطناعي)

### 1. إعداد الواجهة الخلفية (Backend)
```bash
cd backend

# تثبيت الحزم
composer install

# إعداد متغيرات البيئة
cp .env.example .env
php artisan key:generate

# إعداد قاعدة البيانات (تأكد من إنشاء قاعدة بيانات sers_db في MySQL أولاً)
php artisan migrate --seed

# تشغيل الخادم
php artisan serve --port=8001
```

### 2. إعداد الواجهة الأمامية (Frontend)
```bash
cd frontend

# تثبيت الحزم
npm install

# إعداد متغيرات البيئة
cp .env.example .env.local

# تشغيل خادم التطوير
npm run dev
```

### 3. إعداد Firebase
1. قم بإنشاء مشروع في [Firebase Console](https://console.firebase.google.com/).
2. قم بتفعيل **Firestore Database**.
3. استخرج ملف `service-account.json` وضعه في `backend/storage/app/firebase/`.
4. انسخ إعدادات الـ Web App وضعها في `frontend/.env.local`.

---

## 📂 هيكلة المشروع (Project Structure)

```
SERS/
├── backend/                          # ── الواجهة الخلفية (Laravel 12) ──
│   ├── app/
│   │   ├── Console/
│   │   │   └── Commands/             # أوامر Artisan مخصصة (TestAIEngine)
│   │   ├── Events/                   # أحداث النظام (Events)
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api/              # ★ 36 متحكم API ★
│   │   │   │       ├── AIController.php              # خدمات الذكاء الاصطناعي (Chat, Recommendations, Analysis)
│   │   │   │       ├── AuthController.php             # المصادقة (تسجيل/دخول/Google OAuth)
│   │   │   │       ├── TemplateController.php         # إدارة القوالب (CRUD + بحث)
│   │   │   │       ├── OrderController.php            # إدارة الطلبات والمشتريات
│   │   │   │       ├── PaymentController.php          # الدفع (Stripe + المحفظة)
│   │   │   │       ├── EducationalServiceController.php  # الخدمات التعليمية (13 خدمة)
│   │   │   │       ├── ExportController.php           # تصدير PDF/Excel
│   │   │   │       ├── AdminReportController.php      # تقارير الإدارة
│   │   │   │       ├── UserController.php             # إدارة المستخدمين
│   │   │   │       ├── ReviewController.php           # التقييمات والمراجعات
│   │   │   │       ├── CouponController.php           # أكواد الخصم
│   │   │   │       ├── ReferralController.php         # نظام الإحالة
│   │   │   │       ├── VersionController.php          # إدارة الإصدارات
│   │   │   │       ├── StatsController.php            # الإحصائيات
│   │   │   │       └── ...                            # (22 متحكم إضافي)
│   │   │   └── Middleware/            # طبقات الحماية الوسيطة
│   │   ├── Jobs/                      # المهام المجدولة (Queue Jobs)
│   │   ├── Mail/                      # قوالب البريد الإلكتروني
│   │   ├── Models/                    # ★ 29 نموذج بيانات (Eloquent Models) ★
│   │   │   ├── User.php               # المستخدم (مع المحفظة والإحالات)
│   │   │   ├── Template.php           # القالب التعليمي
│   │   │   ├── Order.php              # الطلب (مع العناصر والكوبونات)
│   │   │   ├── Section.php            # أقسام المتجر
│   │   │   ├── Category.php           # التصنيفات
│   │   │   ├── Review.php             # التقييمات
│   │   │   ├── AIConversation.php     # محادثات الذكاء الاصطناعي
│   │   │   ├── WalletTransaction.php  # معاملات المحفظة
│   │   │   └── ...                    # (21 نموذج إضافي)
│   │   ├── Policies/                  # سياسات الصلاحيات (Authorization Policies)
│   │   ├── Providers/                 # مزودي الخدمات (Service Providers)
│   │   ├── Scopes/                    # نطاقات الاستعلام (Query Scopes)
│   │   ├── Services/                  # ★ 14 خدمة منفصلة (Business Logic) ★
│   │   │   ├── AIService.php                    # الاتصال بـ Groq API (LLaMA 3.3)
│   │   │   ├── DynamicPromptService.php         # بناء Prompts ديناميكية
│   │   │   ├── FirestoreService.php             # التعامل مع Firebase Firestore
│   │   │   ├── UniversalAnalysisService.php     # التحليل الشامل للبيانات
│   │   │   ├── PDFGenerationService.php         # توليد ملفات PDF
│   │   │   ├── InteractivePDFAutomationService.php  # أتمتة PDF التفاعلي
│   │   │   ├── PurchaseService.php              # منطق الشراء والمحفظة
│   │   │   ├── StripePaymentService.php         # تكامل Stripe
│   │   │   ├── WalletService.php                # إدارة المحفظة الرقمية
│   │   │   ├── SearchService.php                # محرك البحث
│   │   │   ├── VersionControlService.php        # إدارة إصدارات القوالب
│   │   │   ├── ReferralService.php              # نظام الإحالة
│   │   │   ├── StatsCacheService.php            # تخزين مؤقت للإحصائيات
│   │   │   └── MeilisearchService.php           # بحث متقدم (Meilisearch)
│   │   └── Traits/                    # سمات مشتركة (Reusable Traits)
│   ├── config/                        # إعدادات Laravel (database, services, auth, etc.)
│   ├── database/
│   │   ├── migrations/                # ★ 52 ملف Migration ★
│   │   ├── seeders/                   # بذور البيانات الأولية
│   │   └── factories/                 # مصانع البيانات للاختبار
│   ├── routes/
│   │   ├── api.php                    # ★ جميع مسارات الـ API (281 مسار) ★
│   │   └── web.php                    # مسارات الويب
│   ├── storage/
│   │   └── app/firebase/              # بيانات اعتماد Firebase (مُتجاهل في Git)
│   ├── .env.example                   # نموذج متغيرات البيئة
│   ├── Dockerfile                     # ملف Docker للنشر
│   └── composer.json                  # تبعيات PHP
│
├── frontend/                          # ── الواجهة الأمامية (Next.js 15 + React 18) ──
│   ├── src/
│   │   ├── app/                       # ★ App Router — 103 صفحة ★
│   │   │   ├── (admin)/admin/         # لوحة الإدارة (17 قسم)
│   │   │   │   ├── page.tsx           # لوحة التحكم الرئيسية
│   │   │   │   ├── templates/         # إدارة القوالب (إضافة/تعديل/حذف)
│   │   │   │   ├── orders/            # إدارة الطلبات
│   │   │   │   ├── users/             # إدارة المستخدمين
│   │   │   │   ├── sections/          # إدارة الأقسام
│   │   │   │   ├── categories/        # إدارة التصنيفات
│   │   │   │   ├── reports/           # التقارير التحليلية
│   │   │   │   ├── ai-management/     # إدارة الذكاء الاصطناعي
│   │   │   │   ├── educational-services/  # الخدمات التعليمية (12 خدمة فرعية)
│   │   │   │   ├── coupons/           # أكواد الخصم
│   │   │   │   ├── reviews/           # التقييمات
│   │   │   │   ├── withdrawals/       # طلبات السحب
│   │   │   │   ├── settings/          # إعدادات النظام
│   │   │   │   └── ...                # (activity-logs, contact-messages, etc.)
│   │   │   ├── (dashboard)/           # لوحة المستخدم (22 صفحة)
│   │   │   │   ├── dashboard/         # الصفحة الرئيسية للمستخدم
│   │   │   │   ├── ai-assistant/      # المساعد الذكي (Chat)
│   │   │   │   ├── my-library/        # مكتبة المستندات
│   │   │   │   ├── orders/            # طلباتي
│   │   │   │   ├── achievements/      # الإنجازات
│   │   │   │   ├── portfolio/         # ملف الإنجاز الرقمي
│   │   │   │   ├── distributions/     # التوزيعات والتخطيط
│   │   │   │   ├── plans/             # الخطط التعليمية
│   │   │   │   ├── certificates/      # الشهادات
│   │   │   │   ├── question-bank/     # بنك الأسئلة
│   │   │   │   ├── tests/             # الاختبارات
│   │   │   │   ├── worksheets/        # أوراق العمل
│   │   │   │   ├── follow-up-log/     # سجل المتابعة اليومي
│   │   │   │   ├── work-evidence/     # شواهد الأداء
│   │   │   │   ├── knowledge-production/ # الإنتاج المعرفي
│   │   │   │   ├── batch-generate/    # التوليد الجماعي
│   │   │   │   ├── analyses/          # تحليل النتائج
│   │   │   │   ├── settings/          # إعدادات الحساب
│   │   │   │   └── wishlist/          # قائمة المفضلة
│   │   │   ├── (auth)/                # صفحات المصادقة (login, register, forgot-password)
│   │   │   ├── marketplace/           # متجر القوالب + صفحات المنتجات
│   │   │   ├── services/              # صفحة الخدمات التعليمية
│   │   │   ├── editor/                # محرر القوالب التفاعلي
│   │   │   ├── cart/                   # سلة التسوق
│   │   │   ├── checkout/              # صفحة الدفع
│   │   │   ├── about/                 # من نحن
│   │   │   ├── contact/               # تواصل معنا
│   │   │   ├── faq/                   # الأسئلة الشائعة
│   │   │   ├── privacy/               # سياسة الخصوصية
│   │   │   ├── terms/                 # الشروط والأحكام
│   │   │   ├── api/ai/               # مسار API داخلي (Next.js Route Handler)
│   │   │   ├── globals.css            # الأنماط العامة
│   │   │   ├── layout.tsx             # التخطيط الرئيسي (Root Layout)
│   │   │   └── page.tsx               # الصفحة الرئيسية
│   │   ├── components/                # ★ +130 مكون React ★
│   │   │   ├── admin/                 # مكونات لوحة الإدارة
│   │   │   ├── editor/                # مكونات المحرر التفاعلي
│   │   │   ├── marketplace/           # مكونات المتجر
│   │   │   ├── home/                  # مكونات الصفحة الرئيسية
│   │   │   ├── auth/                  # مكونات المصادقة
│   │   │   ├── cart/                  # مكونات سلة التسوق
│   │   │   ├── analytics/             # مكونات الرسوم البيانية
│   │   │   ├── services/              # مكونات الخدمات التعليمية
│   │   │   ├── layout/                # (Navbar, Footer, Sidebar)
│   │   │   ├── shared/                # مكونات مشتركة
│   │   │   ├── ui/                    # مكتبة Shadcn UI المخصصة
│   │   │   └── ...                    # (export, referral, reviews, search, etc.)
│   │   ├── hooks/                     # ★ 11 Hook مخصص ★
│   │   │   ├── useAuth.ts             # إدارة المصادقة
│   │   │   ├── useMarketplace.ts      # منطق المتجر والفلترة
│   │   │   ├── useRecommendations.ts  # محرك التوصيات الذكية
│   │   │   ├── useApiCache.ts         # تخزين مؤقت لطلبات API
│   │   │   ├── useLocalDraft.ts       # حفظ المسودات محلياً
│   │   │   ├── useLocalizedTypes.ts   # أنواع البيانات المترجمة
│   │   │   └── ...                    # (useDebounce, useNetworkStatus, etc.)
│   │   ├── stores/                    # ★ إدارة الحالة (Zustand) ★
│   │   │   ├── authStore.ts           # حالة المصادقة (مع Persist)
│   │   │   ├── cartStore.ts           # حالة سلة التسوق (مع Persist)
│   │   │   ├── wishlistStore.ts       # حالة المفضلة
│   │   │   └── cartDrawerStore.ts     # حالة درج السلة
│   │   ├── lib/                       # ★ 20 وحدة مساعدة (Utilities) ★
│   │   │   ├── api.ts                 # طبقة الاتصال بالـ Backend API
│   │   │   ├── firebase.ts            # إعداد Firebase SDK
│   │   │   ├── firestore-service.ts   # خدمات Firestore (CRUD)
│   │   │   ├── pdf-export.ts          # تصدير PDF (html2canvas + jsPDF)
│   │   │   ├── security.ts            # أمان الجلسات والمدخلات
│   │   │   ├── session-manager.ts     # إدارة الجلسات (JWT)
│   │   │   ├── cache.ts               # نظام التخزين المؤقت
│   │   │   ├── fuzzy-search.ts        # بحث ذكي (Fuzzy Search)
│   │   │   ├── ai-context.ts          # سياق المساعد الذكي
│   │   │   ├── default-services.ts    # بيانات الخدمات الافتراضية
│   │   │   ├── export-utils.ts        # أدوات التصدير
│   │   │   └── ...                    # (utils, schemas, logger, etc.)
│   │   ├── i18n/
│   │   │   └── translations.ts        # ★ +1,500 مفتاح ترجمة (عربي/إنجليزي) ★
│   │   ├── types/                     # تعريفات TypeScript
│   │   └── middleware.ts              # حماية المسارات (Route Protection)
│   ├── public/
│   │   └── images/                    # الصور والأيقونات
│   ├── .env.example                   # نموذج متغيرات البيئة
│   ├── next.config.ts                 # إعدادات Next.js
│   ├── tailwind.config.ts             # إعدادات Tailwind CSS
│   ├── tsconfig.json                  # إعدادات TypeScript
│   └── package.json                   # تبعيات Node.js
│
├── docs/                              # وثائق المشروع
├── .github/                           # إعدادات GitHub (CI/CD)
├── .gitignore                         # ملفات Git المتجاهلة
├── README.md                          # توثيق المشروع (هذا الملف)
└── package.json                       # إعدادات الجذر (Root)
```

---

## 📊 إحصائيات المشروع

| المقياس | القيمة |
|---------|--------|
| **إجمالي الملفات** | +680 ملف (بدون التبعيات) |
| **إجمالي الأسطر البرمجية** | +105,000 سطر |
| **مسارات API (Backend)** | 255 مسار (Endpoint) |
| **متحكمات API** | 36 متحكم (Controller) |
| **نماذج البيانات** | 29 نموذج (Model) |
| **خدمات الأعمال** | 14 خدمة (Service) |
| **ملفات Migration** | 52 ملف |
| **مكونات React** | +130 مكون |
| **Hooks مخصصة** | 11 Hook |
| **صفحات التطبيق** | 103 صفحة |
| **مفاتيح الترجمة** | +1,380 مفتاح (عربي/إنجليزي) |

---

## 👨‍💻 المؤلف

**أنس** — مؤسس ومطور SERS · مشروع تخرج

<p align="center">
  <em>صُنع بـ ❤️ لخدمة جميع العاملين في القطاع التعليمي</em><br/>
  <code>v1.0.0</code> · <code>2026</code>
</p>
