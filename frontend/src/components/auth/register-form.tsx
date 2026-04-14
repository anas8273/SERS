"use client";

import { ta } from '@/i18n/auto-translations';
import * as z from "zod";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle2, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

import { RegisterSchema } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/i18n/useTranslation";
import { PasswordStrength } from "@/components/ui/PasswordStrength";

export const RegisterForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuthStore();
  const { t, dir, locale } = useTranslation();

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Pick up referral code from ?ref= param OR localStorage (set by /ref/[code] page)
  const pendingRefCode =
    searchParams?.get('ref') ||
    (typeof window !== 'undefined' ? localStorage.getItem('pending_referral_code') : null);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      if (!termsAccepted) {
        setError(t('toast.auth.termsRequired'));
        toast.error(t('toast.auth.termsRequired'));
        return;
      }
      try {
        await register(values.name, values.email, values.password);

        // Apply pending referral code silently after registration
        if (pendingRefCode) {
          try {
            await import('@/lib/api').then(({ api }) => api.applyReferralCode(pendingRefCode));
            if (typeof window !== 'undefined') {
              localStorage.removeItem('pending_referral_code');
            }
            toast.success(t('toast.referral.applied'));
          } catch {
            // Non-critical — don't block registration flow
          }
        }

        setSuccess(t('auth.register.success'));
        toast.success(t('auth.register.welcome'));
        window.location.href = '/dashboard';
      } catch (err: any) {
        // AxiosError comes with err.response (raw from interceptor)
        const status = err?.response?.status;
        const backendMessage = err?.response?.data?.message;
        const validationErrors = err?.response?.data?.errors;

        if (status === 422 && validationErrors) {
          // Validation errors (e.g. email already taken, password too short)
          const errorMessages = Object.values(validationErrors).flat().join(', ');
          setError(errorMessages);
          toast.error(errorMessages);
        } else if (status === 429) {
          setError(t('toast.rateLimited'));
          toast.error(t('toast.rateLimited'));
        } else if (backendMessage) {
          // Backend returned a specific message (e.g. database error)
          setError(backendMessage);
          toast.error(backendMessage);
        } else {
          // Network error or unexpected error
          const fallback = err?.message || t('auth.register.error');
          setError(fallback);
          toast.error(fallback);
        }
      }
    });
  };

  return (
    <CardWrapper
      headerLabel={t('auth.register.header')}
      backButtonLabel={t('auth.register.backButton')}
      backButtonHref="/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">

            {/* حقل الاسم الكامل */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-bold text-foreground/90 pe-1 text-start block text-sm md:text-base">{t('auth.register.name')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder={t('auth.register.namePlaceholder')}
                        className="bg-muted/30 border-input focus:ring-1 focus:ring-primary focus:border-primary transition-all text-start h-11 md:h-12 rounded-xl pe-10"
                      />
                      <User className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-start text-[10px] md:text-xs font-medium text-destructive" />
                </FormItem>
              )}
            />

            {/* حقل البريد الإلكتروني - (LTR) */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-bold text-foreground/90 pe-1 text-start block text-sm md:text-base">{t('auth.register.email')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="example@mail.com"
                        type="email"
                        className="bg-muted/30 border-input focus:ring-1 focus:ring-primary focus:border-primary transition-all text-start h-11 md:h-12 rounded-xl ps-10"
                        dir="ltr"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-start text-[10px] md:text-xs font-medium text-destructive" />
                </FormItem>
              )}
            />

            {/* حقل كلمة المرور - (LTR) */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-bold text-foreground/90 pe-1 text-start block text-sm md:text-base">{t('auth.register.password')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        className="bg-muted/30 border-input focus:ring-1 focus:ring-primary focus:border-primary transition-all text-start h-11 md:h-12 rounded-xl ps-20"
                        dir="ltr"
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        aria-label={showPassword ? (locale === 'ar' ? 'إخفاء كلمة المرور' : 'Hide password') : (locale === 'ar' ? 'إظهار كلمة المرور' : 'Show password')}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-start text-[10px] md:text-xs font-medium text-destructive" />
                  <PasswordStrength password={field.value} />
                </FormItem>
              )}
            />
          </div>

          {/* الشروط والأحكام */}
          <div className="flex items-start gap-2.5 px-1">
            <label className="flex items-start gap-2.5 cursor-pointer group select-none">
              <button
                type="button"
                role="checkbox"
                aria-checked={termsAccepted}
                onClick={() => setTermsAccepted(!termsAccepted)}
                className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                  termsAccepted
                    ? 'bg-primary border-primary scale-105'
                    : 'border-muted-foreground/30 hover:border-primary/50 bg-transparent'
                }`}
              >
                {termsAccepted && (
                  <motion.svg
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-3 h-3 text-white"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                )}
              </button>
              <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                {locale === 'ar' ? (
                  <>
                    {ta('أوافق على', 'I agree to')}
                    <a href="/terms" target="_blank" className="text-primary hover:underline font-bold">{ta('الشروط والأحكام', 'Terms & Conditions')}</a>
                    {' و'}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline font-bold">{ta('سياسة الخصوصية', 'Privacy Policy')}</a>
                  </>
                ) : (
                  <>
                    {'I agree to the '}
                    <a href="/terms" target="_blank" className="text-primary hover:underline font-bold">Terms & Conditions</a>
                    {' and '}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline font-bold">Privacy Policy</a>
                  </>
                )}
              </span>
            </label>
          </div>

          {/* رسائل التنبيه */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-destructive/15 p-3 rounded-lg flex items-center gap-x-3 text-sm text-destructive border border-destructive/20 dark:bg-destructive/20"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="font-medium text-start flex-1">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-emerald-500/15 p-3 rounded-lg flex items-center gap-x-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:bg-emerald-500/20"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p className="font-medium text-start flex-1">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* زر الإرسال الرئيسي */}
          <Button
            disabled={isPending}
            type="submit"
            className="w-full h-12 md:h-14 text-base md:text-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.97] rounded-lg gap-2 bg-primary text-primary-foreground"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('auth.register.submitting')}</span>
              </>
            ) : (
              t('auth.register.submit')
            )}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};