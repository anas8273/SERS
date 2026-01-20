import ProductForm from '@/components/admin/products/ProductForm';
import { PlusIcon } from '@heroicons/react/24/outline';

export const metadata = {
    title: 'إضافة قالب جديد | لوحة الإدارة',
};

export default function CreateProductPage() {
    return (
        <div className="max-w-5xl mx-auto py-8 px-4">

            {/* رأس الصفحة */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary-100 text-primary-600 rounded-xl">
                    <PlusIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">إضافة قالب جديد</h1>
                    <p className="text-gray-500">أدخل تفاصيل القالب الجديد لنشره في السوق</p>
                </div>
            </div>

            {/* نموذج الإضافة */}
            <ProductForm />
        </div>
    );
}
