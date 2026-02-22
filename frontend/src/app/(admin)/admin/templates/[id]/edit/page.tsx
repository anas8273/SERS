'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TemplateForm from '@/components/admin/templates/TemplateForm';
import { SchemaBuilder } from '@/components/admin/SchemaBuilder';
import { TemplateMapper } from '@/components/admin/TemplateMapper';
import { AIPromptManager } from '@/components/admin/AIPromptManager';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowRightIcon,
  PencilIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const TABS: TabItem[] = [
  {
    id: 'info',
    label: 'المعلومات الأساسية',
    icon: DocumentTextIcon,
    description: 'اسم القالب، الوصف، السعر، التصنيف',
    color: 'blue',
  },
  {
    id: 'schema',
    label: 'منشئ النماذج',
    icon: Cog6ToothIcon,
    description: 'إدارة حقول القالب (Form Builder)',
    color: 'green',
  },
  {
    id: 'mapper',
    label: 'محرر الإطارات',
    icon: PaintBrushIcon,
    description: 'تحديد مواقع النصوص على التصميم',
    color: 'orange',
  },
  {
    id: 'ai',
    label: 'الذكاء الاصطناعي',
    icon: SparklesIcon,
    description: 'إعداد Hidden Prompts لكل حقل',
    color: 'purple',
  },
];

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('info');
  const [templateData, setTemplateData] = useState<any>(null);
  const [schemaFields, setSchemaFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplateData();
  }, [params.id]);

  const loadTemplateData = async () => {
    try {
      const [templateRes, schemaRes] = await Promise.all([
        api.getAdminTemplate(params.id),
        api.get(`/admin/templates/${params.id}/schema`).catch(() => ({ success: false, data: null })),
      ]);

      if (templateRes.success) {
        setTemplateData(templateRes.data);
      }
      if (schemaRes.success && schemaRes.data) {
        setSchemaFields(schemaRes.data.mysql_fields || []);
      }
    } catch (error) {
      console.error('Failed to load template data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTabColorClasses = (tab: TabItem, isActive: boolean) => {
    const colors: Record<string, { active: string; inactive: string }> = {
      blue: {
        active: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent',
      },
      green: {
        active: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent',
      },
      orange: {
        active: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent',
      },
      purple: {
        active: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent',
      },
    };
    return isActive ? colors[tab.color].active : colors[tab.color].inactive;
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/admin" className="hover:text-gray-700 dark:hover:text-gray-200">لوحة التحكم</Link>
        <ChevronLeftIcon className="w-4 h-4" />
        <Link href="/admin/templates" className="hover:text-gray-700 dark:hover:text-gray-200">القوالب</Link>
        <ChevronLeftIcon className="w-4 h-4" />
        <span className="text-gray-900 dark:text-white font-medium">
          {templateData?.name_ar || 'تعديل القالب'}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <PencilIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              تعديل القالب
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {templateData?.name_ar || 'جاري التحميل...'}
              {templateData?.type === 'interactive' && (
                <span className="mr-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                  تفاعلي
                </span>
              )}
              {templateData?.type === 'ready' && (
                <span className="mr-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                  جاهز
                </span>
              )}
            </p>
          </div>
        </div>

        <Link
          href="/admin/templates"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowRightIcon className="w-4 h-4" />
          العودة للقوالب
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;

            // Hide mapper and AI tabs for ready templates
            if ((tab.id === 'schema' || tab.id === 'mapper' || tab.id === 'ai') && templateData?.type === 'ready') {
              return null;
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all whitespace-nowrap ${getTabColorClasses(tab, isActive)}`}
              >
                <TabIcon className="w-5 h-5" />
                <div className="text-right">
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className="text-xs opacity-70 hidden sm:block">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'info' && (
          <TemplateForm templateId={params.id} />
        )}

        {activeTab === 'schema' && templateData?.type === 'interactive' && (
          <SchemaBuilder
            templateId={params.id}
            onSchemaUpdate={(fields) => setSchemaFields(fields)}
          />
        )}

        {activeTab === 'mapper' && templateData?.type === 'interactive' && (
          <TemplateMapper
            templateId={params.id}
            fields={schemaFields.map(f => ({
              id: f.id || f.name,
              name: f.name,
              label_ar: f.label_ar,
            }))}
          />
        )}

        {activeTab === 'ai' && templateData?.type === 'interactive' && (
          <AIPromptManager
            templateId={params.id}
            fields={schemaFields.map(f => ({
              id: f.id || f.name,
              name: f.name,
              label_ar: f.label_ar,
              ai_enabled: f.ai_enabled || false,
            }))}
          />
        )}
      </div>
    </div>
  );
}
