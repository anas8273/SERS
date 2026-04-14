'use client';
import { ta } from '@/i18n/auto-translations';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Gift,
  Copy,
  Share2,
  Users,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  Wallet,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  availableBalance: number;
  referralCode: string | null;
  referralLink: string | null;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'active' | 'completed';
  created_at: string;
  earnings: number;
}

interface EarningRecord {
  id: string;
  type: 'commission' | 'bonus';
  amount: number;
  description: string;
  created_at: string;
  status: string;
}

interface ReferralSystemProps {
  userId: string;
}

export function ReferralSystem({ userId }: ReferralSystemProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'rewards'>('overview');

  // ─── Fetch Stats ──────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.getReferralStats();
      if (res?.success && res?.data) {
        const d = res.data;
        setStats({
          totalReferrals:   d.total_referrals   ?? 0,
          activeReferrals:  d.active_referrals  ?? 0,
          pendingReferrals: d.pending_referrals  ?? 0,
          totalEarnings:    d.total_earnings    ?? 0,
          availableBalance: d.available_balance ?? 0,
          referralCode:     d.referral_code     ?? null,
          referralLink:     d.referral_link     ?? null,
        });
      }
    } catch {
      // stats specific error — surface via error state
      throw new Error('فشل تحميل إحصائيات الإحالة');
    }
  }, []);

  // ─── Fetch Referrals List ─────────────────────────────
  const fetchReferrals = useCallback(async () => {
    try {
      const res = await api.getReferralList({ per_page: 20 });
      if (res?.success && res?.data) {
        const items = res.data?.data ?? res.data ?? [];
        setReferrals(
          items.map((r: any) => ({
            id:         r.id,
            name:       r.name,
            email:      r.email,
            status:     r.status ?? (r.is_active ? 'active' : 'pending'),
            created_at: r.created_at,
            earnings:   r.earnings ?? 0,
          }))
        );
      }
    } catch {
      // non-critical — just show empty list
      setReferrals([]);
    }
  }, []);

  // ─── Fetch Earnings ────────────────────────────────────
  const fetchEarnings = useCallback(async () => {
    try {
      const res = await api.getReferralEarnings({ per_page: 10 });
      if (res?.success && res?.data) {
        const items = res.data?.data ?? res.data ?? [];
        setEarnings(items);
      }
    } catch {
      setEarnings([]);
    }
  }, []);

  // ─── Initial Load ──────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.allSettled([fetchStats(), fetchReferrals(), fetchEarnings()]);
    } catch (err: any) {
      setError(err.message ?? 'حدث خطأ في تحميل بيانات الإحالة');
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats, fetchReferrals, fetchEarnings]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Generate Referral Code ────────────────────────────
  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateReferralCode();
      if (res?.success && res?.data) {
        setStats(prev => prev ? {
          ...prev,
          referralCode: res.data.referral_code,
          referralLink: res.data.referral_link,
        } : null);
        toast.success(t('toast.referral.created'));
      }
    } catch {
      toast.error(t('toast.referral.failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Copy to Clipboard ────────────────────────────────
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t('toast.referral.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('toast.referral.copyFailed'));
    }
  };

  // ─── Share ────────────────────────────────────────────
  const shareReferral = async () => {
    if (navigator.share && stats?.referralLink) {
      try {
        await navigator.share({
          title: 'انضم إلى SERS',
          text: 'انضم إلى منصة SERS للخدمات التعليمية واحصل على خصم خاص!',
          url: stats.referralLink,
        });
      } catch {
        // User cancelled share — not an error
      }
    } else if (stats?.referralLink) {
      copyToClipboard(stats.referralLink);
    }
  };

  // ─── Status Badge ─────────────────────────────────────
  const getStatusBadge = (status: Referral['status']) => {
    const styles = {
      pending:   'bg-yellow-100 text-yellow-700',
      active:    'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    };
    const labels = {
      pending:   'قيد الانتظار',
      active:    'نشط',
      completed: 'مكتمل',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // ─── Format Date ──────────────────────────────────────
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // ─── Loading ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500">{ta('جاري تحميل بيانات الإحالة...', 'Loading referral data...')}</p>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-gray-700 font-medium">{error}</p>
        <Button variant="outline" onClick={fetchAll} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {ta('إعادة المحاولة', 'Try Again')}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-l from-blue-50 to-purple-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl text-white">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{ta('برنامج الإحالات والمكافآت', 'Referral & Rewards Program')}</h2>
            <p className="text-gray-600 text-sm">{ta('ادعُ أصدقاءك واكسب مكافآت مجانية', 'Invite your friends and earn free rewards')}</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white rounded-lg p-4 border">
          {stats?.referralLink ? (
            <>
              <p className="text-sm text-gray-600 mb-2">{ta('رابط الإحالة الخاص بك:', 'Your Referral Link:')}</p>
              <div className="flex gap-2">
                <Input
                  value={stats.referralLink}
                  readOnly
                  className="flex-1 bg-gray-50 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(stats.referralLink!)}
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="sm" onClick={shareReferral}>
                  <Share2 className="h-4 w-4 ms-2" />
                  {ta('مشاركة', 'Share')}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {ta('كود الإحالة:', 'Referral Code:')}<span className="font-mono font-bold">{stats.referralCode}</span>
              </p>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600 mb-3">{ta('لا يوجد كود إحالة حتى الآن', 'No referral code yet')}</p>
              <Button
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                {isGenerating ? 'جاري الإنشاء...' : 'إنشاء كود إحالة'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          {[
            { id: 'overview',  label: 'نظرة عامة', icon: TrendingUp },
            { id: 'referrals', label: 'الإحالات',   icon: Users },
            { id: 'rewards',   label: 'المكافآت',   icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">{stats?.totalReferrals ?? 0}</p>
                <p className="text-sm text-blue-600">{ta('إجمالي الإحالات', 'Total Referrals')}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{stats?.activeReferrals ?? 0}</p>
                <p className="text-sm text-green-600">{ta('إحالات نشطة', 'Active Referrals')}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-700">{stats?.pendingReferrals ?? 0}</p>
                <p className="text-sm text-yellow-600">{ta('قيد الانتظار', 'Pending')}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Wallet className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-700">{stats?.totalEarnings ?? 0} ر.س</p>
                <p className="text-sm text-purple-600">{ta('إجمالي الأرباح', 'Total Profits')}</p>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-800 mb-4">{ta('كيف يعمل البرنامج؟', 'How does the program work?')}</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { step: '1', title: 'شارك رابطك', desc: 'أرسل رابط الإحالة لأصدقائك ومعارفك' },
                  { step: '2', title: 'يسجل صديقك', desc: 'عند تسجيله باستخدام رابطك الخاص' },
                  { step: '3', title: 'اكسب المكافآت', desc: 'احصل على 10% من أول عملية شراء' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            {referrals.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-gray-600">{ta('لا توجد إحالات حتى الآن', 'No referrals yet')}</p>
                <p className="text-sm mt-1">{ta('شارك رابطك لبدء كسب المكافآت', 'Share your link to start earning rewards')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-start p-3 font-medium">{ta('الاسم', 'Name')}</th>
                      <th className="text-start p-3 font-medium">{ta('البريد', 'Email')}</th>
                      <th className="text-start p-3 font-medium">{ta('الحالة', 'Status')}</th>
                      <th className="text-start p-3 font-medium">{ta('تاريخ الانضمام', 'Join Date')}</th>
                      <th className="text-start p-3 font-medium">{ta('الأرباح', 'Profits')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {referrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium">{referral.name}</td>
                        <td className="p-3 text-gray-500">{referral.email}</td>
                        <td className="p-3">{getStatusBadge(referral.status)}</td>
                        <td className="p-3 text-gray-500">{formatDate(referral.created_at)}</td>
                        <td className="p-3 font-semibold text-green-600">
                          {referral.earnings > 0 ? `${referral.earnings} ر.س` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            {/* Available Balance */}
            <div className="bg-gradient-to-l from-green-500 to-emerald-500 rounded-xl p-6 text-white">
              <p className="text-green-100 mb-1 text-sm">{ta('الرصيد المتاح للسحب', 'Available Balance for Withdrawal')}</p>
              <p className="text-4xl font-bold mb-4">
                {stats?.availableBalance ?? 0} <span className="text-2xl">{ta('ر.س', 'SAR')}</span>
              </p>
              {(stats?.availableBalance ?? 0) >= 50 ? (
                <Button className="bg-white text-green-600 hover:bg-green-50 font-semibold">
                  <Wallet className="h-4 w-4 ms-2" />
                  {ta('طلب سحب الأرباح', 'Request Earnings Withdrawal')}
                </Button>
              ) : (
                <p className="text-green-200 text-xs">
                  الحد الأدنى للسحب: 50 ر.س (المتبقي: {Math.max(0, 50 - (stats?.availableBalance ?? 0))} ر.س)
                </p>
              )}
            </div>

            {/* Earnings History */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4">{ta('سجل المكافآت', 'Rewards History')}</h3>
              {earnings.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Award className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{ta('لا توجد مكافآت حتى الآن', 'No rewards yet')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {earnings.map((earning) => (
                    <div
                      key={earning.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          earning.type === 'commission'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {earning.type === 'commission'
                            ? <Users className="h-4 w-4" />
                            : <Gift className="h-4 w-4" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800">{earning.description}</p>
                          <p className="text-xs text-gray-400">{formatDate(earning.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="font-bold text-green-600">+{earning.amount} ر.س</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          earning.status === 'available'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {earning.status === 'available' ? 'متاح' : 'محجوز'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReferralSystem;
