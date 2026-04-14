<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>حالة طلب السحب — SERS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f0f4f8; color: #1a202c; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; }
        .header-approved { background: linear-gradient(135deg, #059669, #10b981); padding: 40px 32px; text-align: center; border-radius: 16px 16px 0 0; }
        .header-rejected { background: linear-gradient(135deg, #dc2626, #ef4444); padding: 40px 32px; text-align: center; border-radius: 16px 16px 0 0; }
        .header h1 { color: white; font-size: 24px; font-weight: 800; margin-bottom: 8px; }
        .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
        .body { background: white; padding: 36px 32px; }
        .greeting { font-size: 19px; font-weight: 700; color: #1a202c; margin-bottom: 12px; }
        .text { font-size: 15px; color: #4a5568; line-height: 1.7; margin-bottom: 20px; }
        .amount-box-approved { background: #f0fdf4; border: 1px solid #86efac; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0; }
        .amount-box-rejected { background: #fff5f5; border: 1px solid #feb2b2; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0; }
        .amount-label { font-size: 13px; color: #718096; margin-bottom: 8px; }
        .amount-value-approved { font-size: 32px; font-weight: 800; color: #059669; }
        .amount-value-rejected { font-size: 32px; font-weight: 800; color: #dc2626; }
        .sar { font-size: 18px; }
        .reason-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
        .reason-title { font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 8px; }
        .reason-text { font-size: 14px; color: #78350f; line-height: 1.6; }
        .cta { text-align: center; margin: 28px 0 16px; }
        .btn-approved { display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: white; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 700; }
        .btn-rejected { display: inline-block; background: linear-gradient(135deg, #7c3aed, #6366f1); color: white; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 700; }
        .footer { background: #f7fafc; padding: 24px 32px; text-align: center; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 12px; color: #a0aec0; }
        .footer .brand { font-size: 16px; font-weight: 800; color: #7c3aed; margin-bottom: 4px; }
    </style>
</head>
<body>
<div style="padding: 24px;">
<div class="container">

    @if($status === 'completed')
    <div class="header header-approved">
        <div style="font-size: 36px; margin-bottom: 12px;">✅</div>
        <h1>تمت الموافقة على طلب السحب!</h1>
        <p>سيتم تحويل المبلغ خلال 2–5 أيام عمل</p>
    </div>
    @else
    <div class="header header-rejected">
        <div style="font-size: 36px; margin-bottom: 12px;">❌</div>
        <h1>تم رفض طلب السحب</h1>
        <p>يمكنك إعادة تقديم طلب جديد بعد مراجعة السبب</p>
    </div>
    @endif

    <div class="body">
        <p class="greeting">مرحباً 👋</p>

        @if($status === 'completed')
        <p class="text">
            تمت مراجعة طلب سحب أرباح إحالتك والموافقة عليه. سيتم تحويل المبلغ إلى حسابك خلال 2–5 أيام عمل.
        </p>

        <div class="amount-box-approved">
            <div class="amount-label">المبلغ المعتمد للصرف</div>
            <div class="amount-value-approved">{{ $amount }} <span class="sar">ر.س</span></div>
        </div>
        @else
        <p class="text">
            تمت مراجعة طلب سحب أرباح إحالتك، لكن لم نتمكن من الموافقة عليه في الوقت الحالي.
        </p>

        <div class="amount-box-rejected">
            <div class="amount-label">المبلغ المطلوب سحبه</div>
            <div class="amount-value-rejected">{{ $amount }} <span class="sar">ر.س</span></div>
        </div>

        @if($adminNotes)
        <div class="reason-box">
            <div class="reason-title">💬 سبب الرفض</div>
            <div class="reason-text">{{ $adminNotes }}</div>
        </div>
        @endif

        <p class="text">
            تم إعادة الرصيد إلى رصيدك المتاح في برنامج الإحالة. يمكنك تقديم طلب جديد في أي وقت.
        </p>
        @endif

        <div class="cta">
            @if($status === 'completed')
            <a href="{{ $dashUrl }}" class="btn-approved">عرض رصيدي</a>
            @else
            <a href="{{ $dashUrl }}" class="btn-rejected">إعادة المحاولة</a>
            @endif
        </div>
    </div>

    <div class="footer">
        <p class="brand">SERS</p>
        <p>© {{ date('Y') }} SERS. جميع الحقوق محفوظة.</p>
    </div>
</div>
</div>
</body>
</html>
