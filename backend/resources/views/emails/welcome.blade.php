<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>أهلاً بك في SERS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f0f4f8; color: #1a202c; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #7c3aed, #a855f7, #6366f1); padding: 48px 32px; text-align: center; border-radius: 16px 16px 0 0; }
        .header-logo { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .header h1 { color: white; font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .header p { color: rgba(255,255,255,0.8); font-size: 15px; }
        .body { background: white; padding: 40px 32px; }
        .greeting { font-size: 22px; font-weight: 700; color: #1a202c; margin-bottom: 12px; }
        .text { font-size: 15px; color: #4a5568; line-height: 1.7; margin-bottom: 20px; }
        .features { display: flex; gap: 16px; margin: 28px 0; flex-wrap: wrap; }
        .feature { flex: 1; min-width: 140px; background: #f7f3ff; border-radius: 12px; padding: 20px 16px; text-align: center; border: 1px solid #e9d8fd; }
        .feature .icon { font-size: 28px; margin-bottom: 8px; }
        .feature .title { font-size: 13px; font-weight: 700; color: #553c9a; }
        .feature .desc { font-size: 12px; color: #718096; margin-top: 4px; }
        .cta { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #6366f1); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 15px rgba(124,58,237,0.35); }
        .divider { height: 1px; background: #e2e8f0; margin: 28px 0; }
        .secondary-links { text-align: center; margin: 20px 0; }
        .secondary-links a { color: #7c3aed; text-decoration: none; font-size: 14px; font-weight: 600; margin: 0 14px; }
        .footer { background: #f7fafc; padding: 24px 32px; text-align: center; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 12px; color: #a0aec0; line-height: 1.7; }
        .footer .brand { font-size: 16px; font-weight: 800; color: #7c3aed; margin-bottom: 8px; }
    </style>
</head>
<body>
<div style="padding: 24px;">
<div class="container">
    <!-- Header -->
    <div class="header">
        <div class="header-logo">
            <span style="font-size:24px;">🎓</span>
        </div>
        <h1>أهلاً بك في SERS!</h1>
        <p>منصة السجلات التعليمية الذكية</p>
    </div>

    <!-- Body -->
    <div class="body">
        <p class="greeting">مرحباً، {{ $user->name ?? 'المستخدم الكريم' }} 👋</p>

        <p class="text">
            يسعدنا انضمامك إلى منصة <strong>SERS</strong> — المنصة الرائدة في المملكة العربية السعودية لتصميم السجلات والقوالب التعليمية الاحترافية.
        </p>

        <p class="text">
            بإمكانك الآن الوصول إلى مئات القوالب التعليمية الجاهزة، والخدمات التفاعلية المدعومة بالذكاء الاصطناعي.
        </p>

        <!-- Features -->
        <div class="features">
            <div class="feature">
                <div class="icon">📚</div>
                <div class="title">قوالب جاهزة</div>
                <div class="desc">محافظ، شهادات، اختبارات</div>
            </div>
            <div class="feature">
                <div class="icon">🤖</div>
                <div class="title">ذكاء اصطناعي</div>
                <div class="desc">مساعد ذكي لملء النماذج</div>
            </div>
            <div class="feature">
                <div class="icon">💰</div>
                <div class="title">برنامج الإحالة</div>
                <div class="desc">اكسب 10% عمولة</div>
            </div>
        </div>

        <!-- CTA -->
        <div class="cta">
            <a href="{{ $dashUrl }}" class="btn">ابدأ الآن 🚀</a>
        </div>

        <div class="divider"></div>

        <!-- Secondary Links -->
        <div class="secondary-links">
            <a href="{{ $marketUrl }}">تصفح المتجر</a>
            <a href="{{ $servicesUrl }}">الخدمات التعليمية</a>
        </div>

        <p class="text" style="font-size:13px; color: #718096; text-align: center; margin-top: 16px;">
            إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذا البريد أو التواصل معنا.
        </p>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p class="brand">SERS</p>
        <p>منصة السجلات التعليمية الذكية · المملكة العربية السعودية</p>
        <p style="margin-top: 8px;">© {{ date('Y') }} SERS. جميع الحقوق محفوظة.</p>
    </div>
</div>
</div>
</body>
</html>
