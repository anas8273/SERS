import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/api-rate-limit';

/**
 * AI-Powered Template Recommendations
 * Uses Groq (llama-3.3-70b) to recommend templates based on catalog analysis.
 * Migrated from Gemini → Groq to match the rest of the AI stack.
 */
export async function POST(request: NextRequest) {
    try {
        // [AUDIT FIX] Rate limit: 15 requests per minute per IP
        const ip = getClientIP(request);
        const limit = checkRateLimit(`recommend:${ip}`, { maxRequests: 15, windowMs: 60_000 });
        if (!limit.allowed) {
            return NextResponse.json(
                { success: false, error: 'Too many requests', retryAfter: limit.retryAfter },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { templates, currentTemplate } = body;

        if (!templates?.length) {
            return NextResponse.json({ success: true, recommendations: [], source: 'empty' });
        }

        // Use GROQ_API_KEY (server-only, no NEXT_PUBLIC_ prefix)
        const apiKey = process.env.GROQ_API_KEY;

        // If no API key, use smart fallback
        if (!apiKey) {
            return NextResponse.json({
                success: true,
                recommendations: getSmartFallback(templates, currentTemplate),
                source: 'fallback',
            });
        }

        try {
            const catalog = templates.slice(0, 25).map((t: any) => ({
                id: t.id,
                name: t.name_ar,
                category: t.category?.name_ar || '',
                price: t.price,
                downloads: t.downloads_count || 0,
                rating: t.average_rating || 0,
            }));

            const prompt = `أنت نظام توصيات ذكي لمتجر قوالب تعليمية.

القوالب المتاحة:
${JSON.stringify(catalog)}

${currentTemplate ? `القالب الحالي: "${currentTemplate.name_ar}"` : 'الصفحة الرئيسية'}

اقترح 6 قوالب مناسبة (أعط أولوية للتنوع والشعبية).
أجب بـ JSON فقط: {"ids": ["id1","id2","id3","id4","id5","id6"]}`;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: 'You are a JSON-only recommendation engine. Always respond with valid JSON only.' },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.5,
                    max_tokens: 300,
                    response_format: { type: 'json_object' },
                }),
                signal: AbortSignal.timeout(10000),
            });

            if (response.ok) {
                const result = await response.json();
                const text = result.choices?.[0]?.message?.content || '';
                try {
                    const parsed = JSON.parse(text);
                    if (parsed.ids?.length) {
                        return NextResponse.json({
                            success: true,
                            recommendations: parsed.ids.filter((id: string) =>
                                templates.some((t: any) => t.id === id)
                            ),
                            source: 'ai',
                        });
                    }
                } catch {
                    // JSON parse failed — fall through to local fallback
                }
            } else {
                const errorText = await response.text();
                logger.error('[recommend] Groq API error:', response.status, errorText.slice(0, 200));
            }
        } catch (aiError) {
            logger.error('[recommend] Groq API call error:', aiError);
        }

        // Fallback to local algorithm
        return NextResponse.json({
            success: true,
            recommendations: getSmartFallback(templates, currentTemplate),
            source: 'fallback',
        });

    } catch (error: any) {
        logger.error('[recommend] Route error:', error);
        return NextResponse.json({ error: 'فشل في التوصيات' }, { status: 500 });
    }
}

/** Smart fallback: mix popular + diverse categories */
function getSmartFallback(templates: any[], currentTemplate?: any): string[] {
    // Get diverse categories first
    const byCategory = new Map<string, any[]>();
    templates.forEach((t: any) => {
        const cat = t.category?.name_ar || 'other';
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(t);
    });

    const picks: string[] = [];
    // One from each category (most popular)
    for (const [, catTemplates] of byCategory) {
        const sorted = catTemplates.sort((a: any, b: any) =>
            (b.downloads_count || 0) - (a.downloads_count || 0)
        );
        if (sorted[0] && !picks.includes(sorted[0].id)) {
            if (currentTemplate && sorted[0].id === currentTemplate.id) {
                if (sorted[1]) picks.push(sorted[1].id);
            } else {
                picks.push(sorted[0].id);
            }
        }
        if (picks.length >= 6) break;
    }

    // Fill remaining with overall popular
    if (picks.length < 6) {
        const remaining = templates
            .filter((t: any) => !picks.includes(t.id))
            .sort((a: any, b: any) => (b.downloads_count || 0) - (a.downloads_count || 0));
        for (const t of remaining) {
            if (picks.length >= 6) break;
            picks.push(t.id);
        }
    }

    return picks;
}
