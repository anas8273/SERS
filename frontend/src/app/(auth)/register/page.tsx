'use client';

import { RegisterForm } from "@/components/auth/register-form";
import { motion } from "framer-motion";
import { Sparkles, GraduationCap, Layout, Palette, Home } from "lucide-react";
import { useTranslation } from '@/i18n/useTranslation';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
  const { t, dir } = useTranslation();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 relative overflow-hidden" dir={dir}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      {/* Home Button - Fixed */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 md:top-8 md:right-8 z-50"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/")}
          className="gap-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-gray-200 dark:border-gray-700 hover:border-primary transition-all shadow-sm group px-3 md:px-4 h-9 md:h-10 rounded-full"
        >
          <Home className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary text-xs md:text-sm">{t('auth.home')}</span>
        </Button>
      </motion.div>

      <div className="container relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 px-4 py-12">
        {/* Left Side - Branding/Info (Hidden on mobile) */}
        <motion.div 
          initial={{ opacity: 0, x: dir === 'rtl' ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-col max-w-md space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              {t('auth.login.badge')}
            </div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-white leading-tight">
              {t('auth.register.header')} <span className="text-primary">SERS</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('auth.login.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {[
              { icon: <Layout className="w-5 h-5" />, title: t('auth.login.feature1.title'), desc: t('auth.login.feature1.desc') },
              { icon: <Palette className="w-5 h-5" />, title: t('auth.login.feature2.title'), desc: t('auth.login.feature2.desc') },
              { icon: <GraduationCap className="w-5 h-5" />, title: t('auth.login.feature3.title'), desc: t('auth.login.feature3.desc') }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="flex items-start gap-4 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Register Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[450px]"
        >
          <div className="lg:hidden text-center mb-8 space-y-2">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">SERS</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('auth.login.mobileSubtitle')}</p>
          </div>
          <RegisterForm />
        </motion.div>
      </div>
    </div>
  );
}

export default RegisterPage;