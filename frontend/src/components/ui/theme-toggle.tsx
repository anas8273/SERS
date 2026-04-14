'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 w-9 h-9">
                <span className="sr-only">Toggle theme</span>
            </button>
        );
    }

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    return (
        <button
            onClick={cycleTheme}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            title={`Theme: ${theme}`}
        >
            {theme === 'light' && <span className="text-lg">☀️</span>}
            {theme === 'dark' && <span className="text-lg">🌙</span>}
            {theme === 'system' && <span className="text-lg">💻</span>}
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}

export function ThemeDropdown() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const themes = [
        { value: 'light', label: t('theme.light'), icon: '☀️' },
        { value: 'dark', label: t('theme.dark'), icon: '🌙' },
        { value: 'system', label: t('theme.system'), icon: '💻' },
    ] as const;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
                <span className="text-lg">
                    {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    {themes.find((t) => t.value === theme)?.label}
                </span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-50 overflow-hidden">
                        {themes.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => {
                                    setTheme(t.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${theme === t.value ? 'bg-primary/5 dark:bg-primary/15 text-primary' : ''
                                    }`}
                            >
                                <span>{t.icon}</span>
                                <span className="text-sm">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
