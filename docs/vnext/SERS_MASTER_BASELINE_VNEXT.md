# SERS Master Baseline vNext

**الحالة:** مسودة مرجعية للمراجعة والاعتماد  
**تاريخ الفحص:** 2026-10-19  
**المستودع المفحوص:** `anas8273/SERS`  
**الفرع الأساس:** `main`  
**رأس الفرع وقت الفحص:** `3ad98277d49b6e02ae878a02c255a01bd693c689`

---

## 1. الغرض من هذه الوثيقة

هذه الوثيقة توحّد ثلاث طبقات كانت منفصلة داخل مشروع SERS:

1. **المنتج القديم المنفذ في GitHub:** متجر قوالب، خدمات تعليمية، ذكاء اصطناعي، دفع، تصدير، ولوحات تحكم.
2. **عمل التحليل والوكلاء السابق:** مراجعات، رحلات مستخدم، هندسة أولية، حالات فشل، ومخرجات ذُكر إنجازها في محادثات سابقة.
3. **الرؤية الحديثة لـ SERS:** نظام تشغيل ذكي للأعمال والتوثيق والتحسين المدرسي، قائم على نواة مرنة ومحرك شواهد مترابط.

الهدف ليس هدم الموجود أو الاستمرار فوقه عشوائيًا، بل تحديد ما يجب:

- `KEEP` الاحتفاظ به.
- `MODIFY` تطويره أو فصله.
- `REBUILD` إعادة بنائه حول نموذج المجال الجديد.
- `DEFER` تأجيله عن الإصدار الأول.
- `REMOVE` إزالته بعد التأكد من عدم وجود اعتماد عليه.
- `MISSING` بناؤه من الصفر.

> **قرار حاكم:** لا يبدأ تطوير ميزة كبيرة جديدة قبل ربطها بهذه الوثيقة وبقرار معماري موثق ومعايير قبول واضحة.

---

# 2. النتيجة التنفيذية للفحص

## 2.1 الموجود فعليًا في المستودع

المستودع ليس نموذجًا أوليًا بسيطًا؛ بل يحتوي Backend وFrontend واسعين، ومن أبرز الموجود:

- Laravel Backend وNext.js Frontend.
- مصادقة وحسابات مستخدمين.
- متجر قوالب وتصنيفات ومفضلة وتقييمات.
- سلة وطلبات وStripe ومحفظة وإحالات وكوبونات.
- محرر قوالب تفاعلي وبيانات مستخدم للقوالب.
- تصدير PDF وصورة وWord.
- خدمات ذكاء اصطناعي متزامنة وغير متزامنة.
- مكتبة محتوى وخدمات تعليمية متعددة.
- CRUD للشواهد، QR، روابط وملفات.
- Version History لبعض سجلات المستخدم.
- Transactional Outbox ومهام Queue.
- Health Check وفحوص CI للـBackend والـFrontend.
- دعم عربي/إنجليزي وRTL/LTR.
- وثائق تحليل وتصميم وتقارير قديمة كثيرة.

## 2.2 ما لا يمثل الرؤية الحديثة بعد

رغم اتساع الكود، النموذج الحالي ما زال في الأساس:

> `Marketplace + Templates + Independent Educational Services + AI`

بينما النموذج المستهدف هو:

> `School Work OS + Evidence Graph + Official Requirements + Role Workspaces + Performance/Self-Evaluation/Improvement Lifecycle`

الفجوة هنا **مجالية ومعمارية** وليست مجرد إضافة صفحات.

## 2.3 أهم نتيجة

لا يوصى بإعادة كتابة المشروع كاملًا من الصفر، ولا يوصى أيضًا بالبناء العشوائي فوقه. المسار المعتمد هو:

> **Modular Strangler Migration**

أي الحفاظ على الأجزاء الصالحة، ثم بناء النواة الجديدة بجانبها، ونقل الرحلات واحدة تلو الأخرى، مع Feature Flags وعقود واضحة، ثم إيقاف الأجزاء المكررة بعد اكتمال البديل.

