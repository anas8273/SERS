'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowRight, BarChart3, Award, BookOpen, Trophy, Star, GraduationCap,
    FileText, Sparkles, CheckCircle2, Clock, Users, Zap, Play, Download,
    Share2, Heart, MessageSquare, Target, FileQuestion, Bot, FolderOpen,
    ChevronLeft, Shield, TrendingUp, HelpCircle, Layers, ArrowLeft,
    ExternalLink, ClipboardList, CalendarDays, ClipboardCheck, ScrollText,
    Lightbulb, FolderArchive, Brain, Settings, PieChart,
} from 'lucide-react';
import type { ServiceDefinition } from '@/types';
import { EmptyState } from '@/components/ui/empty-state';
import { getServiceBySlug, getServices } from '@/lib/firestore-service';
import { DEFAULT_SERVICES } from '@/lib/default-services';
import { useTranslation } from '@/i18n/useTranslation';

// ===== Icon Mapping =====
const ICON_MAP: Record<string, any> = {
    'BarChart3': BarChart3, 'Award': Award, 'ClipboardList': ClipboardList,
    'Trophy': Trophy, 'FileQuestion': FileQuestion, 'Bot': Bot, 'FileText': FileText,
    'Users': Users, 'GraduationCap': GraduationCap, 'Target': Target,
    'BookOpen': BookOpen, 'Star': Star, 'Sparkles': Sparkles,
    'CheckCircle2': CheckCircle2, 'TrendingUp': TrendingUp, 'Zap': Zap,
    'Clock': Clock, 'Shield': Shield, 'Layers': Layers, 'FolderOpen': FolderOpen,
    'FolderArchive': FolderArchive, 'CalendarDays': CalendarDays,
    'ClipboardCheck': ClipboardCheck, 'ScrollText': ScrollText,
    'Brain': Brain, 'Lightbulb': Lightbulb, 'Download': Download,
    'Share2': Share2, 'Heart': Heart, 'Play': Play, 'HelpCircle': HelpCircle,
    'ExternalLink': ExternalLink,
};

