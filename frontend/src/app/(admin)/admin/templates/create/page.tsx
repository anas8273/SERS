import TemplateForm from '@/components/admin/templates/TemplateForm';
import { PlusIcon } from '@heroicons/react/24/outline';

export const metadata = {
    title: 'إضافة قالب جديد | لوحة الإدارة',
};

export default function CreateTemplatePage() {
    return (
        <div className="max-w-5xl mx-auto py-8 px-4">

            {/* رأس الصفحة */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
                    <PlusIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إضافة قالب جديد</h1>
                    <p className="text-gray-500 dark:text-gray-400">أدخل تفاصيل القالب الجديد لنشره في المتجر</p>
                </div>
            </div>

            {/* نموذج الإضافة */}
            <TemplateForm />
        </div>
    );
}