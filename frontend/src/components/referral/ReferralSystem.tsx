'use client';

import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Copy, 
  Share2, 
  Users, 
  Award, 
  TrendingUp,
  CheckCircle,
  Clock,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  availableBalance: number;
  referralCode: string;
  referralLink: string;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'active' | 'completed';
  joinedAt: string;
  earnings: number;
}

interface ReferralSystemProps {
  userId: string;
}

export function ReferralSystem({ userId }: ReferralSystemProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'rewards'>('overview');

  useEffect(() => {
    // Fetch referral stats
    fetchReferralData();
  }, [userId]);

  const fetchReferralData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      setStats({
        totalReferrals: 15,
        activeReferrals: 12,
        pendingReferrals: 3,
        totalEarnings: 450,
        availableBalance: 200,
        referralCode: 'SERS2024',
        referralLink: `https://sers.sa/ref/${userId}`,
      });

      setReferrals([
        {
          id: '1',
          name: 'أحمد محمد',
          email: 'ahmed@example.com',
          status: 'completed',
          joinedAt: '2024-01-15',
          earnings: 50,
        },
        {
          id: '2',
          name: 'سارة علي',
          email: 'sara@example.com',
          status: 'active',
          joinedAt: '2024-01-18',
          earnings: 30,
        },
        {
          id: '3',
          name: 'محمد خالد',
          email: 'mohammed@example.com',
          status: 'pending',
          joinedAt: '2024-01-19',
          earnings: 0,
        },
      ]);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareReferral = async () => {
    if (navigator.share && stats) {
      try {
        await navigator.share({
          title: 'انضم إلى SERS',
          text: 'انضم إلى منصة SERS للخدمات التعليمية واحصل على خصم خاص!',
          url: stats.referralLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const getStatusBadge = (status: Referral['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      active: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    };
    const labels = {
      pending: 'قيد الانتظار',
      active: 'نشط',
      completed: 'مكتمل',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <h2 className="text-xl font-bold text-gray-800">برنامج الإحالات والمكافآت</h2>
            <p className="text-gray-600 text-sm">ادعُ أصدقاءك واكسب مكافآت مجانية</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-600 mb-2">رابط الإحالة الخاص بك:</p>
          <div className="flex gap-2">
            <Input
              value={stats?.referralLink || ''}
              readOnly
              className="flex-1 bg-gray-50"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(stats?.referralLink || '')}
            >
              {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button onClick={shareReferral}>
              <Share2 className="h-4 w-4 ml-2" />
              مشاركة
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            كود الإحالة: <span className="font-mono font-bold">{stats?.referralCode}</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: TrendingUp },
            { id: 'referrals', label: 'الإحالات', icon: Users },
            { id: 'rewards', label: 'المكافآت', icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
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
                <p className="text-2xl font-bold text-blue-700">{stats?.totalReferrals}</p>
                <p className="text-sm text-blue-600">إجمالي الإحالات</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{stats?.activeReferrals}</p>
                <p className="text-sm text-green-600">إحالات نشطة</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-700">{stats?.pendingReferrals}</p>
                <p className="text-sm text-yellow-600">قيد الانتظار</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Wallet className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-700">{stats?.totalEarnings} ر.س</p>
                <p className="text-sm text-purple-600">إجمالي الأرباح</p>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-800 mb-4">كيف يعمل البرنامج؟</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className="font-medium">شارك رابطك</p>
                    <p className="text-sm text-gray-600">أرسل رابط الإحالة لأصدقائك</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className="font-medium">يسجل صديقك</p>
                    <p className="text-sm text-gray-600">عند التسجيل باستخدام رابطك</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className="font-medium">اكسب المكافآت</p>
                    <p className="text-sm text-gray-600">احصل على 10% من أول عملية شراء</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>لا توجد إحالات حتى الآن</p>
                <p className="text-sm">شارك رابطك لبدء كسب المكافآت</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">الاسم</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">البريد</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">الحالة</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">تاريخ الانضمام</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">الأرباح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {referrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-gray-50">
                        <td className="p-3">{referral.name}</td>
                        <td className="p-3 text-gray-600">{referral.email}</td>
                        <td className="p-3">{getStatusBadge(referral.status)}</td>
                        <td className="p-3 text-gray-600">{referral.joinedAt}</td>
                        <td className="p-3 font-medium text-green-600">{referral.earnings} ر.س</td>
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
              <p className="text-green-100 mb-1">الرصيد المتاح</p>
              <p className="text-4xl font-bold">{stats?.availableBalance} ر.س</p>
              <Button className="mt-4 bg-white text-green-600 hover:bg-green-50">
                سحب الأرباح
              </Button>
            </div>

            {/* Rewards History */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4">سجل المكافآت</h3>
              <div className="space-y-3">
                {[
                  { type: 'referral', amount: 50, date: '2024-01-15', description: 'مكافأة إحالة - أحمد محمد' },
                  { type: 'bonus', amount: 20, date: '2024-01-10', description: 'مكافأة ترحيبية' },
                  { type: 'referral', amount: 30, date: '2024-01-05', description: 'مكافأة إحالة - سارة علي' },
                ].map((reward, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        reward.type === 'referral' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {reward.type === 'referral' ? <Users className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{reward.description}</p>
                        <p className="text-sm text-gray-500">{reward.date}</p>
                      </div>
                    </div>
                    <p className="font-bold text-green-600">+{reward.amount} ر.س</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReferralSystem;
