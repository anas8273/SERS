# الفصل الخامس: التطبيق والتنفيذ — منصة SERS

## 5.1 مقدمة

يتناول هذا الفصل التطبيق العملي لمنصة SERS (نظام الخدمات التعليمية الذكية)، ويستعرض البنية المعمارية للنظام، والعمليات الأساسية، وتفاصيل التقنيات المستخدمة، وآليات الأمان المطبقة، وهيكلة المشروع البرمجية.

---

## 5.2 العمليات الأساسية للنظام

يقدم النظام 10 عمليات أساسية مستقرة تمثل جوهر المنصة:

### 5.2.1 المصادقة وإدارة الحسابات

| العملية | الوصف |
|---------|-------|
| إنشاء حساب جديد | تسجيل بالبريد الإلكتروني وكلمة المرور |
| تسجيل الدخول | مصادقة عبر Laravel Sanctum مع تحقق البريد الإلكتروني |
| إدارة الجلسات | تمديد تلقائي + خيار "تذكرني" + انتهاء ذكي حسب دور المستخدم |
| تعديل الملف الشخصي | تحديث الاسم، الصورة الشخصية، كلمة المرور |

### 5.2.2 متجر القوالب (Marketplace)

| العملية | الوصف |
|---------|-------|
| تصفح القوالب | عرض حسب الأقسام والتصنيفات مع بحث ذكي (Fuzzy Search) وفلترة متقدمة |
| معاينة القالب | عرض كامل مع المراجعات والتقييمات قبل الشراء |
| إضافة للسلة والمفضلة | سلة تسوق مع مزامنة فورية + قائمة مفضلة (Wishlist) |
| شراء القالب | دفع ببطاقة ائتمانية (Stripe) أو محفظة إلكترونية أو كوبون خصم |
| تحميل القالب | تنزيل بصيغة PDF عالية الجودة من مكتبة المستخدم بعد الشراء |
| تقييم ومراجعة | تقييم 5 نجوم + تعليق نصي بعد الشراء |

### 5.2.3 المحرر التفاعلي (Template Editor)

| العملية | الوصف |
|---------|-------|
| فتح قالب تفاعلي | تعبئة الحقول الديناميكية مباشرة على المنصة |
| ملء بالذكاء الاصطناعي | ملء حقل واحد أو جميع الحقول دفعة واحدة بمساعدة AI |
| حفظ تلقائي فوري | حفظ تلقائي كل 1.5 ثانية مع إمكانية الاستئناف لاحقا |
| تصدير الوثيقة | PDF أو صورة PNG أو طباعة مباشرة |
| التوليد الجماعي | رفع ملف Excel/CSV لإنشاء عشرات الشهادات دفعة واحدة |
| توليد QR Code | إنشاء رموز QR مباشرة داخل المحرر |
| تاريخ الإصدارات | عرض جميع النسخ السابقة مع إمكانية استعادة أي إصدار |

### 5.2.4 الذكاء الاصطناعي (SERS AI)

مدعوم بنموذج **LLaMA 3.3 70B Versatile** عبر **Groq API** مع آلية مقاومة التكرار (Dynamic Temperature Boosting + FORBIDDEN Content Blocks):

| العملية | الوصف |
|---------|-------|
| اقتراحات ذكية | اقتراح مخصص لكل حقل حسب نوعه وسياق القالب |
| ملء تلقائي كامل | ملء جميع حقول القالب بضغطة واحدة مع مراعاة الترابط بين الحقول |
| تحليل نتائج الطلاب | تحليل الدرجات مع توصيات تربوية وخطط تحسين |
| اقتراح خطط علاجية وإثرائية | خطط مولدة تلقائيا بناء على نتائج التحليل |
| صياغة شهادات التقدير | نصوص رسمية جاهزة للشهادات |
| محادثة ذكية (Chatbot) | مساعد يفهم سياق العمل ويحتفظ بتاريخ المحادثات |
| توليد تقارير وإنجازات | تقارير أداء ووثائق إنجاز مولدة تلقائيا |
| توزيع المنهج | توزيع المنهج على الأسابيع تلقائيا |

### 5.2.5 الخدمات التعليمية التفاعلية (34 خدمة في 6 مجموعات)

العمليات المشتركة لجميع الخدمات:

| العملية | الوصف |
|---------|-------|
| إنشاء سجل جديد | اختيار الخدمة وتعبئة النموذج التفاعلي |
| رفع شواهد | رفع صور شواهد + روابط تتحول لـ QR Code تلقائيا |
| مساعدة AI أثناء التعبئة | الذكاء الاصطناعي يساعد في ملء الحقول |
| حفظ وتعديل وحذف | إدارة كاملة للسجلات المحفوظة |
| تصدير PDF احترافي | تصدير السجل كملف PDF جاهز للطباعة |

