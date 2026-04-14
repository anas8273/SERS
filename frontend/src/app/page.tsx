'use client';

import { logger } from '@/lib/logger';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useTranslation } from '@/i18n/useTranslation';
import type { Template } from '@/types';

// [PERF] Above-the-fold: loaded immediately
import { HeroSection } from '@/components/home/HeroSection';
import { ServicesSection } from '@/components/home/ServicesSection';

// [PERF] Below-the-fold: lazy-loaded on scroll
const ProductShowcase = dynamic(() => import('@/components/home/ProductShowcase').then(m => ({ default: m.ProductShowcase })), { ssr: false });
const FeaturesSection = dynamic(() => import('@/components/home/FeaturesSection').then(m => ({ default: m.FeaturesSection })), { ssr: false });
const TestimonialsSection = dynamic(() => import('@/components/home/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })), { ssr: false });
const FAQSection = dynamic(() => import('@/components/home/FAQSection').then(m => ({ default: m.FAQSection })), { ssr: false });
const CTASection = dynamic(() => import('@/components/home/CTASection').then(m => ({ default: m.CTASection })), { ssr: false });

export default function HomePage() {
  const { t, dir, localizedField } = useTranslation();
  const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);
  const [bestSellers, setBestSellers] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [publicStats, setPublicStats] = useState<{
    total_users: number; total_templates: number;
    total_documents: number; average_rating: number;
  }>({ total_users: 0, total_templates: 0, total_documents: 0, average_rating: 4.9 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, bestSellersRes, statsRes] = await Promise.all([
          api.getTemplates({ featured: 1 }).catch(() => ({ data: [] })),
          api.getTemplates({ sort: 'sales_count', limit: 4 }).catch(() => ({ data: [] })),
          api.getPublicStats().catch(() => ({ data: null })),
        ]);
        const templatesData = templatesRes.data?.data || templatesRes.data || [];
        setFeaturedTemplates(Array.isArray(templatesData) ? templatesData.slice(0, 8) : []);
        
        const bestData = bestSellersRes.data?.data || bestSellersRes.data || [];
        setBestSellers(Array.isArray(bestData) ? bestData.slice(0, 4) : []);
        
        if (statsRes?.data) setPublicStats(statsRes.data);
      } catch (error) {
        logger.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-500" dir={dir}>
      <Navbar />

      <main className="flex-1">
        <HeroSection publicStats={publicStats} />
        <ServicesSection />
        <ProductShowcase
          featuredTemplates={featuredTemplates}
          bestSellers={bestSellers}
          allTemplates={[...featuredTemplates, ...bestSellers]}
          isLoading={isLoading}
          t={t}
          localizedField={localizedField}
        />
        <FeaturesSection />
        <TestimonialsSection publicStats={publicStats} />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
