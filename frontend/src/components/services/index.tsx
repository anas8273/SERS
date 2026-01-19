'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  FileText,
  Award,
  BarChart3,
  ClipboardList,
  Brain,
  Sparkles,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Service Card Component
interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  features?: string[];
  color?: string;
}

export function ServiceCard({
  title,
  description,
  icon,
  href,
  features = [],
  color = 'primary',
}: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="group block p-6 bg-card rounded-xl border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
    >
      <div
        className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110',
          `bg-${color}/10 text-${color}`
        )}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      {features.length > 0 && (
        <ul className="space-y-1">
          {features.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-3 h-3 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

// Services Section for Homepage
export function ServicesSection() {
  const services = [
    {
      title: 'تحليل النتائج',
      description: 'تحليل ذكي لنتائج الاختبارات مع تقارير مفصلة وتوصيات',
      icon: <BarChart3 className="w-6 h-6" />,
      href: '/analyses',
      features: ['تحليل تلقائي', 'رسوم بيانية', 'توصيات ذكية'],
    },
    {
      title: 'الشهادات والتقدير',
      description: 'إنشاء شهادات شكر وتقدير احترافية للطلاب والمعلمين',
      icon: <Award className="w-6 h-6" />,
      href: '/certificates',
      features: ['قوالب متنوعة', 'تخصيص كامل', 'طباعة عالية الجودة'],
    },
    {
      title: 'الخطط التعليمية',
      description: 'إنشاء خطط علاجية وإثرائية مخصصة لكل طالب',
      icon: <ClipboardList className="w-6 h-6" />,
      href: '/plans',
      features: ['خطط علاجية', 'خطط إثرائية', 'متابعة التقدم'],
    },
    {
      title: 'ملف الإنجاز',
      description: 'توثيق الإنجازات والشواهد بشكل منظم واحترافي',
      icon: <FileText className="w-6 h-6" />,
      href: '/achievements',
      features: ['توثيق شامل', 'تنظيم تلقائي', 'تصدير PDF'],
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">خدماتنا التعليمية</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            مجموعة شاملة من الأدوات والخدمات المصممة خصيصاً لتلبية احتياجات المعلمين والمدارس
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/services">
            <Button variant="outline" size="lg">
              عرض جميع الخدمات
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// AI Section for Homepage
export function AISection() {
  const aiFeatures = [
    {
      title: 'اقتراحات ذكية',
      description: 'احصل على اقتراحات ذكية أثناء تعبئة القوالب التفاعلية',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      title: 'إنشاء محتوى تلقائي',
      description: 'إنشاء خطط وتقارير تلقائياً بناءً على بيانات الطلاب',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      title: 'تحليل ذكي',
      description: 'تحليل النتائج وتقديم توصيات مخصصة لكل طالب',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      title: 'مساعد تفاعلي',
      description: 'مساعد ذكي يجيب على استفساراتك ويساعدك في مهامك',
      icon: <Brain className="w-5 h-5" />,
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              مدعوم بالذكاء الاصطناعي
            </div>
            <h2 className="text-3xl font-bold mb-4">
              ذكاء اصطناعي يفهم احتياجاتك
            </h2>
            <p className="text-muted-foreground mb-8">
              استفد من قوة الذكاء الاصطناعي لتسهيل عملك اليومي. نظامنا يتعلم من احتياجاتك
              ويقدم لك اقتراحات ذكية توفر وقتك وجهدك.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {aiFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-card rounded-lg border"
                >
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link href="/ai-assistant">
                <Button size="lg">
                  جرب المساعد الذكي
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center">
              <div className="text-center">
                <Brain className="w-24 h-24 text-primary mx-auto mb-4" />
                <p className="text-2xl font-bold text-primary">SERS AI</p>
                <p className="text-muted-foreground">مساعدك الذكي</p>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 p-4 bg-card rounded-xl shadow-lg border animate-bounce">
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="absolute -bottom-4 -left-4 p-4 bg-card rounded-xl shadow-lg border">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { ServiceCard as ServiceCardSkeleton };
