import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/api-rate-limit';

export async function POST(request: NextRequest) {
  try {
    // [AUDIT FIX] Rate limit: 10 requests per minute per IP
    const ip = getClientIP(request);
    const limit = checkRateLimit(`analyze:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.', retryAfter: limit.retryAfter },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type, data, language = 'ar' } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'البيانات مطلوبة' },
        { status: 400 }
      );
    }

    // Server-only key (no NEXT_PUBLIC_ prefix) — stays on the server exclusively
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      try {
        const prompt = buildAnalysisPrompt(type, data, language);
        const systemInstruction = language === 'ar'
          ? 'أنت محلل بيانات تعليمية خبير. قدم تحليلاً شاملاً ومهنياً باللغة العربية مع توصيات عملية لتحسين الأداء الأكاديمي. استخدم تنسيق Markdown مع عناوين وقوائم.'
          : 'You are an expert educational data analyst. Provide comprehensive analysis with actionable recommendations.';

        const response = await fetch(
          `https://api.groq.com/openai/v1/chat/completions`,
          {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                  { role: 'system', content: systemInstruction },
                  { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          const analysis = result.choices?.[0]?.message?.content || '';
          return NextResponse.json({ success: true, analysis });
        } else {
          const errorBody = await response.text();
          logger.error('[analyze] Groq API error:', response.status, errorBody.slice(0, 200));
        }
      } catch (aiError) {
        logger.error('[analyze] Groq API call error:', aiError);
        // Fall through to 503
      }
    }

    // Fallback: Return 503 to trigger client-side local analysis
    return NextResponse.json(
      { success: false, error: 'AI service unavailable' },
      { status: 503 }
    );

  } catch (error: any) {
    logger.error('Analysis API error:', error);
    return NextResponse.json(
      { error: error.message || 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

function buildAnalysisPrompt(type: string, data: any, language: string): string {
  if (type === 'grade_analysis') {
    const { totalStudents, subjects, overallAverage, overallPassRate, classifications } = data;

    let prompt = language === 'ar'
      ? `حلل البيانات التالية لأداء ${totalStudents} طالب/طالبة:\n\n`
      : `Analyze the following performance data for ${totalStudents} students:\n\n`;

    prompt += `المتوسط العام: ${overallAverage}\n`;
    prompt += `نسبة النجاح: ${overallPassRate}%\n\n`;

    prompt += `توزيع المستويات:\n`;
    if (classifications) {
      Object.entries(classifications).forEach(([key, value]) => {
        const labels: Record<string, string> = {
          excellent: 'متفوق', very_good: 'جيد جداً', good: 'جيد', pass: 'مقبول', fail: 'متعثر'
        };
        prompt += `- ${labels[key] || key}: ${value} طالب\n`;
      });
    }

    prompt += `\nتفاصيل المواد:\n`;
    subjects?.forEach((s: any) => {
      prompt += `- ${s.name}: متوسط ${s.average}، نسبة نجاح ${s.passRate}%، أعلى ${s.highest}، أقل ${s.lowest}، انحراف معياري ${s.stdDev}\n`;
    });

    prompt += language === 'ar'
      ? `\nالمطلوب:\n1. تحليل شامل للأداء العام\n2. تحديد نقاط القوة والضعف\n3. مقارنة بين المواد\n4. توصيات عملية لتحسين الأداء\n5. اقتراح خطط علاجية للطلاب المتعثرين\n6. تقييم مستوى التجانس بين الطلاب`
      : `\nRequired:\n1. Overall performance analysis\n2. Strengths and weaknesses\n3. Subject comparison\n4. Practical recommendations\n5. Remedial plans for struggling students`;

    return prompt;
  }

  return JSON.stringify(data);
}