---

# 3. سجل التحقق والثقة

## 3.1 حقائق تم التحقق منها من GitHub

- رأس `main` وقت الفحص هو commit في أبريل 2026.
- يوجد `Evidence` model لكنه يمثل مرفقًا تابعًا للمستخدم/القالب أكثر من كونه Evidence Aggregate مدرسيًا.
- يوجد `TenantScope` لكنه يصرّح داخل الكود بأنه **GROUNDWORK ONLY** وغير مطبق على النماذج.
- توجد مسارات Version History وAsync AI وExport وHealth Check.
- يوجد Transactional Outbox لمعالجة مزامنة/أحداث موثوقة.
- توجد CI jobs للـLaravel والـNext.js والتدقيق الأمني.
- وثيقة `ROADMAP.md` القديمة تتحدث عن Gemini، بينما README الحالي يذكر Groq/LLaMA؛ أي أن الوثائق غير متزامنة.
- لا تظهر في الفرع الافتراضي كيانات مجال واضحة باسم AcademicYear أو RoleAssignment أو SelfEvaluation أو ImprovementPlan أو OperationalPlan.

## 3.2 ادعاءات سابقة لم يتم إثبات وجودها في GitHub الحالي

المحادثات السابقة ذكرت أعمالًا مثل:

- 565 اختبارًا في 53 ملفًا.
- 32 Wireframes.
- خمس دفعات دمج حديثة.
- PR رقم 6.
- Domain Core وWork/Evidence APIs أحدث من النسخة الحالية.
- ملفات Handoff مثل `AI_HANDOFF` و`PROJECT_STATUS` و`DECISIONS` و`NEXT_STEPS`.

هذه العناصر **لا تُعامل كمنفذة** حتى يتم العثور على مصدرها أو فرعها أو Commitها أو ملفاتها الأصلية. توصف حاليًا بأنها:

> `UNVERIFIED HISTORICAL ARTIFACTS`

## 3.3 قاعدة الثقة

ترتيب مصادر الحقيقة من الأعلى إلى الأقل:

1. Master Baseline المعتمد + ADRs.
2. الكود والاختبارات والمخططات على الفرع المعتمد.
3. متطلبات رسمية ذات إصدار ومصدر.
4. مستندات المشروع المراجعة.
5. المخرجات القديمة غير المتزامنة.
6. ادعاءات المحادثات والوكلاء غير المادية.

---

# 4. تعريف المنتج المعتمد

## 4.1 التعريف

**SERS هو نظام تشغيل ذكي للأعمال والتوثيق والتحسين المدرسي، يحوّل العمل اليومي إلى بيانات وشواهد وتقارير وخطط مترابطة وقابلة للقياس وإعادة الاستخدام.**

## 4.2 ما ليس SERS

- ليس LMS.
- ليس مجرد متجر ملفات.
- ليس Chatbot داخل موقع.
- ليس مولد PDF منفصلًا.
- ليس مجموعة أنظمة صغيرة مكررة لكل قسم.
- لا ينشئ أدلة مزيفة على نشاط لم يحدث.

## 4.3 وعد المنتج

> أنشئ العمل مرة واحدة، ثم أعد استخدام بياناته وشواهده بطريقة صحيحة في التقرير، وملف الأداء، والتقويم الذاتي، وخطة التحسين، والخطة التشغيلية، وقياس الأثر.

---

# 5. المبادئ الحاكمة

