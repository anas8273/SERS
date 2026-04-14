'use client';
import { ta } from '@/i18n/auto-translations';

import { Suspense } from 'react';
import UserForm from '@/components/admin/users/UserForm';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/useTranslation';

function UserEditContent() {
    const params = useParams();
    const userId = params?.id as string;

    if (!userId) return null;

    return <UserForm userId={userId} />;
}

export default function EditUserPage() {
    const { dir } = useTranslation();
    return (
        <div dir={dir} className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">

            {/* رأس الصفحة */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl dark:bg-purple-900 dark:text-purple-300">
                    <UserCircleIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{ta('تعديل بيانات المستخدم', 'Edit User Data')}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{ta('تعديل الاسم، البريد، الصلاحيات، أو كلمة المرور', 'Edit name, email, permissions, or password')}</p>
                </div>
            </div>

            <Suspense fallback={<div className="text-center py-10">SERS</div>}>
                <UserEditContent />
            </Suspense>
        </div>
    );
}
