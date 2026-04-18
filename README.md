<div align="center">

# SERS — منصة الخدمات التعليمية الذكية

### Smart Educational Services Platform

منصة SaaS رقمية شاملة للمعلمين والإداريين وجميع العاملين في قطاع التعليم — مدعومة بالذكاء الاصطناعي

مشروع تخرج أكاديمي · 2026

---

<p>
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 12" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL 8" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firestore" />
  <img src="https://img.shields.io/badge/Groq_AI-LLaMA_3.3-F55036?style=for-the-badge&logo=meta&logoColor=white" alt="Groq AI" />
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
</p>

</div>

---

## نبذة عن المشروع

يعاني العاملون في القطاع التعليمي من تشتت السجلات بين ملفات ورقية وأنظمة متعددة غير مترابطة، مما يستهلك وقتا كبيرا في الإعداد اليدوي المتكرر للوثائق والتقارير.

**SERS** يحل هذه المشكلة بتوفير منصة مركزية واحدة تجمع بين:
- **متجر قوالب تعليمية** جاهزة للتحميل والتعبئة
- **34 خدمة تعليمية تفاعلية** مقسمة في 6 مجموعات (تحليل، شهادات، شواهد أداء، سجلات، تخطيط، أدوات)
- **ذكاء اصطناعي متكامل** (LLaMA 3.3 70B) يملأ النماذج ويحلل النتائج ويقترح الخطط
- **نظام مالي** (Stripe + محفظة إلكترونية + إحالات)
- دعم كامل **للعربية والإنجليزية** (RTL/LTR) مع وضع داكن/فاتح

> للتفاصيل الأكاديمية الكاملة (البنية التقنية، الخدمات، هيكلة المشروع): راجع [`docs/chapter5-architecture.md`](docs/chapter5-architecture.md)

---

## العمليات الأساسية

| # | العملية | الوصف |
|---|---------|-------|
| 1 | **المصادقة** | إنشاء حساب + تسجيل دخول + إدارة جلسات ذكية |
| 2 | **متجر القوالب** | تصفح + بحث ذكي + معاينة + شراء + تحميل PDF + تقييم |
| 3 | **المحرر التفاعلي** | تعبئة حقول + ملء AI + حفظ تلقائي + تصدير PDF/صورة + توليد جماعي من Excel |
| 4 | **الذكاء الاصطناعي** | 15 خدمة AI: اقتراحات، ملء تلقائي، تحليل نتائج، خطط، شهادات، محادثة ذكية |
| 5 | **الخدمات التعليمية** | 34 خدمة في 6 مجموعات: تحليل، شهادات، شواهد أداء (11 بند)، سجلات، تخطيط، أدوات |
| 6 | **النظام المالي** | Stripe + محفظة إلكترونية + تحويل رصيد + كوبونات خصم |
| 7 | **الإحالة والمكافآت** | كود إحالة + عمولة تلقائية + سحب أرباح |
| 8 | **الطلبات المخصصة** | طلب قالب غير متوفر + تصويت مجتمعي |
| 9 | **لوحة الإدارة** | 15 قسم: قوالب، مستخدمين، طلبات، تقارير، خدمات، كوبونات، إعدادات |
| 10 | **تجربة المستخدم** | ثنائية اللغة + وضع داكن/فاتح + إشعارات + بحث شامل + تجاوب كامل |

---

## التقنيات المستخدمة

| الطبقة | التقنية |
|--------|---------|
| **Backend** | Laravel 12 · PHP 8.2+ · Sanctum · MySQL 8 |
| **Frontend** | Next.js 15 · React 18 · TypeScript · Tailwind CSS · Zustand |
| **قاعدة بيانات هجينة** | MySQL (بيانات علائقية) + Firebase Firestore (بيانات ديناميكية) |
| **ذكاء اصطناعي** | Groq API — LLaMA 3.3 70B Versatile (15 Endpoint) |
| **دفع** | Stripe API + Webhooks |
| **تصدير** | jsPDF + html2canvas + TCPDF (PDF عربي) |
| **بحث** | Fuzzy Search + Meilisearch |
| **UI** | Shadcn UI (Radix) + Framer Motion + Recharts |

---

## التثبيت والتشغيل

### المتطلبات

- PHP 8.2+ · Composer 2.x · Node.js 20+ · MySQL 8.x
- حساب [Firebase](https://console.firebase.google.com/) + [Groq](https://console.groq.com/) (مجاني) + [Stripe](https://dashboard.stripe.com/) (اختياري)

### التشغيل

```bash
# 1. الواجهة الخلفية
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8001

# 2. الواجهة الأمامية
cd frontend
npm install
cp .env.example .env.local
npm run dev

# 3. أو من المجلد الجذر (يشغل الاثنين معا)
npm run dev
```

### Firebase

1. أنشئ مشروعا في Firebase Console
2. فعل Firestore Database
3. ضع ملف Service Account في `backend/storage/app/firebase/service-account.json`
4. انسخ إعدادات Web App الى `frontend/.env.local`

### حسابات تجريبية

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير النظام | `admin@sers.com` | `Sers@2026!Dev` |
| مستخدم عادي | `user@sers.com` | `Sers@2026!Dev` |
| معلم | `teacher@sers.com` | `Sers@2026!Dev` |

---

## متغيرات البيئة

<details>
<summary>Backend (backend/.env)</summary>

```env
APP_URL=http://localhost:8001
FRONTEND_URL=http://localhost:3001
DB_DATABASE=sers_db
DB_USERNAME=root
DB_PASSWORD=your_password
FIREBASE_CREDENTIALS=storage/app/firebase/service-account.json
FIREBASE_PROJECT_ID=your-project-id
GROQ_API_KEY=gsk_your_key_here
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:3001
```
</details>

<details>
<summary>Frontend (frontend/.env.local)</summary>

```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api
NEXT_PUBLIC_APP_NAME=SERS
NEXT_PUBLIC_DEFAULT_LOCALE=ar
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
</details>

---

## المطور

**أنس** — مؤسس ومطور منصة SERS

<div align="center">
  <sub>صنع لخدمة جميع العاملين في قطاع التعليم</sub><br/>
  <code>v1.0.0</code> · <code>2026</code>
</div>