1. **الشمول من الخلف والبساطة من الأمام:** النواة شاملة، لكن كل مستخدم يرى Workspace حسب دوره وتكليفه.
2. **Data First, Documents as Outputs:** المصدر هو البيانات والعلاقات، أما Word/PDF فهي مخرجات قابلة لإعادة التوليد.
3. **Create Once, Reuse Safely:** لا يعاد استخدام شاهد إلا إذا كان مناسبًا فعليًا للسياق.
4. **No Fabricated Evidence:** النظام يصنع القوالب والمواد المساندة، لكنه لا يختلق تنفيذًا أو حضورًا أو نتيجة.
5. **Configurable, not Hard-Coded:** الوظائف والمعايير والمؤشرات والنماذج والإصدارات تُدار كبيانات.
6. **Multi-role by Design:** الشخص قد يحمل وظيفة أساسية وتكليفات ولجانًا وأدوارًا مؤقتة.
7. **Failure-aware Engineering:** كل رحلة لها Happy/Alternate/Failure/Recovery paths.
8. **Human-in-the-loop:** الذكاء الاصطناعي يقترح ويصنف، والإنسان يؤكد النقاط الحساسة.
9. **Version Everything Important:** المتطلبات، المعايير، المستندات، prompts، AI models، والقوالب.
10. **Module Reuse:** القسم الجديد يستخدم Evidence/Document/Workflow/Task engines ولا يعيد بناءها.
11. **Privacy by Design:** تقليل البيانات، فصل المستأجرين، صلاحيات دقيقة، سجل تدقيق وطمس بيانات حساسة.
12. **Backward Compatibility:** ملفات السنة أو الإصدار القديم لا تتغير بسبب تحديث جديد.

---

# 6. ترتيب المنتج والإصدارات

## MVP / V1

### P0 — شواهد الأداء الوظيفي + إنشاء الشاهد الذكي

- اختيار الدور الوظيفي والتكليفات.
- عرض عناصر ومعايير الأداء حسب الإصدار.
- اقتراح أنواع الشواهد المناسبة.
- إنشاء مواد قابلة للإنشاء: إعلان، استبانة، QR، شهادة، نموذج حضور، محضر، خطاب، قالب تقرير.
- رفع دليل التنفيذ الحقيقي: صورة، فيديو، ملف، رابط، نتيجة، سجل.
- تحليل الشاهد وتصنيفه مع درجة ثقة.
- اكتشاف النواقص والتكرار والبيانات الحساسة.
- ربط الشاهد بأكثر من سياق بصورة محكومة.
- لوحة اكتمال ومراجعة واعتماد وتصدير.

### P1 — التقارير الذكية

- تقرير برنامج/مبادرة/اجتماع/زيارة/ورشة/فعالية/استراتيجية.
- تعبئة من البيانات الموجودة بدل إعادة الكتابة.
- صور ومرفقات وقياس أثر.
- Word/PDF/رابط/QR.
- Versioning وApproval workflow.

### P2 — التقويم الذاتي

- مجالات ومعايير ومؤشرات ذات إصدارات.
- شواهد مرتبطة بالمؤشرات.
- نقاط قوة وفرص تحسين.
- لوحة اكتمال وتقرير تشخيصي.

## بعد تحقق Product-Market Fit

### P3 — خطة التحسين

الفجوة ← هدف ← مبادرة ← مالك ← مؤشر ← خط أساس ← مستهدف ← تنفيذ ← قياس أثر ← شاهد.

### P4 — الخطة التشغيلية

تحويل الأهداف والمبادرات إلى برامج وجداول ومسؤوليات وتكاليف ومؤشرات ومتابعة.

### P5 — التوسع القطاعي

النشاط، التوجيه الطلابي، الصحة، الأمن والسلامة، المختبر، مصادر التعلم، اللجان، الشراكة المجتمعية، التطوع، نواتج التعلم، NAFS، وغيرها، وكلها فوق النواة نفسها.

---

# 7. النواة المعمارية المستهدفة