**المجموعة الأولى: التحليل والاختبارات (4 خدمات)**

| الخدمة | الوظيفة |
|--------|---------|
| تحليل النتائج | رسوم بيانية تفاعلية (Recharts) + إحصائيات + توصيات AI |
| الاختبارات | تصميم اختبارات بدرجات ومدة + أسئلة متعددة الأنماط |
| بنك الأسئلة | أسئلة مصنفة حسب المادة ومستوى بلوم |
| أدوات تحليل النتائج | إحصائيات تلقائية وتوزيع الدرجات لجميع المراحل |

**المجموعة الثانية: الشهادات المتنوعة (خدمتان)**

| الخدمة | الوظيفة |
|--------|---------|
| شهادات شكر وتقدير | تصاميم متعددة + إنشاء جماعي من ملف Excel |
| شهادات متنوعة | شهادات تخرج، مشاركة، دورات بتصاميم احترافية |

**المجموعة الثالثة: شواهد الأداء الوظيفي (11 بندا)**

كامل بنود تقييم الأداء الوظيفي المعتمدة:

| البند | الوصف |
|-------|-------|
| 1. أداء الواجبات الوظيفية | توثيق الالتزام بالمهام الوظيفية |
| 2. التفاعل مع المجتمع المهني | مجتمعات تعلم ومحاضر اجتماعات مهنية |
| 3. التفاعل مع أولياء الأمور | محاضر اجتماعات وتقارير تواصل |
| 4. استراتيجيات التدريس | توثيق 6 أنواع من الاستراتيجيات التعليمية |
| 5. تحسين نتائج المتعلمين | تقارير تكريم طلاب وخطط تحسين |
| 6. إعداد وتنفيذ خطة التعلم | خطط فصلية وأسبوعية وتوزيعات |
| 7. توظيف التقنيات التعليمية | توثيق استخدام أدوات مثل Canva وKahoot وTeams |
| 8. تهيئة البيئة التعليمية | أنشطة طلابية وبرامج مدرسية |
| 9. الإدارة الصفية | توثيق إدارة الصف وضبط البيئة |
| 10. تحليل نتائج المتعلمين | تحليل مهارات واختبارات مع رسوم بيانية |
| 11. تنوع أساليب التقويم | تقويم أقران ومتعدد الأساليب |

**المجموعة الرابعة: السجلات والملفات المدرسية (6 خدمات)**

| الخدمة | الوظيفة |
|--------|---------|
| التوثيق والإنجازات | توثيق يومي/أسبوعي/شهري للإنجازات |
| الإنتاج المعرفي | أبحاث ومقالات ومبادرات |
| سجل المتابعة | زيارات صفية وتوصيات ومتابعة |
| ملف الإنجاز الرقمي | أقسام مدمجة + مخصصة + تصدير PDF كامل |
| نماذج وتقارير التوثيق | نماذج احترافية جاهزة للتعبئة |
| منشئ تقارير الإنجاز | تقارير شاملة جاهزة للطباعة |

**المجموعة الخامسة: التخطيط والتوزيعات (5 خدمات)**

| الخدمة | الوظيفة |
|--------|---------|
| الخطط التعليمية | خطط علاجية + إثرائية + فصلية + وحدات دراسية |
| التوزيعات | توزيع المنهج أسبوعي/شهري/فصلي |
| الخطة الأسبوعية | خطة أسبوعية لمادة واحدة أو جميع المواد |
| التقاويم الأكاديمية | تقاويم دراسية وتوزيع أسابيع |
| الخطط العلاجية والإثرائية | خطط فردية وجماعية مع توليد AI |

**المجموعة السادسة: أدوات ومصادر تعليمية (6 خدمات)**

| الخدمة | الوظيفة |
|--------|---------|
| أوراق العمل | إنشاء أوراق عمل تفاعلية بمساعدة AI |
| لوحات وبنرات | لوحات إرشادية وبنرات تعليمية |
| استبيانات أنماط التعلم | استبيانات VARK وتقييم طلاب |
| أدوات مساعدة مجانية | QR Code + تحويل صور + حاسبة نسبة موزونة + توقيع PDF |
| قوالبي المحفوظة | إدارة القوالب المشتراة والمفضلة |
| المساعد الذكي | مساعد AI للخطط والتقارير والاستشارات التعليمية |

### 5.2.6 النظام المالي

| العملية | الوصف |
|---------|-------|
| إنشاء طلب شراء | اختيار القوالب من السلة وتحديد طريقة الدفع |
| الدفع بالبطاقة | Stripe (Visa / Mada) مع تأكيد تلقائي عبر Webhooks |
| المحفظة الإلكترونية | شحن الرصيد + الدفع من المحفظة + عمليات ذرية (DB::transaction) |
| تحويل رصيد | تحويل بين المستخدمين داخل المنصة |
| كوبونات الخصم | تطبيق كوبون (نسبة مئوية أو مبلغ ثابت) مع حد استخدام |

