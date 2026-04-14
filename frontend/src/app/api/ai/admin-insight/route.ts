import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/api-rate-limit';

/**
 * POST /api/ai/admin-insight
 *
 * Server-side route that calls the Groq API using GROQ_API_KEY (server-only env var).
 * Accepts a `locale` field in the request body to generate insights in the correct language.
 */
export async function POST(request: NextRequest) {
    try {
        // [AUDIT FIX] Rate limit: 20 requests per minute per IP (higher for admin pages)
        const ip = getClientIP(request);
        const limit = checkRateLimit(`insight:${ip}`, { maxRequests: 20, windowMs: 60_000 });
        if (!limit.allowed) {
            return NextResponse.json(
                { success: false, error: 'Too many requests', retryAfter: limit.retryAfter },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { pathname, locale } = body;

        if (!pathname || typeof pathname !== 'string') {
            return NextResponse.json(
                { success: false, error: 'pathname is required' },
                { status: 400 }
            );
        }

        // Server-only key — never exposed to the client bundle
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'AI service not configured' },
                { status: 503 }
            );
        }

        // Build a locale-aware system prompt so Groq answers in the right language
        const isEnglish = locale === 'en';

        const systemContext = isEnglish
            ? `You are a silent analytics system running in the background for the SERS Saudi educational platform.
Current page: ${pathname}.
Task: Provide ONE highly useful sentence (a smart data-driven insight or professional tip) that helps the system administrator on this specific page.
Rules: No greeting, no conversational tone. Deliver the insight directly and professionally. Write in English only.`
            : `أنت نظام تحليل صامت يعمل في الخلفية لمنصة SERS التعليمية السعودية.
نحن الآن في صفحة: ${pathname}.
المطلوب: جملة واحدة مفيدة جداً (تحليل ذكي أو نصيحة احترافية مبنية على البيانات) تفيد مدير النظام في هذه الصفحة.
ممنوع استخدام أسلوب المحادثة أو إلقاء التحية. أعطني المعلومة مباشرة وبطريقة احترافية.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemContext },
                ],
                temperature: 0.7,
                max_tokens: 150,
            }),
            // 10-second server-side timeout
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('[admin-insight] Groq API error:', response.status, errorText.slice(0, 200));
            return NextResponse.json(
                { success: false, error: 'AI service unavailable' },
                { status: 503 }
            );
        }

        const result = await response.json();
        const text: string = result.choices?.[0]?.message?.content || '';

        return NextResponse.json({
            success: true,
            insight: text.replace(/[\"'*]/g, '').trim(),
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[admin-insight] route error:', msg);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