```text
SERS Platform
├── Identity & Access
│   ├── Person
│   ├── Tenant / School
│   ├── Membership
│   ├── Job Position
│   ├── Role Assignment
│   ├── Committee / Team Membership
│   └── RBAC + ABAC policies
├── Academic Context
│   ├── Country / Authority
│   ├── Academic Year / Term / Week
│   ├── School Type / Stage
│   └── Localization / Calendar
├── Official Requirements Registry
│   ├── Authority Document
│   ├── Version
│   ├── Requirement / Criterion / Indicator
│   ├── Effective Dates
│   └── Applicability Rules
├── Work Engine
│   ├── Work Item / Activity / Program / Meeting / Initiative
│   ├── Participants
│   ├── Tasks / Milestones
│   ├── Results / Impact Measures
│   └── Status Lifecycle
├── Smart Evidence Engine
│   ├── Evidence Asset
│   ├── Provenance / Ownership / Hash
│   ├── Classification / Tags / Confidence
│   ├── Evidence Links
│   ├── Quality Checks
│   └── Privacy Checks
├── Document Engine
│   ├── Dynamic Schema
│   ├── Template / Theme
│   ├── Merge Data
│   ├── Word / PDF / Image
│   └── Print QA
├── Workflow & Approvals
│   ├── Draft / Review / Changes Requested / Approved / Archived
│   ├── Assignments
│   ├── Notifications
│   └── Audit Trail
├── Performance Lifecycle
├── Self-Evaluation
├── Improvement Planning
├── Operational Planning
├── AI Gateway & Governance
├── Search & Knowledge Graph
├── Billing / Entitlements
└── Observability / Operations
```

## قرار معماري مبدئي للبيانات

- البيانات الحرجة والعلاقات والمعاملات: **Relational source of truth**.
- Firestore أو أي مخزن ديناميكي: استخدام انتقائي لبيانات realtime أو projections، وليس كمصدر وحيد غير محكوم لكل المجال.
- الملفات الأصلية: Object Storage مع metadata في قاعدة البيانات.
- البحث: index مشتق قابل لإعادة البناء.
- PDF/thumbnail/AI summaries: derived artifacts قابلة لإعادة التوليد.

يجب توثيق القرار النهائي في ADR قبل migration كبير.

---

# 8. نموذج الشاهد المستهدف

الشاهد ليس مجرد صف يحتوي `file_path`.

## الحقول/العلاقات الأساسية

- `id`
- `tenant_id`
- `academic_year_id`
- `owner_person_id`
- `source_work_item_id`
- `evidence_type`
- `original_asset_id`
- `mime_type / size / checksum`
- `captured_at / uploaded_at`
- `provenance_type`
- `privacy_classification`
- `contains_minors / contains_pii`
- `status`
- `approval_status`
- `quality_score`
- `ai_confidence`
- `human_verified_at/by`
- `metadata`
- `tags`
- `version`

## Evidence Links

جدول/كيان مستقل يربط الشاهد بـ:

- عنصر أداء.
- مؤشر تقويم ذاتي.
- تقرير.
- مبادرة تحسين.
- برنامج تشغيلي.
- لجنة أو تكليف.
- قياس أثر.

كل رابط يحتفظ بسبب الربط، والمستخدم الذي اعتمده، والتاريخ، والإصدار.

## التمييز الأخلاقي والوظيفي

### ما يستطيع النظام إنشاءه

- قالب إعلان.
- استبانة.
- QR.
- شهادة.
- محضر.
- نموذج حضور.
- خطة تنفيذ.
- بطاقة متابعة.
- تقرير أولي يحتاج تأكيد المستخدم.

### ما لا يجوز للنظام اختلاقه

- صورة تنفيذ لم يحدث.
- أسماء حضور غير حقيقية.
- نتيجة قياس لم تُجمع.
- توقيع أو ختم منسوب لشخص دون اعتماد.
- فيديو أو رابط يوحي بتنفيذ واقعي غير موجود.

---

# 9. مصفوفة المصالحة: الموجود مقابل vNext