### 5.2.7 نظام الإحالة والمكافآت

| العملية | الوصف |
|---------|-------|
| توليد كود إحالة | كود فريد لكل مستخدم |
| تطبيق الكود | المستخدم الجديد يدخل الكود ويحصل كلا الطرفين على مكافأة ترحيبية |
| عمولة تلقائية | نسبة من كل عملية شراء يقوم بها المستخدم المحال |
| سحب الأرباح | طلب سحب ثم موافقة إدارية ثم تحويل للمحفظة أو حساب بنكي |

### 5.2.8 الطلبات المخصصة

| العملية | الوصف |
|---------|-------|
| إنشاء طلب | المستخدم يطلب قالبا غير متوفر مع وصف تفصيلي |
| تصويت مجتمعي | المستخدمون يصوتون لرفع أولوية الطلبات الأكثر حاجة |
| متابعة الحالة | إشعارات فورية عند كل تحديث من الإدارة |

### 5.2.9 لوحة الإدارة (15 قسم)

| العملية | الوصف |
|---------|-------|
| إدارة القوالب | إضافة / تعديل / حذف + تمييز + تعطيل |
| إدارة المستخدمين | تعديل الصلاحيات + رصيد المحفظة + تفعيل/تعطيل |
| إدارة الطلبات والمدفوعات | عرض + تغيير الحالة + تصدير |
| إدارة التقييمات | موافقة أو رفض المراجعات |
| إدارة كوبونات الخصم | إنشاء + تفعيل / تعطيل + حد استخدام |
| إدارة كتالوج الخدمات | إدارة الخدمات التعليمية (34 خدمة) وتصنيفاتها |
| التقارير التحليلية | مبيعات + مستخدمين + قوالب + استهلاك AI |
| سجل النشاطات | تتبع جميع العمليات مع فلترة وبحث |
| إعدادات النظام | تفريغ Cache + وضع الصيانة + إعدادات عامة |

### 5.2.10 تجربة المستخدم العامة

| العملية | الوصف |
|---------|-------|
| ثنائية اللغة | عربي + إنجليزي مع تبديل فوري (RTL/LTR) |
| الوضع الداكن/الفاتح | فاتح / داكن / تلقائي حسب النظام |
| إشعارات فورية | عند كل عملية مهمة |
| بحث شامل | بحث ذكي في القوالب والخدمات |
| تجاوب كامل | متوافق مع الجوال والتابلت والحاسب |

---

## 5.3 البنية التقنية (Architecture)

### 5.3.1 النمط المعماري

يعتمد المشروع على نمط **Hybrid Decoupled Single Page Application** حيث تعمل الواجهة الأمامية (Next.js 15) والواجهة الخلفية (Laravel 12) كتطبيقين مستقلين تماما، يتواصلان عبر REST API باستخدام مصادقة Laravel Sanctum، مع استخدام قاعدة بيانات هجينة (MySQL للبيانات العلائقية المهيكلة + Firebase Firestore للبيانات الديناميكية غير المهيكلة).

### 5.3.2 مخطط النظام العام

```
 ┌──────────────────────────────────────────────────────────────────────┐
 |                          المتصفح (Browser)                          |
 |                                                                      |
 |  ┌──────────────────────────────────────────────────────────────┐    |
 |  |                  Next.js 15 — Frontend Layer                 |    |
 |  |                                                              |    |
 |  |  ┌───────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐   |    |
 |  |  | App Router |  |  Zustand |  | Firebase  |  |  i18n    |   |    |
 |  |  |  (Pages)   |  |  Stores  |  |   SDK     |  |  AR/EN   |   |    |
 |  |  └─────┬──────┘  └────┬─────┘  └────┬──────┘  └──────────┘   |    |
 |  |        |              |              |                        |    |
 |  |  ┌─────v──────────────v───┐   ┌─────v──────────────────┐     |    |
 |  |  |  lib/api.ts (52KB)     |   | lib/firestore-         |     |    |
 |  |  |  طبقة API المركزية     |   | service.ts (20KB)      |     |    |
 |  |  └────────┬───────────────┘   └─────┬──────────────────┘     |    |
 |  └───────────|─────────────────────────|────────────────────────┘    |
 └──────────────|─────────────────────────|────────────────────────────┘
                |                         |
                | REST API (JSON)         | Firestore SDK
                | Authorization: Bearer   | (Direct Connection)
                |                         |
 ┌──────────────v──────────────────┐  ┌───v─────────────────────────┐
 |  Backend — Laravel 12 (PHP 8.2) |  |  Firebase Firestore (NoSQL) |
 |                                 |  |                             |
 |  ┌───────────────────────────┐  |  |  educational_records        |
 |  |     Middleware Stack      |  |  |  user_template_data         |
 |  |  Sanctum > RBAC >        |  |  |  service_categories         |
 |  |  RateLimit > Security    |  |  |                             |
 |  └──────────┬────────────────┘  |  └─────────────────────────────┘
 |  ┌──────────v────────────────┐  |
 |  |   36 API Controllers      |  |  ┌─────────────────────────────┐
 |  └──────────┬────────────────┘  |  |        Groq API             |
 |  ┌──────────v────────────────┐  |  |   LLaMA 3.3 70B Versatile   |
 |  |   14 Business Services    |  |  |   15 AI Endpoints           |
 |  └──────────┬────────────────┘  |  └─────────────────────────────┘
 |  ┌──────────v────────────────┐  |
 |  |   29 Eloquent Models      |  |  ┌─────────────────────────────┐
 |  └──────────┬────────────────┘  |  |        Stripe API           |
 |  ┌──────────v────────────────┐  |  |   PaymentIntent + Webhooks  |
 |  |     MySQL 8.x Database    |  |  └─────────────────────────────┘
 |  |   29 جدول | 55 Migration  |  |
 |  └───────────────────────────┘  |
 └─────────────────────────────────┘
```

