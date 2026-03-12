import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  createPortfolio, updatePortfolio, getPortfoliosByUser, getPortfolioById, deletePortfolio,
  getAllPortfolios, reviewPortfolio,
  createUploadedFile, getFilesByPortfolio, deleteUploadedFile,
  createShareLink, getShareLinkByToken, incrementShareLinkViews, getShareLinksByPortfolio, deactivateShareLink,
  createPdfTemplate, updatePdfTemplate, deletePdfTemplate, getActivePdfTemplates, getAllPdfTemplates, seedDefaultTemplates,
  createUserTheme, updateUserTheme, deleteUserTheme, getUserThemes,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Portfolio CRUD ────────────────────────────────────
  portfolio: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getPortfoliosByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const p = await getPortfolioById(input.id);
        if (!p || p.userId !== ctx.user.id) return null;
        return p;
      }),

    create: protectedProcedure
      .input(z.object({
        jobId: z.string(),
        jobTitle: z.string(),
        personalInfo: z.record(z.string(), z.string()),
        criteriaData: z.record(z.string(), z.any()),
        customCriteria: z.array(z.any()).optional(),
        themeId: z.string().optional(),
        completionPercentage: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createPortfolio({
          userId: ctx.user.id,
          jobId: input.jobId,
          jobTitle: input.jobTitle,
          personalInfo: input.personalInfo as Record<string, string>,
          criteriaData: input.criteriaData,
          customCriteria: input.customCriteria ?? [],
          themeId: input.themeId ?? "classic",
          completionPercentage: input.completionPercentage ?? 0,
          status: "draft",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        criteriaData: z.record(z.string(), z.any()).optional(),
        customCriteria: z.array(z.any()).optional(),
        personalInfo: z.record(z.string(), z.string()).optional(),
        themeId: z.string().optional(),
        completionPercentage: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return updatePortfolio(id, ctx.user.id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deletePortfolio(input.id, ctx.user.id);
      }),

    submit: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return updatePortfolio(input.id, ctx.user.id, { status: "submitted" });
      }),
  }),

  // ─── File Upload ───────────────────────────────────────
  file: router({
    upload: protectedProcedure
      .input(z.object({
        portfolioId: z.number().optional(),
        fileName: z.string(),
        mimeType: z.string(),
        base64Data: z.string(),
        criterionId: z.string().optional(),
        subEvidenceId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const suffix = nanoid(8);
        const ext = input.fileName.split('.').pop() || 'bin';
        const fileKey = `evidence/${ctx.user.id}/${suffix}.${ext}`;
        const buffer = Buffer.from(input.base64Data, 'base64');
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        const { id } = await createUploadedFile({
          userId: ctx.user.id,
          portfolioId: input.portfolioId ?? null,
          fileKey,
          url,
          originalName: input.fileName,
          mimeType: input.mimeType,
          fileSize: buffer.length,
          criterionId: input.criterionId ?? null,
          subEvidenceId: input.subEvidenceId ?? null,
        });

        return { id, url, fileKey };
      }),

    listByPortfolio: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ input }) => {
        return getFilesByPortfolio(input.portfolioId);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteUploadedFile(input.id, ctx.user.id);
      }),
  }),

  // ─── Share Links ───────────────────────────────────────
  share: router({
    create: protectedProcedure
      .input(z.object({
        portfolioId: z.number(),
        expiresInDays: z.number().min(1).max(30).default(7),
        maxViews: z.number().min(0).max(1000).default(0),
        password: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const token = nanoid(32);
        const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);

        await createShareLink({
          portfolioId: input.portfolioId,
          userId: ctx.user.id,
          token,
          expiresAt,
          hasPassword: !!input.password,
          passwordHash: input.password || null,
          viewCount: 0,
          maxViews: input.maxViews,
          isActive: true,
        });

        return { token, expiresAt };
      }),

    view: publicProcedure
      .input(z.object({
        token: z.string(),
        password: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const link = await getShareLinkByToken(input.token);
        if (!link) return { error: "رابط غير صالح", portfolio: null };
        if (new Date() > link.expiresAt) return { error: "انتهت صلاحية الرابط", portfolio: null };
        if ((link.maxViews ?? 0) > 0 && (link.viewCount ?? 0) >= (link.maxViews ?? 0)) return { error: "تم تجاوز الحد الأقصى للمشاهدات", portfolio: null };
        if (link.hasPassword && input.password !== link.passwordHash) return { error: "كلمة المرور غير صحيحة", portfolio: null, requiresPassword: true };

        await incrementShareLinkViews(link.id);
        const portfolio = await getPortfolioById(link.portfolioId);
        if (!portfolio) return { error: "الملف غير موجود", portfolio: null };

        // إشعار المالك عند مشاهدة رابط المشاركة
        const newViewCount = (link.viewCount ?? 0) + 1;
        // إشعار عند أول مشاهدة وكل 5 مشاهدات
        if (newViewCount === 1 || newViewCount % 5 === 0) {
          notifyOwner({
            title: `مشاهدة رابط مشاركة - ${portfolio.jobTitle || 'ملف أداء'}`,
            content: `تمت مشاهدة رابط المشاركة لملف "${portfolio.jobTitle}" (المشاهدة رقم ${newViewCount}). الرابط: ${input.token.substring(0, 8)}...`,
          }).catch(() => {}); // لا نوقف العملية إذا فشل الإشعار
        }

        const files = await getFilesByPortfolio(portfolio.id);
        return { error: null, portfolio, files };
      }),

    listByPortfolio: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .query(async ({ input }) => {
        return getShareLinksByPortfolio(input.portfolioId);
      }),

    deactivate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deactivateShareLink(input.id, ctx.user.id);
      }),
  }),

  // ─── Admin Dashboard ──────────────────────────────────
  admin: router({
    portfolios: adminProcedure
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        status: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return getAllPortfolios(input.page, input.limit, input.status);
      }),

    review: adminProcedure
      .input(z.object({
        portfolioId: z.number(),
        status: z.enum(["approved", "rejected", "reviewed"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return reviewPortfolio(input.portfolioId, ctx.user.id, input.status, input.notes ?? "");
      }),

    portfolioDetail: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const portfolio = await getPortfolioById(input.id);
        if (!portfolio) return null;
        const files = await getFilesByPortfolio(portfolio.id);
        return { ...portfolio, files };
      }),
  }),

  // ─── PDF Templates ──────────────────────────────────────────
  templates: router({
    list: publicProcedure.query(async () => {
      return getActivePdfTemplates();
    }),

    listAll: adminProcedure.query(async () => {
      return getAllPdfTemplates();
    }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        headerBg: z.string(),
        headerText: z.string(),
        accent: z.string(),
        borderColor: z.string(),
        bodyBg: z.string(),
        fontFamily: z.string().optional(),
        coverImageUrl: z.string().optional(),
        logoUrl: z.string().optional(),
        templateLayout: z.any().optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createPdfTemplate({ ...input, createdBy: ctx.user.id });
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        headerBg: z.string().optional(),
        headerText: z.string().optional(),
        accent: z.string().optional(),
        borderColor: z.string().optional(),
        bodyBg: z.string().optional(),
        fontFamily: z.string().optional(),
        coverImageUrl: z.string().optional(),
        logoUrl: z.string().optional(),
        templateLayout: z.any().optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePdfTemplate(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deletePdfTemplate(input.id);
      }),

    seed: adminProcedure.mutation(async () => {
      await seedDefaultTemplates();
      return { success: true };
    }),

    uploadImage: adminProcedure
      .input(z.object({
        fileName: z.string(),
        mimeType: z.string(),
        base64Data: z.string(),
        imageType: z.enum(['cover', 'logo', 'background']),
      }))
      .mutation(async ({ ctx, input }) => {
        const suffix = nanoid(8);
        const ext = input.fileName.split('.').pop() || 'png';
        const fileKey = `templates/${input.imageType}/${suffix}.${ext}`;
        const buffer = Buffer.from(input.base64Data, 'base64');
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        return { url, fileKey };
      }),

    // مشاركة القالب عبر رابط فريد
    generateShareLink: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const token = nanoid(24);
        await updatePdfTemplate(input.id, { shareToken: token, isShared: true } as any);
        return { token };
      }),

    revokeShareLink: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updatePdfTemplate(input.id, { shareToken: null, isShared: false } as any);
        return { success: true };
      }),

    getByShareToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const all = await getAllPdfTemplates();
        const template = all.find((t: any) => t.shareToken === input.token && t.isShared);
        if (!template) return null;
        return template;
      }),

    importFromShare: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const all = await getAllPdfTemplates();
        const source = all.find((t: any) => t.shareToken === input.token && t.isShared);
        if (!source) throw new Error('القالب غير موجود أو تم إلغاء المشاركة');
        // حفظ كثيم مخصص للمستخدم
        return createUserTheme({
          userId: ctx.user.id,
          name: `${source.name} (مستورد)`,
          description: source.description || '',
          themeData: {
            headerBg: source.headerBg,
            headerText: source.headerText,
            accent: source.accent,
            borderColor: source.borderColor,
            bodyBg: source.bodyBg,
            fontFamily: source.fontFamily,
            coverImageUrl: source.coverImageUrl,
            logoUrl: source.logoUrl,
            templateLayout: source.templateLayout,
          },
        });
      }),
  }),

  // ─── User Custom Themes ───────────────────────────────────────────────
  userThemes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserThemes(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        themeData: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        return createUserTheme({
          userId: ctx.user.id,
          name: input.name,
          description: input.description ?? null,
          themeData: input.themeData,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        themeData: z.record(z.string(), z.any()).optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return updateUserTheme(id, ctx.user.id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteUserTheme(input.id, ctx.user.id);
      }),
  }),

  // ─── AI Services ──────────────────────────────────────────────────────
  ai: router({
    classifyEvidence: publicProcedure
      .input(z.object({
        description: z.string().optional(),
        fileName: z.string().optional(),
        fileType: z.string().optional(),
        fileUrl: z.string().optional(),
        linkUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const SYSTEM_PROMPT = `أنت نظام تصنيف ذكي متقدم لشواهد الأداء الوظيفي للمعلمين وفق معايير وزارة التعليم السعودية 1447هـ.

مهمتك (3 مستويات):
1. حلل المحتوى بعمق (صورة، ملف، رابط، نص) واستخرج المعلومات الرئيسية
2. حدد المعيار الأنسب من المعايير الـ 11 (المستوى الأول)
3. حدد البند الأنسب داخل المعيار (المستوى الثاني)
4. حدد البند الفرعي الأنسب داخل البند (المستوى الثالث)
5. اشرح سبب التصنيف بالتفصيل
6. صف محتوى الملف/الصورة بدقة
7. اقترح أولوية للشاهد (essential=أساسي، supporting=داعم، supplementary=إضافي)
8. اقترح كلمات مفتاحية مناسبة

المعايير الـ 11 وبنودها الفرعية:

1. أداء الواجبات الوظيفية (std-1):
   - البند 1: الالتزام بالحضور والانصراف
   - البند 2: تنفيذ التوجيهات والتعاميم
   - البند 3: المشاركة في الأنشطة المدرسية
   - البند 4: الإشراف اليومي

2. التفاعل مع المجتمع المهني (std-2):
   - البند 1: المشاركة في التطوير المهني
   - البند 2: التعاون مع الزملاء
   - البند 3: المشاركة في مجتمعات التعلم المهنية

3. التفاعل مع أولياء الأمور (std-3):
   - البند 1: التواصل مع الأسر
   - البند 2: عقد الاجتماعات
   - البند 3: إعداد التقارير الدورية

4. التنويع في استراتيجيات التدريس (std-4):
   - البند 1: التعلم النشط
   - البند 2: التعلم التعاوني
   - البند 3: التعلم باللعب والصف المقلوب

5. تحسين نتائج المتعلمين (std-5):
   - البند 1: خطط التحسين
   - البند 2: البرامج الإثرائية والعلاجية
   - البند 3: متابعة التقدم

6. إعداد وتنفيذ خطة التعلم (std-6):
   - البند 1: تحضير الدروس
   - البند 2: الأهداف التعليمية
   - البند 3: التوزيع الزمني

7. توظيف تقنيات ووسائل التعلم (std-7):
   - البند 1: التقنية في التعليم
   - البند 2: الوسائل التعليمية
   - البند 3: المنصات الرقمية

8. تهيئة البيئة التعليمية (std-8):
   - البند 1: الفصل الدراسي
   - البند 2: المعامل والمختبرات
   - البند 3: البيئة الآمنة والموارد

9. الإدارة الصفية (std-9):
   - البند 1: ضبط الصف
   - البند 2: إدارة الوقت
   - البند 3: التعامل مع السلوك

10. تحليل نتائج المتعلمين (std-10):
   - البند 1: الاختبارات
   - البند 2: التحليل الإحصائي
   - البند 3: تشخيص المستويات

11. تنوع أساليب التقويم (std-11):
   - البند 1: التقويم التكويني والختامي
   - البند 2: التقويم الذاتي وتقويم الأقران
   - البند 3: ملفات الإنجاز

عند تحليل الصور:
- اقرأ أي نص عربي أو إنجليزي ظاهر في الصورة
- حدد نوع الوثيقة (شهادة، تقرير، خطاب، صورة نشاط، لقطة شاشة)
- حلل السياق التعليمي للصورة
- استخرج المعلومات الرئيسية (التاريخ، الجهة، الموضوع)

عند تحليل الروابط:
- حلل اسم النطاق والمسار لتحديد نوع المحتوى
- إذا كان رابط منصة تعليمية (مدرستي، عين، نور) صنفه حسب السياق

أجب بصيغة JSON فقط.`;

        const messages: any[] = [
          { role: "system", content: SYSTEM_PROMPT },
        ];

        const STANDARDS_LIST = `1. أداء الواجبات الوظيفية (std-1)
2. التفاعل مع المجتمع المهني (std-2)
3. التفاعل مع أولياء الأمور (std-3)
4. التنويع في استراتيجيات التدريس (std-4)
5. تحسين نتائج المتعلمين (std-5)
6. إعداد وتنفيذ خطة التعلم (std-6)
7. توظيف تقنيات ووسائل التعلم المناسبة (std-7)
8. تهيئة البيئة التعليمية (std-8)
9. الإدارة الصفية (std-9)
10. تحليل نتائج المتعلمين وتشخيص مستوياتهم (std-10)
11. تنوع أساليب التقويم (std-11)`;

        // تحليل بصري للصور والفيديوهات (الفيديو يُرسل كإطار مستخرج)
        if (input.fileUrl && (input.fileType?.startsWith('image/') || input.fileType?.startsWith('video/') || input.fileUrl.startsWith('data:image'))) {
          messages.push({
            role: "user",
            content: [
              { type: "image_url", image_url: { url: input.fileUrl, detail: "high" } },
              { type: "text", text: `حلل هذه ${input.fileType?.startsWith('video/') ? 'الصورة المستخرجة من مقطع فيديو' : 'الصورة'} بعمق وصنفها ضمن أحد المعايير:\n${STANDARDS_LIST}\n\nتعليمات التحليل:\n- اقرأ كل النصوص الظاهرة في الصورة (عربي/إنجليزي)\n- حدد نوع الوثيقة (شهادة، تقرير، خطاب، صورة نشاط، لقطة شاشة، مقطع فيديو)\n- حلل السياق التعليمي\n- استخرج التاريخ والجهة والموضوع إن وجد\n${input.description ? `وصف إضافي: ${input.description}` : ""}\n${input.fileName ? `اسم الملف: ${input.fileName}` : ""}` },
            ],
          });
        }
        // تحليل الروابط
        else if (input.linkUrl) {
          messages.push({
            role: "user",
            content: `حلل هذا الرابط وصنفه ضمن أحد المعايير:\n${STANDARDS_LIST}\n\nالرابط: ${input.linkUrl}\n${input.description ? `وصف: ${input.description}` : ""}\n\nتعليمات:\n- حلل اسم النطاق والمسار لتحديد نوع المحتوى\n- إذا كان رابط منصة تعليمية (مدرستي، عين، نور، كلاسيرا) صنفه حسب السياق\n- إذا كان رابط دورة تدريبية صنفه ضمن التطوير المهني`,
          });
        }
        // تحليل الملفات بناءً على الاسم والنوع
        else {
          messages.push({
            role: "user",
            content: `صنف هذا الشاهد ضمن أحد المعايير:\n${STANDARDS_LIST}\n\n${input.description ? `وصف: ${input.description}` : ""}\n${input.fileName ? `اسم الملف: ${input.fileName}` : ""}\n${input.fileType ? `نوع الملف: ${input.fileType}` : ""}\n${input.fileUrl ? `رابط الملف: ${input.fileUrl}` : ""}`,
          });
        }

        const response = await invokeLLM({
          messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "evidence_classification",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  standardId: { type: "string", description: "معرف المعيار مثل std-1" },
                  standardNumber: { type: "integer", description: "رقم المعيار من 1 إلى 11" },
                  standardName: { type: "string", description: "اسم المعيار" },
                  indicatorIndex: { type: "integer", description: "رقم البند داخل المعيار (يبدأ من 1)" },
                  indicatorText: { type: "string", description: "نص البند" },
                  subIndicatorIndex: { type: "integer", description: "رقم البند الفرعي داخل البند (يبدأ من 1، 0 إذا لم يتحدد)" },
                  subIndicatorText: { type: "string", description: "نص البند الفرعي" },
                  confidence: { type: "number", description: "نسبة الثقة من 0 إلى 1" },
                  reasoning: { type: "string", description: "سبب التصنيف" },
                  contentDescription: { type: "string", description: "وصف محتوى الملف أو الصورة" },
                  suggestedPriority: { type: "string", description: "الأولوية المقترحة: essential أو supporting أو supplementary" },
                  suggestedKeywords: { type: "array", items: { type: "string" }, description: "كلمات مفتاحية مقترحة (3-5 كلمات)" },
                },
                required: ["standardId", "standardNumber", "standardName", "indicatorIndex", "indicatorText", "subIndicatorIndex", "subIndicatorText", "confidence", "reasoning", "contentDescription", "suggestedPriority", "suggestedKeywords"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : '{}';
        try {
          return { classification: JSON.parse(content), success: true };
        } catch {
          return { classification: null, success: false };
        }
      }),

    suggestEvidence: publicProcedure
      .input(z.object({
        jobTitle: z.string(),
        criterionName: z.string(),
        subEvidenceName: z.string(),
        existingContent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "أنت مساعد ذكاء اصطناعي متخصص في التعليم السعودي وتقييم الأداء الوظيفي. مهمتك مساعدة المعلمين والإداريين في كتابة شواهد أداء وظيفي احترافية. أجب دائماً باللغة العربية. قدم 3-5 اقتراحات عملية ومحددة. كل اقتراح في سطر يبدأ بـ •" },
            { role: "user", content: `الوظيفة: ${input.jobTitle}\nالبند: ${input.criterionName}\nالشاهد الفرعي: ${input.subEvidenceName}${input.existingContent ? `\nالمحتوى الحالي: ${input.existingContent}` : ""}\n\nاقترح شواهد أداء وظيفي مناسبة.` }
          ],
        });
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : '';
        const suggestions = content.split("\n").map((s: string) => s.replace(/^[•\-\*\d\.]+\s*/, "").trim()).filter((s: string) => s.length > 5);
        return { suggestions, rawContent: content };
      }),

    fillFormFields: publicProcedure
      .input(z.object({
        jobTitle: z.string(),
        criterionName: z.string(),
        subEvidenceName: z.string(),
        formFields: z.array(z.object({ id: z.string(), label: z.string(), type: z.string() })),
      }))
      .mutation(async ({ input }) => {
        const fieldsDesc = input.formFields.map(f => `- ${f.label} (${f.type})`).join("\n");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "أنت مساعد متخصص في التعليم السعودي. املأ نماذج التقارير بمحتوى احترافي. أجب بصيغة JSON فقط." },
            { role: "user", content: `الوظيفة: ${input.jobTitle}\nالبند: ${input.criterionName}\nالشاهد: ${input.subEvidenceName}\n\nالحقول:\n${fieldsDesc}\n\nأعطني قيم مقترحة بصيغة JSON. المفاتيح: ${input.formFields.map(f => f.id).join(", ")}` }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "form_fill",
              strict: true,
              schema: {
                type: "object",
                properties: Object.fromEntries(input.formFields.map(f => [f.id, { type: "string", description: f.label }])),
                required: input.formFields.map(f => f.id),
                additionalProperties: false,
              },
            },
          },
        });
        const raw2 = response.choices?.[0]?.message?.content;
        const content = typeof raw2 === 'string' ? raw2 : '{}';
        try { return { filledData: JSON.parse(content), success: true }; }
        catch { return { filledData: {}, success: false }; }
      }),

    improveText: publicProcedure
      .input(z.object({ text: z.string(), context: z.string().optional() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "أنت محرر نصوص تعليمية محترف. حسّن النص ليكون أكثر احترافية مع الحفاظ على المعنى. أجب بالنص المحسّن فقط." },
            { role: "user", content: `${input.context ? `السياق: ${input.context}\n` : ""}النص: ${input.text}` }
          ],
        });
        const c = response.choices?.[0]?.message?.content;
        return { improved: (typeof c === 'string' ? c : input.text).trim() };
      }),

    suggest: publicProcedure
      .input(z.object({ prompt: z.string(), context: z.string().optional() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "أنت مساعد ذكاء اصطناعي متخصص في التعليم السعودي. قدم إجابات مفيدة ومحددة باللغة العربية." },
            { role: "user", content: `${input.context ? `السياق: ${input.context}\n` : ""}${input.prompt}` }
          ],
        });
        const c = response.choices?.[0]?.message?.content;
        return { content: (typeof c === 'string' ? c : "").trim() };
      }),

    analyzeGaps: publicProcedure
      .input(z.object({
        coveredIndicators: z.array(z.string()),
        totalIndicators: z.number(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "أنت مستشار تعليمي متخصص في الأداء الوظيفي. قدم توصيات عملية لسد الفجوات في ملف الإنجاز. أجب باللغة العربية." },
            { role: "user", content: `المعلم غطى ${input.coveredIndicators.length} مؤشر من أصل ${input.totalIndicators}.\n\nالمؤشرات المغطاة:\n${input.coveredIndicators.join("\n")}\n\nقدم 3-5 توصيات عملية لتحسين ملف الإنجاز وسد الفجوات.` }
          ],
        });
        const c = response.choices?.[0]?.message?.content;
        return { recommendations: (typeof c === 'string' ? c : "").trim() };
      }),
  }),
});

export type AppRouter = typeof appRouter;
