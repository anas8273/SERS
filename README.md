<div align="center">
  <img src="https://via.placeholder.com/1200x400/2563EB/FFFFFF?text=SERS+-+Smart+Educational+Records+System" alt="SERS Banner" style="border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

  # SERS - Smart Educational Records System
  ### نظام السجلات التعليمية الذكي

  [![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
  [![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
  [![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)

  <p align="center">
    <b>منصة تعليمية متكاملة مدعومة بالذكاء الاصطناعي لإدارة السجلات والقوالب التعليمية</b>
    <br />
    مصممة لمستقبل التعليم في المملكة العربية السعودية
  </p>
</div>

---

## 📋 جدول المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [المميزات الرئيسية](#-المميزات-الرئيسية)
- [البنية التقنية](#-البنية-التقنية)
- [دليل التثبيت](#-دليل-التثبيت)
- [متغيرات البيئة](#-متغيرات-البيئة)
- [بيانات الاختبار](#-بيانات-الاختبار)
- [نقاط النهاية API](#-نقاط-النهاية-api)
- [المساهمة](#-المساهمة)

---

## 🎯 نظرة عامة

**SERS** هو نظام متكامل يمكّن المعلمين والمعلمات من إنشاء سجلات تعليمية احترافية بسهولة وسرعة. يجمع النظام بين:

- **قوالب جاهزة** للتحميل المباشر
- **قوالب تفاعلية** قابلة للتخصيص
- **ذكاء اصطناعي** لاقتراحات ذكية
- **متجر متكامل** مع نظام دفع

---

## 🚀 المميزات الرئيسية

### 🧠 ذكاء اصطناعي متقدم
| الميزة | الوصف |
|--------|-------|
| **اقتراحات ذكية** | ملء الحقول تلقائياً بناءً على السياق |
| **توصيات القوالب** | اقتراح قوالب بناءً على سلوك المستخدم |
| **بحث متقدم** | نتائج فورية مع فلترة ذكية |

### 🌐 نظام قاعدة بيانات هجين
| النوع | الاستخدام |
|-------|----------|
| **MySQL** | البيانات العلائقية (الطلبات، المستخدمين، المدفوعات) |
| **Firestore** | البيانات المرنة (القوالب التفاعلية، السجلات) |

### 🛍️ متجر متكامل
- ✅ تحميل فوري وآمن للملفات
- ✅ قوالب تفاعلية تعمل في المتصفح
- ✅ نظام سلة تسوق متقدم
- ✅ أكواد خصم وكوبونات
- ✅ نظام تقييمات ومراجعات

### 🎨 تجربة مستخدم حديثة
- ✅ دعم الوضع المظلم/الفاتح
- ✅ تصميم متجاوب لجميع الأجهزة
- ✅ إشعارات فورية
- ✅ واجهة عربية بالكامل

### 🛡️ لوحة تحكم قوية
- ✅ إحصائيات ورسوم بيانية
- ✅ إدارة المستخدمين والقوالب والطلبات
- ✅ سجل النشاطات والتدقيق

---

## 🏗️ البنية التقنية

```
SERS/
├── backend/                    # Laravel 11 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api/       # API Controllers
│   │   │   └── Middleware/
│   │   ├── Models/            # Eloquent Models
│   │   └── Services/          # Business Logic
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php            # API Routes
│   └── config/
│
├── frontend/                   # Next.js 14 App
│   ├── src/
│   │   ├── app/               # App Router Pages
│   │   │   ├── (admin)/       # Admin Dashboard
│   │   │   ├── (dashboard)/   # User Dashboard
│   │   │   └── (shop)/        # Marketplace
│   │   ├── components/        # React Components
│   │   │   ├── ui/            # Base UI Components
│   │   │   ├── layout/        # Layout Components
│   │   │   ├── admin/         # Admin Components
│   │   │   └── templates/     # Template Components
│   │   ├── lib/               # Utilities & API Client
│   │   ├── stores/            # Zustand State Management
│   │   └── types/             # TypeScript Definitions
│   └── public/
│
└── docs/                       # Documentation
```

---

## 🛠️ دليل التثبيت

### المتطلبات الأساسية

| المتطلب | الإصدار |
|---------|---------|
| PHP | 8.2+ |
| Composer | 2.0+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| Firebase Account | للمصادقة الاجتماعية |

### 1. تثبيت الواجهة الخلفية (Backend)

```bash
# الانتقال لمجلد الـ backend
cd backend

# نسخ ملف البيئة
cp .env.example .env

# تعديل إعدادات قاعدة البيانات في .env

# تثبيت الاعتماديات
composer install

# توليد مفتاح التطبيق
php artisan key:generate

# تشغيل الهجرات مع البيانات التجريبية
php artisan migrate --seed

# تشغيل الخادم
php artisan serve
```

> الخادم سيعمل على `http://localhost:8000`

### 2. تثبيت الواجهة الأمامية (Frontend)

```bash
# الانتقال لمجلد الـ frontend
cd frontend

# نسخ ملف البيئة
cp .env.example .env.local

# تعديل رابط الـ API في .env.local

# تثبيت الاعتماديات
npm install

# تشغيل خادم التطوير
npm run dev
```

> الواجهة ستعمل على `http://localhost:3000`

---

## ⚙️ متغيرات البيئة

### Backend (.env)

```env
# Application
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sers_db
DB_USERNAME=root
DB_PASSWORD=

# Firebase (للسجلات التفاعلية)
FIREBASE_CREDENTIALS=firebase-credentials.json
FIREBASE_PROJECT_ID=your-project-id

# OpenAI (للذكاء الاصطناعي)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo
```

### Frontend (.env.local)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Application
NEXT_PUBLIC_APP_NAME=SERS
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=ar

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## 🔑 بيانات الاختبار

النظام يأتي مع بيانات تجريبية جاهزة للاختبار:

| الدور | البريد الإلكتروني | كلمة المرور |
|-------|------------------|-------------|
| **مدير** | `admin@sers.com` | `password` |
| **معلم** | `teacher@sers.com` | `password` |
| **مستخدم** | `user@sers.com` | `password` |

---

## 📡 نقاط النهاية API

### المصادقة
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/auth/register` | تسجيل مستخدم جديد |
| POST | `/api/auth/login` | تسجيل الدخول |
| POST | `/api/auth/social` | تسجيل الدخول عبر Google |
| POST | `/api/auth/logout` | تسجيل الخروج |
| GET | `/api/auth/me` | بيانات المستخدم الحالي |

### القوالب
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/templates` | قائمة القوالب |
| GET | `/api/templates/featured` | القوالب المميزة |
| GET | `/api/templates/{slug}` | عرض قالب واحد |

### الطلبات
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/orders` | طلبات المستخدم |
| POST | `/api/orders` | إنشاء طلب جديد |
| GET | `/api/orders/{id}` | عرض طلب واحد |

### الذكاء الاصطناعي
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/ai/suggest` | طلب اقتراح AI |
| POST | `/api/ai/accept` | قبول/رفض اقتراح |

---

## 🧪 الاختبار

```bash
# اختبارات الـ Backend
cd backend && php artisan test

# اختبارات الـ Frontend
cd frontend && npm run test

# فحص الكود
cd frontend && npm run lint
```

---

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى اتباع الخطوات التالية:

1. Fork المستودع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

---

## 📄 الترخيص

مشروع تخرج - جميع الحقوق محفوظة.

---

<div align="center">

**صُنع بـ ❤️ للمعلمين والمعلمات في المملكة العربية السعودية**

</div>