---

## 5.4 طبقة الواجهة الخلفية (Backend)

### 5.4.1 المتحكمات (Controllers) — 36 متحكم

| المجموعة | المتحكمات | الوظيفة |
|----------|-----------|---------|
| المصادقة | `AuthController` | تسجيل/دخول + تحقق البريد + إدارة الجلسات |
| المتجر | `TemplateController`, `SectionController`, `CategoryController` | CRUD للقوالب والأقسام والتصنيفات |
| التجارة | `OrderController`, `PaymentController`, `CouponController` | طلبات + دفع Stripe + كوبونات |
| الذكاء الاصطناعي | `AIController` (2,077 سطر) | 15 Endpoint: اقتراح، ملء، تحليل، محادثة، توليد |
| الخدمات التعليمية | `EducationalServiceController` | CRUD للسجلات التعليمية الديناميكية |
| المالية | `PaymentController`, `AdminWithdrawalController` | محفظة + شحن + سحب + تحويل |
| الإحالات | `ReferralController` | أكواد إحالة + عمولات + سحب أرباح |
| التصدير | `ExportController`, `QRCodeController` | PDF + صور + QR Code |
| المستخدمون | `UserController`, `WishlistController`, `ReviewController` | ملف شخصي + مفضلة + تقييمات |
| الإدارة | `AdminOrderController`, `AdminReportController`, `AdminSchemaController` | طلبات + تقارير + Schema Builder |
| النظام | `StatsController`, `SettingsController`, `ActivityLogController`, `NotificationController`, `ContactController`, `VersionController`, `DashboardController`, `LibraryController`, `ResourceController` | إحصائيات + إعدادات + سجل نشاط + إشعارات |

### 5.4.2 طبقة الخدمات (Services) — 14 خدمة

فصل كامل لمنطق الأعمال (Business Logic) عن المتحكمات:

| الخدمة | الحجم | المسؤولية |
|--------|-------|-----------|
| `AIService` | 10KB | الاتصال بـ Groq API + إدارة المحادثات |
| `DynamicPromptService` | 20KB | بناء Prompts ديناميكية حسب نوع القالب والسياق |
| `FirestoreService` | 24KB | CRUD على Firebase Firestore |
| `UniversalAnalysisService` | 23KB | تحليل شامل لنتائج الطلاب |
| `PDFGenerationService` | 21KB | توليد PDF عربي (TCPDF + DomPDF) |
| `InteractivePDFAutomationService` | 25KB | أتمتة ملء القوالب التفاعلية |
| `VersionControlService` | 17KB | إدارة إصدارات القوالب + تتبع التغييرات |
| `MeilisearchService` | 15KB | بحث متقدم Full-text |
| `PurchaseService` | 11KB | منطق الشراء + المحفظة + الكوبونات |
| `SearchService` | 10KB | بحث ذكي في القوالب |
| `StripePaymentService` | 2KB | تكامل Stripe PaymentIntent |
| `WalletService` | 4KB | عمليات المحفظة الإلكترونية |
| `ReferralService` | 3KB | حساب العمولات وإدارة الإحالات |
| `StatsCacheService` | 1.5KB | تخزين مؤقت ذكي للإحصائيات |

### 5.4.3 نماذج البيانات (Models) — 29 نموذج

