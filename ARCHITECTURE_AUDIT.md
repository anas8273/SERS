# تدقيق معماري - SERS

## الأجزاء المخالفة للقواعد المعمارية:

### 1. صفحات Hardcoded (يجب إزالتها أو تحويلها لديناميكية):
- `/services/page.tsx` - 13 خدمة hardcoded
- `/services/[slug]/page.tsx` - تفاصيل خدمات hardcoded
- `/editor/[slug]/page.tsx` - يستخدم slug بدل templateId، وبه بيانات ثابتة

### 2. الأجزاء الجيدة الموجودة:
- `TemplateField` type - يحتوي على position_x/y/width/height (جيد!)
- `firebase.ts` - Firebase مهيأ
- `SchemaBuilder.tsx` - Form Builder موجود
- `TemplateMapper.tsx` - Template Mapper موجود
- `AIPromptManager.tsx` - AI Prompt Manager موجود
- `TemplateVariant` - variants موجودة

### 3. ما يحتاج إعادة هيكلة:
- تحويل `/editor/[slug]` إلى `/editor/[templateId]` يجلب من Firestore
- تحويل `/services` لتقرأ من DB بدل hardcode
- تحويل `/marketplace` لتقرأ من DB بدل hardcode
- إضافة Firestore collections: Template_Canvas, Dynamic_Forms, AI_Prompts
- تحديث Types لتشمل Canvas و AI Prompts

### 4. استراتيجية التنفيذ:
- الحفاظ على الصفحات الموجودة (analyses, portfolio, etc.) لأنها أدوات مستقلة
- تحويل المحرر ليكون ديناميكي 100%
- تحويل المتجر ليقرأ من API/DB
- تحويل الخدمات لتقرأ من DB
