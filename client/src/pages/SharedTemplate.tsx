/**
 * صفحة استيراد القالب المشترك عبر رابط فريد
 */
import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, Download, FileText, Palette, ArrowLeft,
  CheckCircle2, Eye
} from "lucide-react";

export default function SharedTemplate() {
  const [, params] = useRoute("/shared-template/:token");
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const token = params?.token || "";
  const [imported, setImported] = useState(false);

  const templateQuery = trpc.templates.getByShareToken.useQuery(
    { token },
    { enabled: !!token }
  );

  const importMutation = trpc.templates.importFromShare.useMutation({
    onSuccess: () => {
      setImported(true);
      toast.success("تم استيراد القالب بنجاح إلى ثيماتك المخصصة");
    },
    onError: (err) => {
      toast.error(err.message || "فشل استيراد القالب");
    },
  });

  const template = templateQuery.data;

  if (templateQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]" dir="rtl">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
              القالب غير متاح
            </h2>
            <p className="text-gray-500 mb-6">
              رابط المشاركة غير صالح أو تم إلغاء المشاركة من قبل المالك.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 ml-1" />
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const layout = template.templateLayout as { headerStyle?: number; fieldStyle?: string } | null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 ml-1" />
            الرئيسية
          </Button>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            قالب مشترك
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: template.accent + '15' }}>
                  <Palette className="w-6 h-6" style={{ color: template.accent }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{template.name}</h2>
                  {template.description && (
                    <p className="text-sm text-gray-500">{template.description}</p>
                  )}
                </div>
              </div>

              {/* Color Preview */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: template.headerBg }} title="خلفية الرأس" />
                <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: template.accent }} title="اللون المميز" />
                <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: template.borderColor }} title="لون الحدود" />
                <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: template.bodyBg || '#fff' }} title="خلفية المحتوى" />
              </div>

              {/* Layout Info */}
              {layout && (
                <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">نمط الترويسة: {layout.headerStyle}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">نمط الحقول: {layout.fieldStyle}</span>
                </div>
              )}

              {/* Font */}
              <div className="text-xs text-gray-500 mb-6">
                الخط: <span style={{ fontFamily: template.fontFamily || undefined }}>{template.fontFamily}</span>
              </div>

              {/* Actions */}
              {imported ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">تم استيراد القالب بنجاح!</span>
                </div>
              ) : isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => importMutation.mutate({ token })}
                    disabled={importMutation.isPending}
                  >
                    {importMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-1" />
                    ) : (
                      <Download className="w-4 h-4 ml-1" />
                    )}
                    استيراد القالب
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/performance-evidence")}>
                    <Eye className="w-4 h-4 ml-1" />
                    معاينة
                  </Button>
                </div>
              ) : (
                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700 mb-3">سجّل دخولك لاستيراد هذا القالب</p>
                  <Button onClick={() => {
                    const { getLoginUrl } = require("@/const");
                    window.location.href = getLoginUrl(`/shared-template/${token}`);
                  }}>
                    تسجيل الدخول
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Preview */}
          <Card>
            <CardContent className="p-4">
              <label className="text-xs font-medium text-gray-500 mb-2 block">معاينة القالب</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-100 p-3">
                <div style={{
                  width: '100%',
                  aspectRatio: '210/297',
                  backgroundColor: '#ffffff',
                  border: `2px solid ${template.borderColor || '#047857'}`,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  fontFamily: template.fontFamily || undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  fontSize: '0.55rem',
                  direction: 'rtl',
                }}>
                  {/* Header */}
                  <div style={{ backgroundColor: template.headerBg, padding: '8px 12px', position: 'relative' }}>
                    {template.coverImageUrl && (
                      <img src={template.coverImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} />
                    )}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '7px', fontWeight: 700, color: template.headerText }}>المملكة العربية السعودية</div>
                        <div style={{ fontSize: '6px', color: template.headerText + 'CC' }}>وزارة التعليم</div>
                      </div>
                      <div>
                        {template.logoUrl ? (
                          <img src={template.logoUrl} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText style={{ width: '16px', height: '16px', color: template.headerText }} />
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '6px', fontWeight: 700, color: template.headerText }}>الفصل الدراسي: ...</div>
                        <div style={{ fontSize: '5.5px', color: template.headerText + 'CC' }}>العام الدراسي: ...</div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, padding: '8px 12px', backgroundColor: template.bodyBg || '#fff' }}>
                    <div style={{ backgroundColor: template.accent + '15', borderRight: `2px solid ${template.accent}`, borderRadius: '3px', padding: '4px 8px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '7px', fontWeight: 700, color: template.accent }}>المعيار الأول: أداء الواجبات</div>
                    </div>
                    <div style={{ border: `1px solid ${template.borderColor}`, borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '6px' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '3px 6px', fontWeight: 700, backgroundColor: template.accent + '15', color: template.accent, width: '35%' }}>اسم المعلم</td>
                            <td style={{ padding: '3px 6px', backgroundColor: '#fff' }}>أحمد محمد</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '3px 6px', fontWeight: 700, backgroundColor: template.accent + '15', color: template.accent, borderTop: `1px solid ${template.borderColor}` }}>المادة</td>
                            <td style={{ padding: '3px 6px', backgroundColor: '#fff', borderTop: `1px solid ${template.borderColor}` }}>الرياضيات</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '4px 12px', textAlign: 'center', fontSize: '5px', backgroundColor: template.headerBg + '15', color: template.accent }}>
                    SERS - نظام السجلات التعليمية الذكي
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
