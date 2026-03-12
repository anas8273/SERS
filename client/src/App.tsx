import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense } from "react";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const PerformanceEvidence = lazy(() => import("./pages/PerformanceEvidence"));
const CertificateBuilder = lazy(() => import("./pages/CertificateBuilder"));
const GradeAnalysis = lazy(() => import("./pages/GradeAnalysis"));
const CoverBuilder = lazy(() => import("./pages/CoverBuilder"));
const TreatmentPlan = lazy(() => import("./pages/TreatmentPlan"));
const SectionPage = lazy(() => import("./pages/SectionPage"));
const SharedPortfolio = lazy(() => import("./pages/SharedPortfolio"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TemplateManager = lazy(() => import("./pages/TemplateManager"));
const SharedTemplate = lazy(() => import("./pages/SharedTemplate"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]" dir="rtl">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500" style={{ fontFamily: "'Tajawal', sans-serif" }}>جاري التحميل...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/performance-evidence"} component={PerformanceEvidence} />
        <Route path={"/certificates"} component={CertificateBuilder} />
        <Route path={"/grade-analysis"} component={GradeAnalysis} />
        <Route path={"/covers"} component={CoverBuilder} />
        <Route path={"/treatment-plans"} component={TreatmentPlan} />
        <Route path={"/section/:sectionId"} component={SectionPage} />
        <Route path={"/share/:token"} component={SharedPortfolio} />
        <Route path={"/admin"} component={AdminDashboard} />
        <Route path={"/admin/templates"} component={TemplateManager} />
        <Route path={"/shared-template/:token"} component={SharedTemplate} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