| المجموعة | النماذج |
|----------|---------|
| المستخدمون | `User` (مع محفظة + إحالات + صلاحيات) |
| المتجر | `Template`, `TemplateField`, `TemplateVariant`, `Section`, `Category` |
| التجارة | `Order`, `OrderItem`, `UserLibrary`, `Coupon`, `CouponUsage` |
| المحتوى | `UserTemplateData`, `TemplateDataVersion`, `Evidence`, `ContentLibrary`, `Resource` |
| المالية | `WalletTransaction`, `FavoriteTemplate` |
| التفاعل | `Review`, `Wishlist`, `CustomRequest`, `CustomRequestVote` |
| النظام | `Notification`, `ActivityLog`, `ContactMessage`, `AIConversation`, `AIRequestLog`, `Analysis`, `Outbox` |

### 5.4.4 طبقات الحماية (Middleware) — 7 طبقات

```
الطلب الوارد (Request)
  --> RequestId           UUID فريد لتتبع كل طلب
  --> SecurityHeaders     CSP, HSTS, X-Frame-Options
  --> ApiRateLimiter       فئات: default, auth, ai, export, destructive
  --> GzipMiddleware       ضغط تلقائي للاستجابات الكبيرة
  --> HttpCacheMiddleware  ETags + Cache-Control
  --> Sanctum Auth         التحقق من Token
  --> IsAdmin              للمسارات الإدارية فقط
  --> PaymentWall          للمحتوى المدفوع فقط
  --> Controller           المتحكم المطلوب
```

---

## 5.5 طبقة الواجهة الأمامية (Frontend)

### 5.5.1 بنية التطبيق (App Router)

يستخدم Next.js 15 نظام App Router مع Route Groups لفصل التخطيطات:

| المجموعة | الوظيفة |
|----------|---------|
| `(auth)` | تسجيل دخول / إنشاء حساب / استعادة كلمة المرور |
| `(dashboard)` | لوحة تحكم المستخدم + جميع الخدمات التعليمية (22 صفحة) |
| `(admin)/admin` | لوحة تحكم الإدارة (15 قسم) |
| الصفحات العامة | الرئيسية + المتجر + الخدمات + المحرر + السلة + الدفع |

### 5.5.2 إدارة الحالة (Zustand) — 4 Stores

| Store | الحجم | المسؤولية | Persist |
|-------|-------|-----------|---------|
| `authStore` | 14KB | بيانات المستخدم + Token + الجلسة | نعم |
| `cartStore` | 4KB | عناصر السلة + حساب المجموع | نعم |
| `wishlistStore` | 3.5KB | قائمة المفضلة + مزامنة API | نعم |
| `cartDrawerStore` | 0.5KB | فتح/إغلاق درج السلة | لا |

### 5.5.3 Custom Hooks — 15 Hook

| Hook | الوظيفة |
|------|---------|
| `useAuth` | إدارة المصادقة والصلاحيات |
| `useMarketplace` (12KB) | منطق تصفح المتجر + فلترة + فرز |
| `useRecommendations` (8KB) | محرك التوصيات الذكية |
| `useApiCache` (5KB) | تخزين مؤقت ذكي لطلبات API |
| `useLocalDraft` (3.5KB) | حفظ المسودات محليا |
| `useFirestoreForms` (7.4KB) | CRUD على نماذج Firestore |
| `useFirestoreSections` (6.8KB) | إدارة أقسام Firestore |
| `useAdminAI` (4.4KB) | إدارة AI في لوحة الإدارة |
| `useAIFieldFill` (3.2KB) | ملء الحقول بالذكاء الاصطناعي |
| `useLocalizedTypes` (10KB) | أنواع البيانات المترجمة |
| `useDebounce` | تأخير البحث لتخفيف الضغط |
| `useNetworkStatus` | كشف حالة الاتصال |
| `useRecentlyViewed` | تتبع القوالب المعروضة مؤخرا |
| `useKeyboardShortcuts` | اختصارات لوحة المفاتيح |
| `useUnsavedGuard` (4KB) | تحذير عند مغادرة صفحة بتغييرات غير محفوظة |

### 5.5.4 المكتبات المساعدة (lib/) — 21 وحدة

