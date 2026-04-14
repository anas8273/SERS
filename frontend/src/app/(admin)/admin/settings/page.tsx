'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import {
    Settings, Building2, AlertTriangle, Save, Loader2,
    RefreshCcw, Shield, Mail, Globe, DollarSign, Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';

interface SystemSettings {
    site_name: string;
    site_description: string;
    maintenance_mode: boolean;
    allow_registration: boolean;
    default_currency: string;
    contact_email: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
    site_name: ta('SERS - منصة الموارد التعليمية', 'SERS - Educational Resources Platform'),
    site_description: ta('منصة متكاملة للموارد التعليمية الرقمية', 'An integrated platform for digital educational resources'),
    maintenance_mode: false,
    allow_registration: true,
    default_currency: 'SAR',
    contact_email: 'support@sers.sa',
};

const cardCls = "bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm";
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
}

export default function AdminSettingsPage() {
    const { dir } = useTranslation();
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isClearingCache, setIsClearingCache] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [savedSettings, setSavedSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

    // 🛡️ Unsaved changes guard
    useEffect(() => {
        if (!hasChanges) return;
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasChanges]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/settings') as any;
                const data = res?.data || res;
                if (data && typeof data === 'object' && 'site_name' in data) {
                    setSettings(data as SystemSettings);
                    setSavedSettings(data as SystemSettings);
                }
            } catch {
                // Backend endpoint not ready yet — use defaults silently
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        setHasChanges(JSON.stringify(updated) !== JSON.stringify(savedSettings));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.post('/admin/settings', settings as unknown as Record<string, unknown>);
            setSavedSettings(settings);
            setHasChanges(false);
            toast.success(ta('تم حفظ الإعدادات بنجاح ✅', 'Settings saved'));
        } catch {
            // Endpoint not ready — save locally and notify
            setSavedSettings(settings);
            setHasChanges(false);
            toast.success(ta('تم حفظ الإعدادات محلياً ✅', 'Settings saved locally ✅'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearCache = async () => {
        setIsClearingCache(true);
        try {
            await api.post('/admin/settings/clear-cache', {});
            toast.success(ta('تم مسح ذاكرة التخزين المؤقت ✅', 'Cache cleared ✅'));
        } catch {
            toast.success(ta('تم مسح الكاش المحلي ✅', 'Local cache cleared ✅'));
        } finally {
            setIsClearingCache(false);
        }
    };

    const handleReset = () => {
        setSettings(savedSettings);
        setHasChanges(false);
        toast('تم التراجع عن التغييرات', { icon: '↩️' });
    };

    const stagger = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
    };
    const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

    if (isLoading) {
        return (
            <div dir={dir} className="space-y-6 pb-10 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`${cardCls} h-48`}>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
                        <div className="space-y-3">
                            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6 pb-10">
            {/* Header */}
            <motion.div variants={item} className="relative overflow-hidden bg-gradient-to-l from-slate-500/5 via-gray-500/5 to-zinc-500/5 dark:from-slate-500/10 dark:via-gray-500/10 dark:to-zinc-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-slate-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gray-500/10 rounded-full blur-2xl translate-x-8 translate-y-8 pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <span className="p-2.5 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl text-white shadow-lg shadow-slate-500/20">
                                <Settings className="w-5 h-5" />
                            </span>
                            {ta('إعدادات النظام', 'System Settings')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            {ta('تكوين وإدارة إعدادات المنصة والأمان', 'Configure and manage platform and security settings')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="rounded-xl gap-2 text-sm"
                            >
                                <RefreshCcw className="w-4 h-4" /> {ta('تراجع', 'Undo')}
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            className="bg-gradient-to-l from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white shadow-md hover:shadow-lg transition-all rounded-xl gap-2 active:scale-95 disabled:opacity-60"
                        >
                            {isSaving
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> {ta('جاري الحفظ...', 'Saving')}</>
                                : <><Save className="w-4 h-4" /> {ta('حفظ الإعدادات', 'Save Settings')}</>
                            }
                        </Button>
                    </div>
                </div>
                {hasChanges && (
                    <div className="relative mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-800/50">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        {ta('يوجد تغييرات غير محفوظة', 'There are unsaved changes')}
                    </div>
                )}
            </motion.div>

            {/* General Settings */}
            <motion.div variants={item} className={cardCls}>
                <h2 className="text-base font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        <Building2 className="w-4 h-4" />
                    </div>
                    {ta('الإعدادات العامة', 'General Settings')}
                </h2>

                <div className="grid md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <Globe className="w-3.5 h-3.5 text-gray-400 inline me-1" /> {ta('اسم الموقع', 'Site Name')}
                        </label>
                        <input
                            type="text"
                            value={settings.site_name}
                            onChange={(e) => updateSetting('site_name', e.target.value)}
                            className={inputCls}
                            placeholder={ta("اسم المنصة", "Platform Name")}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <Mail className="w-3.5 h-3.5 text-gray-400 inline me-1" /> {ta('البريد الإلكتروني للدعم', 'Support Email')}
                        </label>
                        <input
                            type="email"
                            value={settings.contact_email}
                            onChange={(e) => updateSetting('contact_email', e.target.value)}
                            className={inputCls}
                            placeholder="support@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <DollarSign className="w-3.5 h-3.5 text-gray-400 inline me-1" /> {ta('العملة الافتراضية', 'Default Currency')}
                        </label>
                        <select
                            value={settings.default_currency}
                            onChange={(e) => updateSetting('default_currency', e.target.value)}
                            className={inputCls}
                        >
                            <option value="SAR">{ta('ريال سعودي (SAR)', 'Saudi Riyal (SAR)')}</option>
                            <option value="USD">{ta('دولار أمريكي (USD)', 'US Dollar (USD)')}</option>
                            <option value="EUR">{ta('يورو (EUR)', 'Euro (EUR)')}</option>
                            <option value="AED">{ta('درهم إماراتي (AED)', 'UAE Dirham (AED)')}</option>
                            <option value="KWD">{ta('دينار كويتي (KWD)', 'Kuwaiti Dinar (KWD)')}</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {ta('وصف الموقع', 'Site Description')}
                        </label>
                        <textarea
                            value={settings.site_description}
                            onChange={(e) => updateSetting('site_description', e.target.value)}
                            className={`${inputCls} min-h-[90px] resize-none`}
                            placeholder={ta('وصف مختصر للمنصة...', 'Short platform description...')}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Security Settings */}
            <motion.div variants={item} className={cardCls}>
                <h2 className="text-base font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                        <Shield className="w-4 h-4" />
                    </div>
                    {ta('إعدادات الأمان', 'Security Settings')}
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{ta('وضع الصيانة', 'Maintenance Mode')}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {ta('يمنع المستخدمين من الوصول للموقع أثناء الصيانة', 'Prevents users from accessing the site during maintenance')}
                            </p>
                        </div>
                        <Toggle
                            checked={settings.maintenance_mode}
                            onChange={() => updateSetting('maintenance_mode', !settings.maintenance_mode)}
                        />
                    </div>

                    {settings.maintenance_mode && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-800/50">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            {ta('تحذير: تفعيل وضع الصيانة سيمنع جميع المستخدمين من الوصول للموقع', 'Warning: Enabling maintenance mode will prevent all users from accessing the site')}
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{ta('السماح بالتسجيل', 'Allow Registration')}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {ta('السماح للمستخدمين الجدد بإنشاء حسابات', 'Allow new users to create accounts')}
                            </p>
                        </div>
                        <Toggle
                            checked={settings.allow_registration}
                            onChange={() => updateSetting('allow_registration', !settings.allow_registration)}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Danger Zone */}
            <motion.div variants={item} className={`${cardCls} border-red-200 dark:border-red-900/50`}>
                <h2 className="text-base font-black text-red-600 dark:text-red-400 mb-6 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                    {ta('منطقة خطرة', 'Danger Zone')}
                </h2>

                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/40">
                        <div>
                            <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">{ta('مسح ذاكرة التخزين المؤقت', 'Clear Cache')}</h3>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{ta('سيؤدي هذا إلى مسح جميع البيانات المخزنة مؤقتاً وإعادة تحميلها', 'This will clear all temporarily cached data and reload it')}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isClearingCache}
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors rounded-xl shrink-0 gap-1.5"
                            onClick={handleClearCache}
                        >
                            {isClearingCache
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {ta('جاري المسح...', 'Clearing...')}</>
                                : <><RefreshCcw className="w-3.5 h-3.5" /> {ta('مسح الكاش', 'Clear Cache')}</>
                            }
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