| المكون الحالي | القرار | سبب القرار / العمل المطلوب |
|---|---|---|
| Authentication / Sessions | KEEP + MODIFY | إضافة Tenant Memberships، دورة انتقال الموظف، MFA لاحقًا، وسياسات الجلسات |
| User model الحالي | REBUILD تدريجي | فصل Person عن Membership وJob Position وAssignments |
| Marketplace | DEFER + ISOLATE | يبقى Bounded Context تجاريًا، لكنه ليس مركز MVP |
| Orders / Stripe | KEEP + HARDEN | Idempotency، webhook reconciliation، entitlements، refunds |
| Wallet / Referrals | DEFER | ليست أولوية لنواة المدرسة؛ توضع خلف Feature Flag |
| Template marketplace | KEEP | قناة توزيع، مع فصلها عن Domain Core |
| Dynamic template editor | KEEP + MODIFY | يتحول إلى Document/Schema Engine عام |
| PDF/Image/Word Export | KEEP + REBUILD أجزاء | Queue، RTL/Arabic QA، print preflight، deterministic rendering |
| AIController الضخم | REBUILD | تقسيمه إلى AI Gateway، Prompt Registry، Jobs، Evaluation، Providers |
| Current Evidence CRUD | REBUILD + MIGRATE | تحويله إلى Evidence Aggregate مع provenance، privacy، links، approvals |
| QR / Link support | KEEP | يصبح نوع Asset أو presentation للشاهد |
| Content Library | KEEP + MODIFY | فصل المحتوى العام عن مكتبة المدرسة الخاصة وحقوق الاستخدام |
| EducationalServiceController العام | REBUILD تدريجي | استبدال الخدمات المنفصلة بوحدات فوق Work/Evidence/Document engines |
| UserTemplateData | MODIFY / ADAPTER | استخدام Adapter أثناء الانتقال ثم نقل البيانات للمجال الجديد |
| Version History | KEEP + EXTEND | تعميمه على Evidence/Work/Documents/Requirements |
| Transactional Outbox | KEEP + EXTEND | استخدامه لأحداث المجال، البحث، الإشعارات وprojections |
| Queue / Async AI | KEEP + HARDEN | Retry/backoff/DLQ/idempotency/cost tracking |
| Health endpoint | KEEP + EXTEND | إضافة storage، queue lag، AI provider، export، search، webhook health |
| CI pipeline | KEEP + HARDEN | Lint، frontend tests، migration tests، security gating، no `audit || true` |
| i18n / RTL | KEEP + QA | اختبارات RTL، هجري/ميلادي، أرقام عربية، PDF fonts |
| Admin dashboard | KEEP + REDESIGN | إدارة Registry، roles، tenants، prompts، versions، flags |
| TenantScope | REBUILD + ACTIVATE | النموذج الحالي Groundwork فقط؛ يلزم tenant tables وسياسات وعزل واختبارات |
| RBAC Admin/User | REBUILD | Role Assignments + permissions scoped بالمدرسة والسياق |
| School/Tenant Domain | MISSING | بناء Tenant/School/Membership من الصفر أو migration واضح |
| Academic Year Engine | MISSING | سنوات وفصول وأسابيع وترحيل وأرشفة |
| Official Requirements Registry | MISSING | معايير وإصدارات وتواريخ سريان وقابلية تطبيق |
| Performance Lifecycle | MISSING جزئيًا | الموجود نماذج/شواهد، وليس دورة أداء مكتملة |
| Self-Evaluation | MISSING | بناء مجال كامل بعد نواة الشواهد |
| Improvement Planning | MISSING | بناء بعد التقويم الذاتي |
| Operational Planning | MISSING | بناء بعد التحسين |
| Generic Workflow Engine | MISSING | حالات، approvals، assignments، SLA، audit |
| Evidence Graph | MISSING | علاقات متعددة قابلة للاستعلام وإعادة الاستخدام |
| AI Governance | MISSING جزئيًا | provenance، confidence، evaluations، redaction، provider abstraction |
| Privacy tooling | MISSING جزئيًا | PII detection، face/name redaction، retention، consent basis |
| Backup / DR / Restore drills | MISSING | خطط واختبارات فعلية |
| Product analytics | PARTIAL | تحويلها إلى KPIs للرحلات لا للمبيعات فقط |

---

