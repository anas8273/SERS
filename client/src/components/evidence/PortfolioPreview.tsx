/**
 * معاينة ملف الإنجاز - على نمط معياري
 * يعرض الملف النهائي قبل التصدير
 */
import { STANDARDS, getStandardProgress, getOverallCoverage, type Evidence, type UserProfile } from "@/lib/standards-data";
import { generateQRDataURL } from "@/lib/qr-utils";

interface Theme {
  id: string;
  name: string;
  headerBg: string;
  headerText: string;
  accent: string;
  borderColor: string;
}

interface Props {
  evidences: Evidence[];
  profile: UserProfile;
  theme: Theme;
}

export default function PortfolioPreview({ evidences, profile, theme }: Props) {
  const overall = getOverallCoverage(evidences);

  return (
    <div id="portfolio-preview" className="bg-white" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
      {/* الغلاف */}
      <div
        style={{
          background: theme.headerBg,
          color: theme.headerText,
          padding: "3rem 2rem",
          textAlign: "center",
        }}
      >
        <p className="text-sm opacity-80 mb-2">المملكة العربية السعودية - وزارة التعليم</p>
        <h1 className="text-3xl font-black mb-2">ملف شواهد الأداء الوظيفي</h1>
        <p className="text-lg font-bold opacity-90">العام الدراسي {profile.year}</p>
        <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
          <p className="text-sm opacity-80">نسبة الاكتمال</p>
          <p className="text-4xl font-black">{overall.percentage}%</p>
        </div>
      </div>

      {/* البيانات الشخصية */}
      <div className="p-6 border-b" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-lg font-bold mb-3" style={{ color: theme.accent }}>
          البيانات الشخصية
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">الاسم:</span>{" "}
            <strong className="text-gray-800">{profile.name || "—"}</strong>
          </div>
          <div>
            <span className="text-gray-500">المدرسة:</span>{" "}
            <strong className="text-gray-800">{profile.school || "—"}</strong>
          </div>
          <div>
            <span className="text-gray-500">المادة:</span>{" "}
            <strong className="text-gray-800">{profile.subject || "—"}</strong>
          </div>
          <div>
            <span className="text-gray-500">الصف:</span>{" "}
            <strong className="text-gray-800">{profile.grade || "—"}</strong>
          </div>
          <div>
            <span className="text-gray-500">الوظيفة:</span>{" "}
            <strong className="text-gray-800">{profile.role || "—"}</strong>
          </div>
          <div>
            <span className="text-gray-500">العام:</span>{" "}
            <strong className="text-gray-800">{profile.year || "—"}</strong>
          </div>
        </div>
      </div>

      {/* جدول ملخص المعايير */}
      <div className="p-6 border-b" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-lg font-bold mb-3" style={{ color: theme.accent }}>
          ملخص المعايير
        </h2>
        <table className="w-full border-collapse text-sm" style={{ borderColor: theme.borderColor }}>
          <thead>
            <tr style={{ background: theme.accent, color: "#fff" }}>
              <th className="p-2 border text-center" style={{ borderColor: theme.borderColor }}>
                م
              </th>
              <th className="p-2 border text-right" style={{ borderColor: theme.borderColor }}>
                المعيار
              </th>
              <th className="p-2 border text-center" style={{ borderColor: theme.borderColor }}>
                المؤشرات
              </th>
              <th className="p-2 border text-center" style={{ borderColor: theme.borderColor }}>
                الحالة
              </th>
            </tr>
          </thead>
          <tbody>
            {STANDARDS.map((std, i) => {
              const progress = getStandardProgress(std.id, evidences);
              return (
                <tr key={std.id} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <td className="p-2 border text-center" style={{ borderColor: theme.borderColor }}>
                    {std.number}
                  </td>
                  <td className="p-2 border" style={{ borderColor: theme.borderColor }}>
                    {std.title}
                  </td>
                  <td className="p-2 border text-center font-bold" style={{ borderColor: theme.borderColor }}>
                    {progress.covered}/{progress.total}
                  </td>
                  <td className="p-2 border text-center" style={{ borderColor: theme.borderColor }}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        progress.percentage === 100
                          ? "bg-green-100 text-green-700"
                          : progress.percentage > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      {progress.percentage}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* الشواهد لكل معيار */}
      {STANDARDS.map((std) => {
        const stdEvidences = evidences.filter((e) => e.standardId === std.id);
        if (stdEvidences.length === 0) return null;

        return (
          <div key={std.id} className="p-6 border-b page-break-inside-avoid" style={{ borderColor: theme.borderColor }}>
            <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: theme.accent }}>
              <span>{std.icon}</span>
              {std.number}. {std.title}
            </h2>

            {/* تجميع الشواهد حسب المؤشر */}
            {(std.items || []).map((item) => {
              const indEvidences = stdEvidences.filter((e) => e.indicatorId === item.id);
              if (indEvidences.length === 0) return null;

              return (
                <div key={item.id} className="mb-4 mr-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 border-r-2 pr-2" style={{ borderColor: theme.accent }}>
                    {item.text}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mr-4">
                    {indEvidences.map((ev) => (
                      <div key={ev.id} className="border rounded-lg p-2" style={{ borderColor: theme.borderColor }}>
                        {ev.type === "image" && ev.displayAs === "image" && (
                          <img src={ev.content} alt={ev.title} className="w-full h-32 object-cover rounded" />
                        )}
                        {ev.type === "image" && ev.displayAs === "qr" && (
                          <div className="flex flex-col items-center gap-1 p-2">
                            <img
                              src={generateQRDataURL(ev.content.substring(0, 200))}
                              alt="QR"
                              className="w-20 h-20"
                            />
                            <span className="text-[9px] text-gray-500 text-center">{ev.title}</span>
                          </div>
                        )}
                        {ev.type === "link" && (
                          <div className="flex flex-col items-center gap-1 p-2">
                            <img src={generateQRDataURL(ev.content)} alt="QR" className="w-20 h-20" />
                            <span className="text-[9px] text-gray-500 text-center truncate max-w-full">
                              {ev.title}
                            </span>
                          </div>
                        )}
                        {(ev.type === "video" || ev.type === "file") && (
                          <div className="flex flex-col items-center gap-1 p-2">
                            <img
                              src={generateQRDataURL(ev.content || ev.title)}
                              alt="QR"
                              className="w-20 h-20"
                            />
                            <span className="text-[9px] text-gray-500 text-center">{ev.title}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* التوقيعات */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-8 text-center text-sm mt-4">
          <div>
            <p className="text-gray-500 mb-10">توقيع المعلم/ة</p>
            <div className="border-t border-gray-300 pt-2">{profile.name || "____________"}</div>
          </div>
          <div>
            <p className="text-gray-500 mb-10">توقيع المشرف/ة</p>
            <div className="border-t border-gray-300 pt-2">____________</div>
          </div>
          <div>
            <p className="text-gray-500 mb-10">توقيع مدير/ة المدرسة</p>
            <div className="border-t border-gray-300 pt-2">____________</div>
          </div>
        </div>
      </div>
    </div>
  );
}
