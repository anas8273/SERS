"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

// استيراد المكونات (تأكد من صحة المسارات في مشروعك)
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

export const LoginForm = () => {
  const router = useRouter();
  const { login } = useAuthStore();

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

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
        await login(values.email, values.password);
        setSuccess("تم تسجيل الدخول بنجاح!");
        toast.success("أهلاً بك مجدداً");
        router.push("/dashboard");
      } catch (err: any) {
        console.error('Login error:', err);
        
        // Handle validation errors (422)
        if (err?.response?.status === 422 && err?.response?.data?.errors) {
          const validationErrors = err.response.data.errors;
          const errorMessages = Object.values(validationErrors).flat().join(', ');
          setError(`خطأ في البيانات: ${errorMessages}`);
          toast.error(`خطأ في البيانات: ${errorMessages}`);
        } else {
          const errorMessage = err?.response?.data?.message || err?.message || "بيانات الدخول غير صحيحة";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background transition-colors duration-500" dir="rtl">

      {/* زر العودة للرئيسية - ثابت في أعلى الصفحة ومتجاوب */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 md:top-8 md:right-8 z-50"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/")}
          className="gap-2 bg-background/60 backdrop-blur-md border-border hover:border-primary transition-all shadow-sm group px-3 md:px-4 h-9 md:h-10 rounded-full"
        >
          <Home className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          <span className="font-bold text-foreground/80 group-hover:text-primary text-xs md:text-sm">الرئيسية</span>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[450px]"
      >
        <CardWrapper
          headerLabel="تسجيل الدخول"
          backButtonLabel="ليس لديك حساب؟ تسجيل جديد"
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
                      <FormLabel className="font-bold text-foreground/90 pr-1 text-right block text-sm md:text-base">البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="name@example.com"
                          type="email"
                          className="bg-muted/30 border-input focus:ring-1 focus:ring-primary focus:border-primary transition-all text-left h-11 md:h-12 rounded-lg"
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage className="text-right text-[10px] md:text-xs font-medium text-destructive" />
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
                        <FormLabel className="font-bold text-foreground/90 text-sm md:text-base">كلمة المرور</FormLabel>
                        <Button size="sm" variant="link" asChild className="px-0 h-auto font-medium text-[10px] md:text-xs text-muted-foreground hover:text-primary">
                          <Link href="/forgot-password">نسيت كلمة المرور؟</Link>
                        </Button>
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="••••••••"
                          type="password"
                          className="bg-muted/30 border-input focus:ring-1 focus:ring-primary focus:border-primary transition-all text-left h-11 md:h-12 rounded-lg"
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage className="text-right text-[10px] md:text-xs font-medium text-destructive" />
                    </FormItem>
                  )}
                />
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
                    <p className="font-medium text-right flex-1">{error}</p>
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
                    <p className="font-medium text-right flex-1">{success}</p>
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
                    <span>جاري التحقق...</span>
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>
          </Form>
        </CardWrapper>
      </motion.div>
    </div>
  );
};