# 10. حالات الفشل الإلزامية

كل Feature Specification يجب أن تحتوي:

- Preconditions.
- Main flow.
- Alternate flows.
- Validation.
- Failure paths.
- Recovery path.
- Permissions.
- Privacy.
- Audit.
- Performance budget.
- Acceptance criteria.

## مثال رفع شاهد

| الحالة | السلوك المطلوب |
|---|---|
| انقطع الإنترنت | حفظ مسودة محلية/استئناف الرفع إن أمكن |
| ملف غير مدعوم | رفض واضح قبل المعالجة |
| ملف كبير | توضيح الحد وخيار ضغط/رفع بديل |
| Malware | عزل الملف وعدم جعله متاحًا |
| Duplicate | تنبيه مع خيار استخدام الموجود |
| تم التخزين وفشل AI | يبقى الشاهد محفوظًا، وتُعاد مهمة التحليل |
| فشل DB بعد التخزين | تنظيف/تعويض أو reconciliation job |
| Low AI confidence | لا يربط تلقائيًا؛ يطلب مراجعة بشرية |
| يحتوي بيانات طالب | تنبيه/طمس/تقييد المشاركة |
| تغيرت صلاحية المستخدم | إيقاف العملية قبل الاعتماد وتسجيل الحدث |

## آليات مطلوبة

- Transactions.
- Idempotency keys.
- Retry with exponential backoff.
- Dead-letter queue.
- Timeouts.
- Circuit breakers.
- Autosave.
- Optimistic locking.
- Soft delete + retention.
- Audit logs.
- Compensating actions.
- Reconciliation jobs.
- Feature flags.
- Rollback strategy.

> معيار القبول: **الميزة تعمل، وتفشل بأمان، وتتفاعل بوضوح، ولا تفقد البيانات، ولا تكشف بيانات مستأجر آخر.**

---

# 11. الأمن والخصوصية

## P0

- Tenant isolation على مستوى query والسياسات والاختبارات.
- منع IDOR والوصول عبر روابط قديمة.
- Upload validation + malware scanning.
- Signed URLs وانتهاء صلاحيتها.
- Encryption in transit/at rest.
- Secrets خارج الكود وتدويرها.
- Audit trail لعمليات القراءة/التحميل الحساسة.
- Data classification.
- Retention/deletion rules.
- عدم إرسال PII إلى AI قبل redaction أو وجود أساس معالجة مناسب.
- توضيح الفرق بين اعتماد داخلي وتوقيع إلكتروني نظامي.

## ملاحظة مستودع

README الحالي يعرض حسابات وكلمة مرور تجريبية. يجب التأكد فورًا أنها بيانات محلية فقط وغير صالحة لأي بيئة منشورة. في الإصدار الإنتاجي تُستبدل بآلية Demo آمنة أو بيانات seed عشوائية.

---

# 12. استراتيجية الذكاء الاصطناعي

## AI Gateway

لا يتصل كل Controller بمزود مباشرة. يستخدم النظام Gateway يدعم:

- Provider routing.
- Model/version registry.
- Prompt versioning.
- Input redaction.
- Cost and quota tracking.
- Caching عند ملاءمة الحالة.
- Structured output validation.
- Retry/fallback.
- Confidence and human review.
- Evaluation telemetry.

## Golden Test Set

يُنشأ Dataset داخلي يغطي:

- تصنيف الشواهد.
- مطابقة المؤشرات.
- اكتشاف النواقص.
- إنشاء التقرير.
- العربية الرسمية.
- رفض اختلاق التنفيذ.
- Prompt injection داخل الملفات.

لا يطلق تحديث AI إذا انخفض عن thresholds المعتمدة.

---

# 13. خطة التنفيذ المرحلية

## Phase 0 — Reconciliation & Freeze

- اعتماد هذه الوثيقة.
- استخراج/استعادة أي artifacts سابقة فعلية.
- وسم المستندات القديمة بأنها Legacy/Historical.
- إنشاء Decision Register وADRs.
- توثيق current DB schema وAPI inventory.
- اختبار Build/CI على branch نظيف.
- تحديد migration strategy وعدم حذف أي بيانات.