| الوحدة | الحجم | الوظيفة |
|--------|-------|---------|
| `api.ts` | 52KB | طبقة API المركزية (جميع الطلبات + interceptors + error handling) |
| `default-services.ts` | 31KB | تعريفات الخدمات التعليمية (34 خدمة في 6 مجموعات) |
| `ai-context.ts` | 19KB | سياق AI (شخصية المساعد + قواعد التوليد) |
| `firestore-service.ts` | 20KB | CRUD على Firestore + مزامنة |
| `pdf-export.ts` | 16KB | تصدير PDF عالي الجودة |
| `fuzzy-search.ts` | 11KB | بحث ذكي مع تسامح في الأخطاء الإملائية |
| `session-manager.ts` | 8KB | إدارة الجلسات + تمديد + انتهاء |
| `excel-parser.ts` | 8KB | قراءة ملفات Excel/CSV للتوليد الجماعي |
| `security.ts` | 7KB | تنقية المدخلات + حماية XSS |
| `export-utils.ts` | 7KB | أدوات تصدير مشتركة |
| `error-handler.ts` | 7KB | معالجة الأخطاء المركزية |
| `edu-form-template.tsx` | 12KB | قالب النماذج التعليمية |
| `cache.ts` | 6KB | نظام تخزين مؤقت بـ TTL |
| `utils.ts` | 6KB | دوال مساعدة عامة |
| `auth-helpers.ts` | 3KB | دوال مساعدة للمصادقة |
| `firebase.ts` | 2KB | إعداد Firebase SDK |
| `api-rate-limit.ts` | 2KB | تحديد معدل الطلبات |
| `logger.ts` | 1.5KB | تسجيل أحداث التطبيق |
| `schemas.ts` | 1KB | Zod schemas للتحقق |

---

## 5.6 تصميم قاعدة البيانات الهجينة

### 5.6.1 مبررات اختيار قاعدة بيانات هجينة

| المعيار | MySQL | Firebase Firestore |
|---------|-------|-------------------|
| نوع البيانات | مهيكلة ثابتة (مستخدمون، طلبات) | ديناميكية متغيرة (سجلات، نماذج) |
| العلاقات | علاقات معقدة (Foreign Keys, Joins) | وثائق مستقلة (Documents) |
| الاستعلامات | SQL معقد + تقارير تحليلية | قراءة/كتابة بسيطة وسريعة |
| التوسع | عمودي (Vertical Scaling) | أفقي تلقائي (Auto-scaling) |

### 5.6.2 MySQL — 29 جدول | 55 Migration

| المجموعة | الجداول | العلاقات |
|----------|---------|----------|
| المستخدمون | `users`, `personal_access_tokens`, `sessions` | User hasMany Orders, Reviews, WalletTransactions |
| المتجر | `templates`, `template_fields`, `template_variants`, `sections`, `categories` | Section hasMany Categories hasMany Templates |
| الطلبات | `orders`, `order_items`, `user_libraries` | Order hasMany OrderItems, each belongsTo Template |
| المحتوى | `user_template_data`, `template_data_versions`, `evidences` | User hasMany UserTemplateData hasMany Versions |
| المالية | `wallet_transactions`, `coupons`, `coupon_usages` | User hasMany WalletTransactions |
| الإحالات | `referral_earnings`, `withdrawal_requests` | User (referrer) hasMany ReferralEarnings |
| التقييمات | `reviews`, `wishlists`, `favorite_templates` | User hasMany Reviews, each belongsTo Template |
| النظام | `notifications`, `activity_logs`, `contact_messages`, `custom_requests`, `custom_request_votes`, `content_library`, `resources`, `ai_conversations`, `analyses`, `ai_request_logs`, `system_settings`, `outbox` | — |

### 5.6.3 Firebase Firestore — 3 مجموعات رئيسية

| المجموعة (Collection) | الهيكل | الغرض |
|----------------------|--------|-------|
| `educational_records` | `userId / serviceType / recordId` | سجلات الخدمات التعليمية — كل سجل وثيقة مستقلة بحقول ديناميكية |
| `user_template_data` | `userId / templateId` | بيانات القوالب التفاعلية التي ملأها المستخدم |
| `service_categories` | `categoryId` | تصنيفات وإعدادات الخدمات التعليمية |

---

## 5.7 تصميم واجهة API

### 5.7.1 تنظيم المسارات (~305 مسار)

```
api.php (757 سطر)
|
|-- Public Routes             (بدون مصادقة)
|   |-- GET    /stats/public          إحصائيات عامة للصفحة الرئيسية
|   |-- GET    /templates             قائمة القوالب المنشورة
|   |-- GET    /sections              الأقسام والتصنيفات
|   |-- POST   /auth/login            تسجيل الدخول
|   +-- POST   /auth/register         إنشاء حساب جديد
|
|-- Protected Routes          (auth:sanctum — يتطلب تسجيل دخول)
|   |-- /orders/*                     إنشاء وتتبع الطلبات
|   |-- /payments/*                   الدفع والمحفظة
|   |-- /ai/*                         الذكاء الاصطناعي (15 endpoint)
|   |-- /educational-services/*       الخدمات التعليمية
|   |-- /referrals/*                  الإحالات والمكافآت
|   |-- /user/*                       الملف الشخصي والإعدادات
|   |-- /wishlist/*                   المفضلة
|   |-- /reviews/*                    التقييمات والمراجعات
|   +-- /export/*                     التصدير (PDF، صور)
|
+-- Admin Routes              (auth:sanctum + is_admin — صلاحيات إدارية)
    |-- /admin/templates/*            إدارة القوالب (CRUD + ترتيب)
    |-- /admin/users/*                إدارة المستخدمين
    |-- /admin/orders/*               إدارة الطلبات
    |-- /admin/reports/*              التقارير التحليلية
    |-- /admin/settings/*             إعدادات النظام
    +-- /admin/withdrawals/*          موافقة طلبات السحب
```