function getIcon(iconName: string) {
    return ICON_MAP[iconName] || FileText;
}

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const { t, dir, localizedField } = useTranslation();

    // [PERF] Initialize immediately from DEFAULT_SERVICES — zero-wait for known services
    const [service, setService] = useState<ServiceDefinition | null>(
        () => (DEFAULT_SERVICES.find(s => s.slug === slug) as ServiceDefinition | undefined) || null
    );
    const [relatedServices, setRelatedServices] = useState<ServiceDefinition[]>([]);
    // Only show loading if service is NOT in DEFAULT_SERVICES
    const [isLoading, setIsLoading] = useState(
        () => !DEFAULT_SERVICES.some(s => s.slug === slug)
    );
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        if (!slug) return;
        // Background Firestore refresh — never blocks UI
        (async () => {
            try {
                const fsSvc = await getServiceBySlug(slug);
                if (fsSvc) setService(fsSvc);
                else if (!service) {
                    // slug not in DEFAULT_SERVICES and not in Firestore
                    setService(null);
                }

                const finalSvc = fsSvc || service;
                if (finalSvc?.related_services && finalSvc.related_services.length > 0) {
                    const allSvcs = await getServices();
                    const all = allSvcs.length > 0 ? allSvcs : (DEFAULT_SERVICES as any[]);
                    setRelatedServices(all.filter((s: any) => finalSvc.related_services?.includes(s.slug)));
                }
            } catch (error) {
                logger.error('Background Firestore refresh failed:', error);
            } finally {
                setIsLoading(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
                <Navbar />
                <div className="flex justify-center items-center py-32">
                    <div className="animate-pulse w-12 h-12 rounded-2xl bg-primary/20" />
                </div>
                <Footer />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
                <Navbar />
                <div className="container mx-auto px-4 py-16 flex justify-center">
                   <EmptyState
                       icon={<span className="text-6xl drop-shadow-lg">🔍</span>}
                       title={t('serviceDetail.notFound')}
                       description={t('serviceDetail.notFoundDesc')}
                       action={
                           <Button onClick={() => router.push('/services')}>
                               <ArrowRight className="h-4 w-4 me-2" />
                               {t('serviceDetail.backToServices')}
                           </Button>
                       }
                   />
                </div>
                <Footer />
            </div>
        );
    }

    const IconComp = getIcon(service.icon);
    const gradient = service.gradient || 'from-blue-500 to-blue-600';

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                {/* Hero Section */}
                <div className={`bg-gradient-to-br ${gradient} text-white`}>
                    <div className="container mx-auto px-4 pt-28 pb-16">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-8">
                            <Link href="/" className="hover:text-white">{t('serviceDetail.breadcrumbHome')}</Link>
                            <ChevronLeft className="h-4 w-4" />
                            <Link href="/services" className="hover:text-white">{t('serviceDetail.breadcrumbServices')}</Link>
                            <ChevronLeft className="h-4 w-4" />
                            <span className="text-white">{localizedField(service, 'name')}</span>
                        </div>

                        <div className="flex flex-col md:flex-row items-start gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    {service.is_new && <Badge className="bg-green-500 text-white">{t('services.newBadge')}</Badge>}
                                    {service.is_premium && <Badge className="bg-amber-500 text-white">{t('services.premiumBadge')}</Badge>}
                                    {service.is_popular && <Badge className="bg-white/20 text-white">{t('services.popularBadge')}</Badge>}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">{localizedField(service, 'name')}</h1>
                                <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
                                    {localizedField(service, 'long_description') || localizedField(service, 'description')}
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Button
                                        size="lg"
                                        className="bg-white text-gray-900 hover:bg-white/90 shadow-xl"
                                        onClick={() => router.push(service.route || `/services/${service.slug}`)}
                                    >
                                        <Play className="h-5 w-5 me-2" />
                                        {t('serviceDetail.startUsing')}
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="border-2 border-white/40 bg-transparent text-white hover:bg-white/10 backdrop-blur-sm"
                                    >
                                        <Heart className="h-5 w-5 me-2" />
                                        {t('serviceDetail.addFavorite')}
                                    </Button>
                                </div>
                            </div>
                            <div className="hidden md:flex">
                                <div className="h-40 w-40 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                    <IconComp className="h-20 w-20 text-white/80" />
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        {service.stats && service.stats.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                                {service.stats.map((stat, index) => {
                                    const StatIcon = getIcon(stat.icon);
                                    return (
                                        <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                            <StatIcon className="h-6 w-6 mx-auto mb-2 text-white/70" />
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                            <p className="text-sm text-white/70">{localizedField(stat, 'label')}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12">
                    <Tabs defaultValue="features" className="space-y-8">
                        <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border dark:border-gray-700">
                            <TabsTrigger value="features" className="rounded-lg">{t('serviceDetail.tabFeatures')}</TabsTrigger>
                            <TabsTrigger value="how-it-works" className="rounded-lg">{t('serviceDetail.tabHowItWorks')}</TabsTrigger>
                            {service.pricing && service.pricing.length > 0 && (
                                <TabsTrigger value="pricing" className="rounded-lg">{t('serviceDetail.tabPricing')}</TabsTrigger>
                            )}
                            {service.faqs && service.faqs.length > 0 && (
                                <TabsTrigger value="faq" className="rounded-lg">{t('serviceDetail.tabFaq')}</TabsTrigger>
                            )}
                        </TabsList>

                        {/* Features Tab */}
                        <TabsContent value="features" className="space-y-8">
                            {/* Features Grid */}
                            {service.features && service.features.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {service.features.map((feature, index) => {
                                        const FIcon = getIcon(feature.icon);
                                        return (
                                            <Card key={index} className="border-0 shadow-md bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow depth-shadow">
                                                <CardContent className="p-6">
                                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4`}>
                                                        <FIcon className="h-6 w-6" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                                        {localizedField(feature, 'title')}
                                                    </h3>
                                                    <p className="text-gray-500 dark:text-gray-400">
                                                        {localizedField(feature, 'description')}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Benefits */}
                            {((dir === 'rtl' ? service.benefits_ar : (service.benefits_en || service.benefits_ar)) || []).length > 0 && (
                                <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            {t('serviceDetail.whyChoose')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(dir === 'rtl' ? service.benefits_ar : (service.benefits_en || service.benefits_ar))?.map((benefit, index) => (
                                                <div key={index} className="flex items-start gap-3">
                                                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white flex-shrink-0 mt-0.5`}>
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300">{benefit}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* How It Works Tab */}
                        <TabsContent value="how-it-works">
                            {service.how_it_works && service.how_it_works.length > 0 ? (
                                <div className="max-w-3xl mx-auto">
                                    {service.how_it_works.map((step, index) => (
                                        <div key={index} className="flex gap-6 mb-8 last:mb-0">
                                            <div className="flex flex-col items-center">
                                                <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg`}>
                                                    {step.step}
                                                </div>
                                                {index < (service.how_it_works?.length || 0) - 1 && (
                                                    <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-2" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-8">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                    {localizedField(step, 'title')}
                                                </h3>
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    {localizedField(step, 'description')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p>{t('serviceDetail.comingSoon')}</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Pricing Tab */}
                        {service.pricing && service.pricing.length > 0 && (
                            <TabsContent value="pricing">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                    {service.pricing.map((plan, index) => (
                                        <Card
                                            key={index}
                                            className={`border-0 shadow-md ${plan.recommended ? `ring-2 ring-offset-2 bg-gradient-to-br ${gradient} text-white` : 'bg-white dark:bg-gray-800'}`}
                                        >
                                            <CardHeader className="text-center">
                                                {plan.recommended && (
                                                    <Badge className="bg-white/20 text-white mx-auto mb-2">{t('serviceDetail.mostPopular')}</Badge>
                                                )}
                                                <CardTitle className={plan.recommended ? 'text-white' : ''}>{localizedField(plan, 'type')}</CardTitle>
                                                <div className="mt-4">
                                                    <span className={`text-4xl font-bold ${plan.recommended ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                        {plan.price === '0' ? t('serviceDetail.free') : `${plan.price} ${t('common.sar')}`}
                                                    </span>
                                                    {plan.price !== '0' && (
                                                        <span className={`text-sm ${plan.recommended ? 'text-white/70' : 'text-gray-500'}`}>{t('serviceDetail.monthly')}</span>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-3">
                                                    {(dir === 'rtl' ? plan.features_ar : (plan.features_en || plan.features_ar)).map((feature, fi) => (
                                                        <li key={fi} className={`flex items-center gap-2 text-sm ${plan.recommended ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${plan.recommended ? 'text-white' : 'text-green-500'}`} />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <Button
                                                    className={`w-full mt-6 ${plan.recommended ? 'bg-white text-gray-900 hover:bg-white/90' : `bg-gradient-to-r ${gradient} text-white`}`}
                                                >
                                                    {plan.price === '0' ? t('serviceDetail.tryNow') : t('serviceDetail.subscribeNow')}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        )}

                        {/* FAQ Tab */}
                        {service.faqs && service.faqs.length > 0 && (
                            <TabsContent value="faq">
                                <div className="max-w-3xl mx-auto space-y-4">
                                    {service.faqs.map((faq, index) => (
                                        <Card key={index} className="border-0 shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
                                            <button
                                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                                className="w-full p-5 flex items-center justify-between text-start"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {localizedField(faq, 'question')}
                                                    </span>
                                                </div>
                                                <ChevronLeft className={`h-5 w-5 text-gray-400 transition-transform ${openFaq === index ? 'rotate-90' : ''}`} />
                                            </button>
                                            {openFaq === index && (
                                                <div className="px-5 pb-5 pe-13">
                                                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                                        {localizedField(faq, 'answer')}
                                                    </p>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>

                    {/* Related Services */}
                    {relatedServices.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <Layers className="h-6 w-6 text-primary" />
                                {t('serviceDetail.relatedServices')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {relatedServices.map((rs) => {
                                    const RSIcon = getIcon(rs.icon);
                                    const rsGradient = rs.gradient || 'from-gray-500 to-gray-600';
                                    return (
                                        <Card
                                            key={rs.id}
                                            className="group hover:shadow-lg transition-all cursor-pointer border-0 bg-white dark:bg-gray-800 card-3d-hover depth-shadow"
                                            onClick={() => router.push(`/services/${rs.slug}`)}
                                        >
                                            <CardContent className="p-5 flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${rsGradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                                                    <RSIcon className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-white">{localizedField(rs, 'name')}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{localizedField(rs, 'description')}</p>
                                                </div>
                                                <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-primary" />
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* CTA Section */}
                    <Card className={`mt-16 bg-gradient-to-br ${gradient} text-white border-0 shadow-2xl overflow-hidden`}>
                        <CardContent className="p-8 md:p-12 text-center">
                            <h2 className="text-3xl font-bold mb-4">{t('serviceDetail.readyToStart')}</h2>
                            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                                {t('serviceDetail.readyDesc')}
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <Button
                                    size="lg"
                                    className="bg-white text-gray-900 hover:bg-white/90 shadow-xl"
                                    onClick={() => router.push(service.route || `/services/${service.slug}`)}
                                >
                                    <Play className="h-5 w-5 me-2" />
                                    {t('serviceDetail.startFree')}
                                </Button>
                                <Button
                                    size="lg"
                                    className="border-2 border-white/40 bg-transparent text-white hover:bg-white/10 backdrop-blur-sm"
                                    onClick={() => router.push('/services')}
                                >
                                    <ArrowRight className="h-5 w-5 me-2" />
                                    {t('serviceDetail.browseOther')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}
