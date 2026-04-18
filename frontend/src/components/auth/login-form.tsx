"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Loader2, AlertCircle, CheckCircle2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

import { LoginSchema } from "@/lib/schemas";
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

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const { t, dir } = useTranslation();

  // Read returnUrl from query string (set by SessionTimeoutWarning after expiry)
  const returnUrl = searchParams.get('returnUrl');

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        await login(values.email, values.password, rememberMe);
        setSuccess(t('auth.login.success'));
        toast.success(t('auth.login.welcome'));

        // Hard navigation to prevent white-page from stale hydration
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.role === 'admin') {
          window.location.href = '/admin';
        } else if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
          window.location.href = returnUrl;
        } else {
          window.location.href = '/dashboard';
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const backendMessage = err?.response?.data?.message;
        const validationErrors = err?.response?.data?.errors;

        if (status === 422 && validationErrors) {
          const errorMessages = Object.values(validationErrors).flat().join(', ');
          setError(errorMessages);
          toast.error(errorMessages);
        } else if (status === 429) {
          setError(t('toast.rateLimited'));
          toast.error(t('toast.rateLimited'));
        } else if (backendMessage) {
          setError(backendMessage);
          toast.error(backendMessage);
        } else {
          const fallback = err?.message || t('auth.login.invalidCredentials');
          setError(fallback);
          toast.error(fallback);
        }
      }
    });
  };

  return (
    <CardWrapper
      headerLabel={t('auth.login.header')}
      backButtonLabel={t('auth.login.backButton')}
      backButtonHref="/register"
      showSocial
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">

            {/* حقل البريد الإلكتروني - محاذاة ذكية */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-bold text-foreground/90 pe-1 text-start block text-sm md:text-base">{t('auth.login.email')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="name@example.com"
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

            {/* حقل كلمة المرور - محاذاة ذكية */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <FormLabel className="font-bold text-foreground/90 text-sm md:text-base">{t('auth.login.password')}</FormLabel>
                    <Button size="sm" variant="link" asChild className="px-0 h-auto font-medium text-[10px] md:text-xs text-muted-foreground hover:text-primary">
                      <Link href="/forgot-password">{t('auth.login.forgot')}</Link>
                    </Button>
                  </div>
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
                        aria-label={showPassword ? (dir === 'rtl' ? 'إخفاء كلمة المرور' : 'Hide password') : (dir === 'rtl' ? 'إظهار كلمة المرور' : 'Show password')}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-start text-[10px] md:text-xs font-medium text-destructive" />
                </FormItem>
              )}
            />
          </div>

          {/* تذكرني */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2.5 cursor-pointer group select-none">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                  rememberMe
                    ? 'bg-primary border-primary scale-105'
                    : 'border-muted-foreground/30 hover:border-primary/50 bg-transparent'
                }`}
              >
                {rememberMe && (
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
              <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {t('auth.login.rememberMe')}
              </span>
            </label>
          </div>

          {/* رسائل التنبيه متكيفة الألوان */}
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

          {/* زر تسجيل الدخول الرئيسي */}
          <Button
            disabled={isPending}
            type="submit"
            className="w-full h-12 md:h-14 text-base md:text-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.97] rounded-lg gap-2 bg-primary text-primary-foreground"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('auth.login.submitting')}</span>
              </>
            ) : (
              t('auth.login.submit')
            )}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};