### 5.7.2 مثال تدفق بيانات: ملء الحقول بالذكاء الاصطناعي

```
المستخدم يضغط زر "ملء ذكي"
  |
  v
Frontend: useAIFieldFill Hook
  |  POST /api/ai/fill-all
  |  Headers: { Authorization: Bearer <token> }
  |  Body: { template_id, current_values, locale }
  |
  v
Middleware Stack
  |  RequestId   --> UUID فريد لتتبع الطلب
  |  Sanctum     --> التحقق من صحة Token
  |  RateLimit   --> فئة "ai" (30 طلب/دقيقة)
  |
  v
AIController::fillAll()
  |  DynamicPromptService::buildPrompt()   بناء Prompt ديناميكي حسب القالب
  |  AIService::generateCompletion()        إرسال للـ Groq API
  |  Anti-repetition check                  فحص التكرار (Temperature Boost)
  |
  v
Groq API -- LLaMA 3.3 70B Versatile
  |  معالجة + توليد محتوى
  |
  v
JSON Response: { success: true, data: { suggestions: { field: "value" } } }
  |
  v
Frontend: يملأ الحقول تلقائيا في المحرر التفاعلي + يحفظ في Firestore
```

---

## 5.8 الأمان والحماية

يطبق النظام نموذج **Defense in Depth** بطبقات حماية متعددة:

| الطبقة | التقنية | التفاصيل |
|--------|---------|----------|
| المصادقة | Laravel Sanctum | Token-based SPA Authentication مع انتهاء ذكي حسب الدور |
| التفويض | RBAC Middleware | فصل تام لصلاحيات المدير عن المستخدم العادي |
| تحديد المعدل | ApiRateLimiter | 5 فئات: default, auth, ai, export, destructive |
| أمان الدفع | Stripe Webhooks | التحقق من التوقيع + عمليات ذرية (DB::transaction) |
| أمان الرؤوس | SecurityHeaders | Content-Security-Policy, HSTS, X-Frame-Options |
| تنقية المدخلات | Zod + Laravel Validation | تحقق مزدوج في Frontend و Backend |
| حماية XSS | DOMPurify + CSRF | تنقية المحتوى + رموز CSRF |
| إدارة الجلسات | Session Manager | تمديد تلقائي + انتهاء + Remember Me |
| ضغط الاستجابة | GzipMiddleware | ضغط تلقائي للاستجابات الكبيرة |
| تتبع الطلبات | RequestIdMiddleware | UUID فريد لكل طلب API |

---

## 5.9 التقنيات المستخدمة

### 5.9.1 الواجهة الخلفية (Backend)

| التقنية | الإصدار | الغرض |
|---------|---------|-------|
| Laravel | 12.x | إطار العمل الأساسي (MVC + REST API) |
| PHP | 8.2+ | لغة البرمجة |
| Laravel Sanctum | 4.2 | مصادقة SPA |
| Laravel Scout | 10.x | بحث Full-text |
| MySQL | 8.x | قاعدة بيانات علائقية |
| Firebase Admin SDK | 6.2 | اتصال Firestore |
| Stripe PHP | 19.x | بوابة الدفع |
| DomPDF | 3.1 | توليد PDF |
| TCPDF | 6.10 | PDF متقدم مع خطوط عربية |
| Intervention Image | 4.0 | معالجة صور |
| Meilisearch | 1.16 | محرك بحث متقدم |

### 5.9.2 الواجهة الأمامية (Frontend)

| التقنية | الإصدار | الغرض |
|---------|---------|-------|
| Next.js | 15.x | إطار React (App Router + Turbopack) |
| React | 18.x | مكتبة واجهة المستخدم |
| TypeScript | 5.x | أمان الأنواع |
| Tailwind CSS | 3.4 | تصميم متجاوب + Dark Mode + RTL |
| Zustand | 5.x | إدارة الحالة (4 Stores) |
| Shadcn UI (Radix) | احدث | 16 مكون UI |
| Firebase SDK | 12.7 | اتصال Firestore مباشر |
| Stripe.js | 9.x | واجهة دفع آمنة |
| Framer Motion | 12.x | تحريكات وتأثيرات بصرية |
| Recharts | 3.7 | رسوم بيانية تفاعلية |
| react-hook-form + Zod | 7.x / 4.x | إدارة نماذج + تحقق |
| jsPDF + html2canvas | 4.x / 1.4 | تصدير PDF + صور |
| xlsx + papaparse | 0.18 / 5.5 | استيراد/تصدير Excel/CSV |
| next-themes | 0.4 | وضع داكن/فاتح |
| SWR | 2.3 | تخزين مؤقت للطلبات |
| DOMPurify | 3.3 | حماية XSS |
| QRCode.react | 4.2 | توليد رموز QR |
| Lottie React | 2.4 | رسوم متحركة |
| Cairo + IBM Plex Sans Arabic | — | خطوط عربية احترافية |

