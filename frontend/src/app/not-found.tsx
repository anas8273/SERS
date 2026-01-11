import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                {/* Illustration */}
                <div className="mb-8">
                    <div className="text-9xl font-bold text-gray-200">404</div>
                    <div className="text-6xl -mt-16">😕</div>
                </div>

                {/* Message */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    الصفحة غير موجودة
                </h1>
                <p className="text-gray-600 mb-8">
                    عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها أو حذفها.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/">
                        <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8">
                            🏠 العودة للرئيسية
                        </Button>
                    </Link>
                    <Link href="/marketplace">
                        <Button variant="outline" className="px-8">
                            🛍️ تصفح المتجر
                        </Button>
                    </Link>
                </div>

                {/* Help */}
                <p className="mt-8 text-sm text-gray-500">
                    تحتاج مساعدة؟{' '}
                    <Link href="/contact" className="text-primary-600 hover:underline">
                        تواصل معنا
                    </Link>
                </p>
            </div>
        </div>
    );
}
