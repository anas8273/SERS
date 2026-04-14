<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طلبك مكتمل — SERS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f0f4f8; color: #1a202c; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #059669, #10b981, #34d399); padding: 40px 32px; text-align: center; border-radius: 16px 16px 0 0; }
        .header h1 { color: white; font-size: 26px; font-weight: 800; margin-bottom: 8px; }
        .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
        .order-badge { background: rgba(255,255,255,0.2); display: inline-block; color: white; font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 20px; margin-top: 12px; font-family: monospace; }
        .body { background: white; padding: 36px 32px; }
        .greeting { font-size: 19px; font-weight: 700; color: #1a202c; margin-bottom: 12px; }
        .text { font-size: 15px; color: #4a5568; line-height: 1.7; margin-bottom: 20px; }
        .section-title { font-size: 13px; font-weight: 700; color: #718096; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; margin-top: 24px; }
        .template-item { display: flex; align-items: center; gap: 14px; padding: 14px; background: #f7fffe; border: 1px solid #d1fae5; border-radius: 12px; margin-bottom: 10px; }
        .template-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #059669, #10b981); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .template-name { font-size: 14px; font-weight: 700; color: #065f46; }
        .template-price { font-size: 13px; color: #10b981; margin-top: 2px; }
        .total-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 12px; padding: 16px 20px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
        .total-label { font-size: 15px; font-weight: 700; color: #065f46; }
        .total-value { font-size: 20px; font-weight: 800; color: #059669; }
        .cta { text-align: center; margin: 32px 0 16px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 15px rgba(5,150,105,0.35); }
        .footer { background: #f7fafc; padding: 24px 32px; text-align: center; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 12px; color: #a0aec0; }
        .footer .brand { font-size: 16px; font-weight: 800; color: #059669; margin-bottom: 4px; }
    </style>
</head>
<body>
<div style="padding: 24px;">
<div class="container">
    <div class="header">
        <div style="font-size: 36px; margin-bottom: 12px;">🎉</div>
        <h1>طلبك مكتمل بنجاح!</h1>
        <p>قوالبك جاهزة للتحميل الآن</p>
        <div class="order-badge"># {{ $order->order_number }}</div>
    </div>

    <div class="body">
        <p class="greeting">مرحباً، {{ $order->user->name ?? 'المستخدم الكريم' }} 👋</p>
        <p class="text">
            تمت معالجة طلبك بنجاح، ويمكنك الآن تحميل قوالبك من لوحة تحكمك مباشرة.
        </p>

        <p class="section-title">📦 القوالب المشتراة</p>

        @foreach($items as $item)
        <div class="template-item">
            <div class="template-icon">📄</div>
            <div>
                <div class="template-name">{{ $item->template?->name_ar ?? $item->template_name }}</div>
                <div class="template-price">{{ number_format($item->price, 2) }} ر.س</div>
            </div>
        </div>
        @endforeach

        <div class="total-box">
            <div class="total-label">المجموع الإجمالي</div>
            <div class="total-value">{{ number_format($order->total, 2) }} ر.س</div>
        </div>

        <div class="cta">
            <a href="{{ $dashUrl }}" class="btn">تحميل القوالب ⬇️</a>
        </div>

        <p style="font-size: 13px; color: #718096; text-align: center;">
            إذا واجهت أي مشكلة في التحميل، يرجى التواصل مع الدعم الفني.
        </p>
    </div>

    <div class="footer">
        <p class="brand">SERS</p>
        <p>© {{ date('Y') }} SERS. جميع الحقوق محفوظة.</p>
    </div>
</div>
</div>
</body>
</html>
