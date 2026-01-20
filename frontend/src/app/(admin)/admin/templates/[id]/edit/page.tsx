'use client';

import TemplateForm from '@/components/admin/templates/TemplateForm';
import { PencilIcon } from '@heroicons/react/24/outline';

export default function EditTemplatePage({ params }: { params: { id: string } }) {
    return (
        <div className="max-w-5xl mx-auto py-8 px-4">

            {/* رأس الصفحة */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <PencilIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تعديل القالب</h1>
                    <p className="text-gray-500 dark:text-gray-400">تعديل تفاصيل القالب الموجود</p>
                </div>
            </div>

            {/* نموذج التعديل */}
            <TemplateForm templateId={params.id} />
        </div>
    );
}