---

## 5.10 هيكلة المشروع (Project Structure)

```
SERS/
|
|-- backend/                              Laravel 12 (PHP 8.2+)
|   |-- app/
|   |   |-- Http/
|   |   |   |-- Controllers/Api/           36 متحكم API
|   |   |   |   |-- AIController.php           2,077 سطر — 15 خدمة AI
|   |   |   |   |-- AuthController.php          مصادقة + تحقق بريد
|   |   |   |   |-- TemplateController.php      CRUD قوالب + بحث
|   |   |   |   |-- PaymentController.php       Stripe + محفظة + Webhooks
|   |   |   |   |-- OrderController.php         طلبات + دفع
|   |   |   |   |-- EducationalServiceController خدمات تعليمية
|   |   |   |   |-- ReferralController.php       إحالات + سحب أرباح
|   |   |   |   |-- ExportController.php         PDF + صور
|   |   |   |   |-- AdminSchemaController.php    Schema Builder
|   |   |   |   |-- AdminReportController.php    تقارير متقدمة
|   |   |   |   +-- ... (26 متحكم اضافي)
|   |   |   +-- Middleware/                 7 طبقات حماية
|   |   |-- Models/                         29 نموذج Eloquent
|   |   +-- Services/                      14 خدمة أعمال
|   |       |-- AIService.php                  محرك AI (10KB)
|   |       |-- DynamicPromptService.php        بناء Prompts (20KB)
|   |       |-- FirestoreService.php            اتصال Firestore (24KB)
|   |       |-- PDFGenerationService.php        توليد PDF عربي (21KB)
|   |       |-- UniversalAnalysisService.php    تحليل شامل (23KB)
|   |       |-- InteractivePDFAutomationService PDF تلقائي (25KB)
|   |       |-- VersionControlService.php       إصدارات (17KB)
|   |       |-- MeilisearchService.php          بحث متقدم (15KB)
|   |       |-- PurchaseService.php             شراء (11KB)
|   |       |-- SearchService.php               بحث (10KB)
|   |       |-- StripePaymentService.php        Stripe (2KB)
|   |       |-- WalletService.php               محفظة (4KB)
|   |       |-- ReferralService.php             إحالة (3KB)
|   |       +-- StatsCacheService.php           إحصائيات (1.5KB)
|   |-- database/
|   |   |-- migrations/                    55 ملف Migration
|   |   +-- seeders/                       بذور البيانات الأولية
|   |-- routes/api.php                     ~305 مسار (757 سطر)
|   +-- .env.example
|
|-- frontend/                              Next.js 15 + React 18
|   +-- src/
|       |-- app/                            App Router
|       |   |-- (auth)/                     تسجيل دخول / إنشاء حساب
|       |   |-- (dashboard)/                لوحة المستخدم (22 صفحة)
|       |   |-- (admin)/admin/              لوحة الإدارة (15 قسم)
|       |   |-- marketplace/                متجر القوالب
|       |   |-- editor/                     المحرر التفاعلي
|       |   |-- services/                   صفحة الخدمات (34 خدمة)
|       |   |-- performance-evidence-forms/  شواهد الأداء (11 بند)
|       |   +-- about/ faq/ contact/ ...    صفحات عامة
|       |-- components/                     25 مجلد مكونات
|       |   |-- editor/                        المحرر (10 ملفات، 90KB+)
|       |   |-- admin/                         لوحة الإدارة
|       |   |-- marketplace/                   المتجر
|       |   |-- home/                          الصفحة الرئيسية
|       |   +-- ui/ (Shadcn)                   مكتبة UI (16 مكون)
|       |-- hooks/                          15 Custom Hook
|       |-- stores/                         4 Zustand Stores
|       |-- lib/                            21 وحدة مساعدة
|       |-- i18n/translations.ts            ثنائية اللغة (AR/EN)
|       +-- types/                         تعريفات TypeScript
|
|-- docs/                                  وثائق المشروع
|-- dev.js                                 سكربت تشغيل موحد
+-- package.json                           إعدادات الجذر
```
