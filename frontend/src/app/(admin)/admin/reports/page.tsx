'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  fields: string[];
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'sales', name: 'تقرير المبيعات', description: 'تقرير شامل عن المبيعات والإيرادات',
    icon: '💰', color: '#10B981', fields: ['الفترة', 'التصنيف', 'نوع القالب'],
  },
  {
    id: 'users', name: 'تقرير المستخدمين', description: 'إحصائيات المستخدمين والتسجيلات',
    icon: '👥', color: '#3B82F6', fields: ['الفترة', 'الحالة', 'نوع الحساب'],
  },
  {
    id: 'templates', name: 'تقرير القوالب', description: 'أداء القوالب والتحميلات',
    icon: '📋', color: '#8B5CF6', fields: ['الفترة', 'التصنيف', 'النوع'],
  },
  {
    id: 'services', name: 'تقرير الخدمات', description: 'استخدام الخدمات التعليمية',
    icon: '🎓', color: '#F59E0B', fields: ['الفترة', 'الخدمة', 'المستخدم'],
  },
  {
    id: 'ai', name: 'تقرير الذكاء الاصطناعي', description: 'استهلاك وأداء الذكاء الاصطناعي',
    icon: '🤖', color: '#EC4899', fields: ['الفترة', 'النموذج', 'نوع الطلب'],
  },
  {
    id: 'analytics', name: 'تقرير التحليلات', description: 'تحليلات شاملة للنظام',
    icon: '📊', color: '#06B6D4', fields: ['الفترة', 'المقياس'],
  },
];

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('تم إنشاء التقرير بنجاح');
    } catch (error) {
      toast.error('فشل في إنشاء التقرير');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            📑 التقارير
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إنشاء وتصدير تقارير شاملة عن النظام
          </p>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">الفترة الزمنية</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-500 mb-1">من</label>
            <Input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">إلى</label>
            <Input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              const today = new Date();
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              setDateRange({ from: weekAgo.toISOString().split('T')[0], to: today.toISOString().split('T')[0] });
            }} className="text-sm dark:text-gray-200 dark:border-gray-600">
              آخر أسبوع
            </Button>
            <Button variant="outline" onClick={() => {
              const today = new Date();
              const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
              setDateRange({ from: monthAgo.toISOString().split('T')[0], to: today.toISOString().split('T')[0] });
            }} className="text-sm dark:text-gray-200 dark:border-gray-600">
              آخر شهر
            </Button>
            <Button variant="outline" onClick={() => {
              const today = new Date();
              const yearStart = new Date(today.getFullYear(), 0, 1);
              setDateRange({ from: yearStart.toISOString().split('T')[0], to: today.toISOString().split('T')[0] });
            }} className="text-sm dark:text-gray-200 dark:border-gray-600">
              هذا العام
            </Button>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map((report) => (
          <div
            key={report.id}
            className={`bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 transition-all cursor-pointer hover:shadow-md ${
              selectedReport === report.id ? 'ring-2 ring-primary-500 shadow-md' : ''
            }`}
            onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${report.color}20` }}
              >
                {report.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white">{report.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{report.description}</p>
              </div>
            </div>

            {selectedReport === report.id && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-3">
                <div className="flex flex-wrap gap-1">
                  {report.fields.map((field, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg">
                      {field}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleGenerateReport(report.id); }}
                    disabled={isGenerating}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm"
                  >
                    {isGenerating ? '⏳ جاري الإنشاء...' : '📄 إنشاء PDF'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); handleGenerateReport(report.id); }}
                    disabled={isGenerating}
                    className="text-sm dark:text-gray-200 dark:border-gray-600"
                  >
                    📊 Excel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">📁 التقارير الأخيرة</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-3">📑</div>
          <p>لا توجد تقارير سابقة</p>
          <p className="text-sm mt-1">اختر نوع التقرير وحدد الفترة الزمنية لإنشاء تقرير جديد</p>
        </div>
      </div>
    </div>
  );
}