**Gate:** لا توجد ادعاءات تنفيذ غير قابلة للتتبع.

## Phase 1 — Foundation

- Tenant/School/Membership.
- Person/Job Position/Role Assignment.
- Academic Year.
- Requirements Registry.
- Work Item Core.
- Evidence Aggregate + Assets + Evidence Links.
- Permissions policies.
- Audit/Event model.
- Feature flags.

**Gate:** اختبارات عزل المستأجرين، migration، CRUD، concurrency، audit.

## Phase 2 — Performance Evidence MVP

- Role-based onboarding.
- Performance criteria view.
- Evidence suggestions.
- Smart Evidence Creation.
- Upload/import/link/video/file.
- Quality/privacy checks.
- Review/approval.
- Completion dashboard.
- Export package.

**Gate:** تجربة مستخدم حقيقية لعدة وظائف، لا اختلاق، مخرجات RTL صحيحة.

## Phase 3 — Smart Reports

- Work-to-report.
- Reuse evidence.
- Impact measures.
- Word/PDF/QR/share links.

## Phase 4 — Self-Evaluation

- Standards/indicators.
- Evidence mapping.
- gap diagnosis.

## Phase 5 — Improvement & Operational Planning

- gap to improvement initiative.
- improvement to operational program.
- execution and impact loop.

---

# 14. قائمة شاشات V1

1. تسجيل/دخول/استعادة.
2. اختيار أو إنشاء مساحة المدرسة/الحساب الفردي.
3. Onboarding: الوظيفة + التكليفات + العام الدراسي.
4. Workspace Home حسب الدور.
5. ملف الأداء الوظيفي.
6. قائمة المعايير والعناصر.
7. تفاصيل العنصر ونسبة الاكتمال.
8. Evidence Library.
9. إنشاء شاهد ذكي.
10. اقتراح الشواهد.
11. رفع/استيراد شاهد.
12. تحليل وجودة الشاهد.
13. ربط الشاهد بسياقات متعددة.
14. مراجعة واعتماد.
15. إنشاء تقرير ذكي.
16. محرر التقرير.
17. Preview/print preflight.
18. Export/Share/QR.
19. Notifications/Tasks.
20. Profile/School settings.
21. Admin Registry.
22. Admin Roles/Permissions.
23. Admin Templates/Prompts/Versions.
24. Audit and operational health.

---

# 15. مقاييس نجاح المنتج

## Product KPIs

- Time to first useful evidence.
- Time to first completed report.
- Evidence completion rate.
- Evidence reuse rate مع صحة الربط.
- نسبة الاقتراحات المقبولة/المعدلة/المرفوضة.
- نسبة المعايير بلا شواهد.
- زمن إعداد ملف الأداء مقارنة بالطريقة اليدوية.
- Retention حسب الدور والمدرسة.
- Conversion من التجربة إلى الاشتراك.

## Engineering SLOs المقترحة كبداية

- P95 للعمليات التفاعلية الأساسية أقل من 3 ثوانٍ، باستثناء المعالجة الثقيلة غير المتزامنة.
- عدم فقد البيانات في العمليات المؤكدة.
- عزل tenant مثبت باختبارات آلية.
- Availability هدف مرحلي يحدد بعد اختيار البنية الإنتاجية.
- RPO/RTO يحددان رسميًا قبل Pilot.

## AI KPIs

- Classification accuracy.
- Missing-data detection precision/recall.
- Hallucination/fabrication rate = صفر في حالات الأدلة الواقعية المقبولة.
- Human override rate.
- Cost per completed workflow.

---

# 16. Definition of Done

لا تعتبر الميزة منجزة إلا إذا:

