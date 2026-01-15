
'use client';

import { LoginForm } from "@/components/auth/login-form";
import { motion } from "framer-motion";
import { Sparkles, GraduationCap, Layout, Palette } from "lucide-react";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 relative overflow-hidden" dir="rtl">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      <div className="container relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 px-4 py-12">
        {/* Left Side - Branding/Info (Hidden on mobile) */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-col max-w-md space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              مستقبل التعليم الذكي
            </div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-white leading-tight">
              مرحباً بك في <span className="text-primary">SERS</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
              المنصة المتكاملة للمعلمين لتصميم السجلات التعليمية المبتكرة بلمسات إبداعية مدعومة بالذكاء الاصطناعي.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {[
              { icon: <Layout className="w-5 h-5" />, title: "قوالب جاهزة", desc: "مئات القوالب التعليمية المصممة باحترافية." },
              { icon: <Palette className="w-5 h-5" />, title: "تخصيص كامل", desc: "تحكم كامل في الألوان والخطوط والمحتوى." },
              { icon: <GraduationCap className="w-5 h-5" />, title: "أدوات تعليمية", desc: "أدوات ذكية تساعدك في تنظيم مهامك اليومية." }
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

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[450px]"
        >
          <div className="lg:hidden text-center mb-8 space-y-2">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">SERS</h1>
            <p className="text-gray-500 dark:text-gray-400">سجل دخولك للمتابعة</p>
          </div>
          <LoginForm />
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;
