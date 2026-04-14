'use client';
import dynamic from 'next/dynamic';
const C = dynamic(() => import('./_AchievementContent'), { loading: () => <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center"><div className="w-10 h-10 rounded-2xl bg-indigo-500/20 animate-pulse" /></div>, ssr: false });
export default function AchievementReportBuilderPage() { return <C />; }
