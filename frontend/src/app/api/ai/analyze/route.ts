import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, language = 'ar' } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'البيانات مطلوبة' },
        { status: 400 }
      );
    }

    // Try OpenAI API if available
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const prompt = buildAnalysisPrompt(type, data, language);

        const response = await fetch(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            messages: [
              {
                role: 'system',
                content: language === 'ar'
                  ? 'أنت محلل بيانات تعليمية خبير. قدم تحليلاً شاملاً ومهنياً باللغة العربية مع توصيات عملية لتحسين الأداء الأكاديمي. استخدم تنسيق Markdown مع عناوين وقوائم.'
                  : 'You are an expert educational data analyst. Provide comprehensive analysis with actionable recommendations.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const analysis = result.choices?.[0]?.message?.content || '';
          return NextResponse.json({ success: true, analysis });
        }
      } catch (aiError) {
        console.error('AI API error:', aiError);
        // Fall through to local analysis
      }
    }

    // Fallback: Return empty to trigger client-side local analysis
    return NextResponse.json(
      { success: false, error: 'AI service unavailable' },
      { status: 503 }
    );

  } catch (error: any) {
    console.error('Analysis API error:', error);
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
