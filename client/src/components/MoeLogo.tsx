/**
 * شعار وزارة التعليم - يستخدم صور PNG حقيقية عالية الجودة
 * النسخة الملونة (مع نص عربي وإنجليزي) للترويسات
 * النسخة المصغرة (النقاط فقط) للشريط الجانبي
 */
import React from "react";

// شعار وزارة التعليم الكامل (نقاط + نص عربي + نص إنجليزي) - 700x579
const MOE_LOGO_FULL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/moe-logo_b9fec681.png";

// شعار النقاط فقط (بدون نص) - 2000x2000
const MOE_DOTS_ONLY = "https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/moe-dots-only_25b62597.png";

interface MoeLogoProps {
  /** white = أبيض للخلفيات الداكنة, original = ألوان أصلية */
  variant?: "white" | "original";
  /** ارتفاع الشعار بالبكسل */
  height?: number;
  /** dots-only = النقاط فقط, full = كامل مع النص */
  logoType?: "full" | "dots-only";
  className?: string;
  style?: React.CSSProperties;
}

export function MoeLogo({ variant = "white", height = 70, logoType = "full", className, style }: MoeLogoProps) {
  const isWhite = variant === "white";
  const src = logoType === "dots-only" ? MOE_DOTS_ONLY : MOE_LOGO_FULL;
  return (
    <img
      src={src}
      alt="شعار وزارة التعليم"
      className={className}
      style={{
        height: `${height}px`,
        objectFit: "contain" as const,
        display: "inline-block",
        filter: isWhite ? "brightness(0) invert(1)" : "none",
        ...style,
      }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

/**
 * إرجاع URL صورة الشعار الكامل (مع النص)
 */
export function getMoeLogoUrl(): string {
  return MOE_LOGO_FULL;
}

/**
 * إرجاع URL صورة النقاط فقط (بدون نص)
 */
export function getMoeDotsUrl(): string {
  return MOE_DOTS_ONLY;
}

/**
 * إرجاع فلتر CSS المناسب حسب الخلفية
 */
export function getMoeLogoFilter(isDark: boolean): string {
  return isDark ? "brightness(0) invert(1)" : "none";
}

/**
 * Backward compatibility - يرجع URL الصورة
 * @deprecated استخدم getMoeLogoUrl() بدلاً منه
 */
export function getMoeLogoDataUrl(_variant: "white" | "original" = "white", _height: number = 70): string {
  return MOE_LOGO_FULL;
}

export default MoeLogo;
