import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home, ArrowRight } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-b from-background to-muted/30" dir="rtl">
          <div className="flex flex-col items-center w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-xl font-black text-foreground mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
              {this.props.fallbackTitle || "حدث خطأ غير متوقع"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              نعتذر عن هذا الخطأ. يمكنك إعادة تحميل الصفحة أو العودة للرئيسية.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl flex-1",
                  "bg-primary text-primary-foreground font-bold text-sm",
                  "hover:opacity-90 cursor-pointer transition-opacity shadow-sm"
                )}
              >
                <RotateCcw className="w-4 h-4" />
                إعادة تحميل
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl flex-1",
                  "bg-muted text-foreground font-bold text-sm",
                  "hover:bg-muted/80 cursor-pointer transition-colors border border-border/50"
                )}
              >
                <Home className="w-4 h-4" />
                الرئيسية
              </button>
            </div>

            {this.state.error && (
              <div className="mt-6 w-full">
                <button
                  onClick={() => this.setState(prev => ({ ...prev, showDetails: !prev.showDetails }))}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto transition-colors"
                >
                  <ArrowRight className={cn("w-3 h-3 transition-transform", this.state.showDetails && "rotate-90")} />
                  {this.state.showDetails ? "إخفاء التفاصيل" : "عرض التفاصيل التقنية"}
                </button>
                {this.state.showDetails && (
                  <div className="mt-3 p-3 w-full rounded-xl bg-muted/50 border border-border/50 overflow-auto max-h-40 text-left" dir="ltr">
                    <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
                      {this.state.error.message}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
