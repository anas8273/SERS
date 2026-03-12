/**
 * لوحة تحليل الفجوات - على نمط معياري
 * تظهر نسبة الإنجاز لكل معيار (أخضر/أصفر/أحمر)
 */
import { STANDARDS, getStandardProgress, getOverallCoverage, type Evidence } from "@/lib/standards-data";
import { CheckCircle, AlertTriangle, XCircle, TrendingUp } from "lucide-react";

interface Props {
  evidences: Evidence[];
  onSelectStandard: (standardId: string) => void;
}

export default function GapAnalysis({ evidences, onSelectStandard }: Props) {
  const overall = getOverallCoverage(evidences);

  return (
    <div className="space-y-4">
      {/* ملخص عام */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            تحليل الفجوات
          </h2>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <span className="text-2xl font-black text-teal-600">{overall.percentage}%</span>
          </div>
        </div>

        {/* شريط التقدم العام */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${overall.percentage}%`,
              background: overall.percentage >= 80
                ? "linear-gradient(90deg, #059669, #10B981)"
                : overall.percentage >= 50
                ? "linear-gradient(90deg, #D97706, #F59E0B)"
                : "linear-gradient(90deg, #DC2626, #EF4444)",
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{overall.coveredIndicators} مؤشر مغطى من {overall.totalIndicators}</span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              {overall.coveredStandards} مكتمل
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {overall.partialStandards} جزئي
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {overall.missingStandards} مفقود
            </span>
          </div>
        </div>
      </div>

      {/* تفاصيل كل معيار */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STANDARDS.map((std) => {
          const progress = getStandardProgress(std.id, evidences);
          const status = progress.percentage === 100 ? "complete" : progress.percentage > 0 ? "partial" : "missing";

          return (
            <button
              key={std.id}
              onClick={() => onSelectStandard(std.id)}
              className={`bg-white rounded-xl border p-4 text-right transition-all hover:shadow-md ${
                status === "complete"
                  ? "border-teal-200 hover:border-teal-400"
                  : status === "partial"
                  ? "border-amber-200 hover:border-amber-400"
                  : "border-red-200 hover:border-red-400"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl shrink-0">{std.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-800 truncate" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                      {std.number}. {std.title}
                    </h3>
                    {status === "complete" && <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />}
                    {status === "partial" && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                    {status === "missing" && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  </div>

                  {/* شريط تقدم المعيار */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progress.percentage}%`,
                        backgroundColor: status === "complete" ? "#059669" : status === "partial" ? "#D97706" : "#EF4444",
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">
                      {progress.covered}/{progress.total} مؤشر
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        status === "complete" ? "text-teal-600" : status === "partial" ? "text-amber-600" : "text-red-500"
                      }`}
                    >
                      {progress.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
