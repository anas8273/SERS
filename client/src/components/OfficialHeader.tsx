/**
 * مكون الترويسة الرسمية - مطابق لتصميم edu-forms.com
 * يدعم ألوان القالب المتغيرة (داكن/فاتح/تدرج)
 */
import React from "react";

interface OfficialHeaderProps {
  deptLines: string[];
  schoolName?: string;
  logoUrl: string;
  /** compact = ترويسة مصغرة للصفحات الداخلية */
  variant?: "full" | "compact";
  /** عنوان الصفحة (يظهر في الشريط تحت الترويسة) */
  pageTitle?: string;
  /** لون الشريط */
  accentColor?: string;
  /** خلفية الترويسة - تدعم gradient و solid */
  headerBg?: string;
  /** لون نص الترويسة */
  headerText?: string;
  /** لون الحدود */
  borderColor?: string;
}

const MOE_LOGO_DEFAULT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/UntiTtled-1-1568x1192_bfb97198.png";

/** تحديد إذا كانت الخلفية داكنة */
function isDarkBg(bg: string): boolean {
  if (!bg) return true;
  const lower = bg.toLowerCase();
  if (lower.includes('#fff') || lower === '#ffffff' || lower === '#f8f9fa' || lower === '#fafafa' || lower === 'white') return false;
  if (lower.includes('linear-gradient')) {
    // تحقق من أول لون في التدرج
    const colorMatch = lower.match(/#([0-9a-f]{3,8})/);
    if (colorMatch) {
      const hex = colorMatch[1];
      if (hex.startsWith('fff') || hex.startsWith('faf') || hex.startsWith('f8f')) return false;
    }
  }
  return true;
}

export function OfficialHeader({
  deptLines,
  schoolName,
  logoUrl = MOE_LOGO_DEFAULT,
  variant = "full",
  pageTitle,
  accentColor = "#0097A7",
  headerBg = "linear-gradient(135deg, #1a3a5c 0%, #1a5f3f 50%, #2ea87a 100%)",
  headerText = "#ffffff",
  borderColor = "#004D5A",
}: OfficialHeaderProps) {
  const dark = isDarkBg(headerBg);
  const textColor = dark ? "#ffffff" : (headerText || "#004D5A");
  const separatorColor = dark ? "rgba(255,255,255,0.4)" : "rgba(0,77,90,0.3)";
  const logoFilter = dark ? "brightness(0) invert(1)" : "none";
  const schoolBg = dark
    ? "linear-gradient(to left, #1a3a5c, #1a5f3f, #2ea87a)"
    : `linear-gradient(to left, ${accentColor}dd, ${accentColor})`;

  const isCompact = variant === "compact";
  const headerPadding = isCompact ? "10px 20px 8px" : "16px 24px 14px";
  const headerRadius = isCompact ? "0 0 8px 8px" : "0 0 12px 12px";
  const logoHeight = isCompact ? "38px" : "65px";
  const textSize = isCompact ? "10px" : "12px";
  const lineH = isCompact ? "1.8" : "2";
  const sepHeight = isCompact ? "40px" : "60px";
  const schoolPadding = isCompact ? "5px 16px" : "8px 24px";
  const schoolFontSize = isCompact ? "10px" : "13px";
  const schoolMargin = isCompact ? "0 16px" : "0 20px";
  const schoolRadius = isCompact ? "0 0 6px 6px" : "0 0 8px 8px";
  const titlePadding = isCompact ? "5px 16px" : "8px 20px";
  const titleFontSize = isCompact ? "11px" : "13px";
  const titleMargin = isCompact ? "4px 0 0" : "8px 0 0";

  // تحديد خلفية الترويسة (gradient أو solid)
  const bgStyle: React.CSSProperties = headerBg.includes("gradient")
    ? { background: headerBg }
    : { backgroundColor: headerBg };

  return (
    <div style={{ marginBottom: isCompact ? "0.5rem" : undefined }}>
      {/* الترويسة الرئيسية */}
      <div
        style={{
          ...bgStyle,
          padding: headerPadding,
          borderRadius: headerRadius,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
          <tbody>
            <tr>
              {/* الجانب الأيمن - بيانات الجهة */}
              <td
                style={{
                  width: "45%",
                  verticalAlign: "middle",
                  textAlign: "right",
                  padding: "0",
                }}
              >
                {deptLines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: textSize,
                      color: textColor,
                      fontWeight: 600,
                      lineHeight: lineH,
                    }}
                  >
                    {line}
                  </div>
                ))}
                {schoolName && deptLines.length === 0 && (
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: textSize,
                      color: textColor,
                      lineHeight: lineH,
                    }}
                  >
                    {schoolName}
                  </div>
                )}
              </td>

              {/* خط فاصل عمودي */}
              <td
                style={{
                  width: "2%",
                  verticalAlign: "middle",
                  textAlign: "center",
                  padding: isCompact ? "0 6px" : "0 8px",
                }}
              >
                <div
                  style={{
                    width: "1.5px",
                    height: sepHeight,
                    background: separatorColor,
                    margin: "0 auto",
                  }}
                />
              </td>

              {/* الجانب الأيسر - الشعار */}
              <td
                style={{
                  width: "53%",
                  verticalAlign: "middle",
                  textAlign: "center",
                  padding: "0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  <img
                    src={logoUrl}
                    alt="شعار وزارة التعليم"
                    style={{
                      height: logoHeight,
                      objectFit: "contain" as const,
                      display: "inline-block",
                      filter: logoFilter,
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* شريط اسم المدرسة */}
      {schoolName && (
        <div
          style={{
            background: schoolBg,
            color: "white",
            padding: schoolPadding,
            textAlign: "center",
            fontWeight: 700,
            fontSize: schoolFontSize,
            letterSpacing: "0.5px",
            borderRadius: schoolRadius,
            margin: schoolMargin,
          }}
        >
          {schoolName}
        </div>
      )}

      {/* شريط العنوان */}
      {pageTitle && (
        <div
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            color: "white",
            padding: titlePadding,
            textAlign: "center",
            fontWeight: 800,
            fontSize: titleFontSize,
            letterSpacing: "0.5px",
            margin: titleMargin,
          }}
        >
          {pageTitle}
        </div>
      )}
    </div>
  );
}

export default OfficialHeader;
