'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface SystemSettings {
    site_name: string;
    site_description: string;
    maintenance_mode: boolean;
    allow_registration: boolean;
    default_currency: string;
    contact_email: string;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SystemSettings>({
        site_name: 'SERS - منصة الموارد التعليمية',
        site_description: 'منصة متكاملة للموارد التعليمية الرقمية',
        maintenance_mode: false,
        allow_registration: true,
        default_currency: 'SAR',
        contact_email: 'support@sers.sa',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // In production, this would call an API
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('تم حفظ الإعدادات بنجاح ✅');
        } catch (error) {
            toast.error('فشل في حفظ الإعدادات');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    إعدادات النظام ⚙️
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    تكوين وإدارة إعدادات المنصة
                </p>
            </div>

            {/* General Settings */}
            <div className="admin-card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="stat-icon-blue">🏢</span>
                    الإعدادات العامة
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            اسم الموقع
                        </label>
                        <input
                            type="text"
                            value={settings.site_name}
                            onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                            className="input-field"
                            placeholder="اسم المنصة"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            البريد الإلكتروني للدعم
                        </label>
                        <input
                            type="email"
                            value={settings.contact_email}
                            onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                            className="input-field"
                            placeholder="support@example.com"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            وصف الموقع
                        </label>
                        <textarea
                            value={settings.site_description}
                            onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                            className="input-field min-h-[100px] resize-none"
                            placeholder="وصف مختصر للمنصة..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            العملة الافتراضية
                        </label>
                        <select
                            value={settings.default_currency}
                            onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
                            className="input-field"
                        >
                            <option value="SAR">ريال سعودي (SAR)</option>
                            <option value="USD">دولار أمريكي (USD)</option>
                            <option value="EUR">يورو (EUR)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="admin-card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="stat-icon-purple">🔐</span>
                    إعدادات الأمان
                </h2>

                <div className="space-y-6">
                    {/* Maintenance Mode */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                                وضع الصيانة
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                تفعيل وضع الصيانة سيمنع المستخدمين من الوصول للموقع
                            </p>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenance_mode
                                    ? 'bg-red-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Allow Registration */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                                السماح بالتسجيل
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                السماح للمستخدمين الجدد بإنشاء حسابات
                            </p>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, allow_registration: !settings.allow_registration })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.allow_registration
                                    ? 'bg-green-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.allow_registration ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="admin-card border-red-200 dark:border-red-900/50">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6 flex items-center gap-2">
                    ⚠️ منطقة خطرة
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <div>
                            <h3 className="font-medium text-red-800 dark:text-red-300">
                                مسح ذاكرة التخزين المؤقت
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                سيؤدي هذا إلى مسح جميع البيانات المخزنة مؤقتاً
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => toast.success('تم مسح ذاكرة التخزين المؤقت')}
                        >
                            مسح
                        </Button>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary min-w-[150px]"
                >
                    {isSaving ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin">⏳</span>
                            جاري الحفظ...
                        </span>
                    ) : (
                        '💾 حفظ الإعدادات'
                    )}
                </Button>
            </div>
        </div>
    );
}