- المتطلبات ومعايير القبول مكتوبة.
- الصلاحيات والعزل مختبران.
- Happy/Alternate/Failure/Recovery paths مختبرة.
- RTL والجوال والطباعة صحيحة.
- Validation ورسائل الخطأ واضحة.
- Audit وtelemetry موجودان.
- لا توجد أسرار في الكود.
- الوثائق وAPI schema محدثة.
- migrations قابلة للتطبيق والتراجع أو التعويض.
- الاختبارات الآلية ناجحة.
- تم UAT مع الدور المستهدف.
- يوجد rollback/feature flag للميزات عالية المخاطر.

---

# 17. المخاطر المفتوحة

| الخطر | المستوى | المعالجة |
|---|---:|---|
| التوسع فوق المجال القديم دون فصل | حرج | Strangler architecture + bounded contexts |
| فقد أعمال الوكلاء السابقة | عالٍ | Artifact recovery وإثبات Commit/Source |
| Tenant isolation غير مفعّل | حرج | Phase 1 قبل أي Pilot مدرسي |
| AI Controller monolith | عالٍ | AI Gateway وتقسيم الخدمات |
| Hybrid DB بلا source-of-truth واضح | عالٍ | ADR للبيانات وoutbox/projections |
| توسع الخدمات قبل تثبيت النواة | حرج | منع أي module جديد قبل Core contracts |
| وثائق متعارضة | عالٍ | تصنيف Legacy واعتماد baseline واحدة |
| بيانات قُصّر في الصور والفيديو | حرج | Privacy tooling وسياسات مشاركة |
| PDF/Word عربي غير ثابت | عالٍ | Render service + golden documents |
| تكلفة AI والتخزين والفيديو | متوسط/عالٍ | quotas، compression، lifecycle، cost telemetry |

---

# 18. القرارات التي تعتمد بهذه الوثيقة

1. SERS يتحول من Template Marketplace مركزي إلى School Work OS، مع بقاء المتجر كقناة/وحدة مستقلة.
2. Evidence Engine هو قلب V1.
3. لا نضيف قسمًا جديدًا قبل استخدامه للمحركات المشتركة.
4. البيانات هي الأصل والمستندات مخرجات.
5. لا دليل واقعي مولد على نشاط غير منفذ.
6. Multi-tenancy وrole assignments متطلبات تأسيسية وليست تحسينات لاحقة.
7. Requirements Registry وAcademic Year جزءان من النواة.
8. نستخدم migration تدريجية، لا Big Bang rewrite.
9. أي عمل سابق غير موجود في Git/ملف قابل للفحص لا يُحسب منفذًا.
10. تبدأ البرمجة الجديدة بعد Phase 0 Gate.

---

# 19. المطلوب مباشرة بعد اعتماد الـPR

1. إنشاء `docs/vnext/DECISION_REGISTER.md` وADR template.
2. استخراج API/DB inventory آليًا.
3. إنشاء `LEGACY_MAP` يربط كل route/page/controller بقرار KEEP/MODIFY/REBUILD/DEFER.
4. إنشاء branch هندسي لـPhase 1 فقط.
5. بناء migrations للنواة دون تعديل أو حذف بيانات legacy.
6. إضافة tenant isolation tests أولًا.
7. بناء Vertical Slice واحد:

```text
Person + School + Role Assignment
→ Work Item
→ Evidence Upload
→ Evidence Link
→ Review
→ Export
```

8. لا يبدأ التقويم الذاتي أو الخطط قبل نجاح هذا الـVertical Slice.

---

## الخلاصة

المشروع الحالي يحتوي قيمة كبيرة قابلة للاستفادة، لكنه لا يطابق بالكامل الرؤية الجديدة. القرار الصحيح ليس إلغاءه ولا اعتباره مكتملًا، بل **تثبيت Baseline جديدة، فصل النطاقات، وبناء النواة الجديدة تدريجيًا مع اختبارات عزل وفشل واسترداد منذ البداية**.

هذه الوثيقة هي نقطة المصالحة الأولى، وليست ادعاء بأن vNext منفذ بالفعل.
