"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Loader2, AlertCircle, CheckCircle2, User, Mail, Lock } from "lucide-react";
import { toast } from "react-hot-toast";

// استيراد المكونات المحلية
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

export const RegisterForm = () => {
  const router = useRouter();
  const { register } = useAuthStore();

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

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
      try {
        await register(values.name, values.email, values.password);
        setSuccess("تم إنشاء الحساب بنجاح!");
        toast.success("أهلاً بك في منصتنا!");
        router.push("/dashboard");
      } catch (err: any) {
        console.error('Register error:', err);
        
        // Handle validation errors (422)
        if (err?.response?.status === 422 && err?.response?.data?.errors) {
          const validationErrors = err.response.data.errors;
          const errorMessages = Object.values(validationErrors).flat().join(', ');
          setError(`خطأ في البيانات: ${errorMessages}`);
          toast.error(`خطأ في البيانات: ${errorMessages}`);
        } else {
          const errorMessage = err?.response?.data?.message || err?.message || "حدث خطأ أثناء إنشاء الحساب";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background transition-colors duration-500" dir="rtl">

      {/* زر العودة للرئيسية - ثابت واحترافي */}
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
        {/* تم حذف showSocial من هنا لإخفاء أزرار جوجل */}
        <CardWrapper
          headerLabel="إنشاء حساب جديد"
          backButtonLabel="لديك حساب بالفعل؟ تسجيل الدخول"
          backButtonHref="/login"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">

                {/* حقل الاسم الكامل */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5 text-right">
                      <FormLabel className="font-bold text-foreground/90 pr-1 block">الاسم الكامل</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="أدخل اسمك الكامل"
                            className="bg-muted/30 border-input focus:ring-1 focus:ring-primary text-right h-12 rounded-xl pr-10"
                          />
                          <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-medium" />
                    </FormItem>
                  )}
                />

                {/* حقل البريد الإلكتروني - (LTR) */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5 text-right">
                      <FormLabel className="font-bold text-foreground/90 pr-1 block">البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="example@mail.com"
                            type="email"
                            className="bg-muted/30 border-input focus:ring-1 focus:ring-primary text-left h-12 rounded-xl pl-10"
                            dir="ltr"
                          />
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-medium" />
                    </FormItem>
                  )}
                />

                {/* حقل كلمة المرور - (LTR) */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5 text-right">
                      <FormLabel className="font-bold text-foreground/90 pr-1 block">كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="••••••••"
                            type="password"
                            className="bg-muted/30 border-input focus:ring-1 focus:ring-primary text-left h-12 rounded-xl pl-10"
                            dir="ltr"
                          />
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-medium" />
                    </FormItem>
                  )}
                />
              </div>

              {/* رسائل التنبيه */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-destructive/15 p-3 rounded-lg flex items-center gap-x-3 text-sm text-destructive border border-destructive/20"
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
                    className="bg-emerald-500/15 p-3 rounded-lg flex items-center gap-x-3 text-sm text-emerald-600 border border-emerald-500/20"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <p className="font-medium text-right flex-1">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* زر الإرسال الرئيسي */}
              <Button
                disabled={isPending}
                type="submit"
                className="w-full h-12 md:h-14 text-base md:text-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.97] rounded-xl gap-2 bg-primary text-primary-foreground"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>جاري الإنشاء...</span>
                  </>
                ) : (
                  "إنشاء الحساب"
                )}
              </Button>
            </form>
          </Form>
        </CardWrapper>
      </motion.div>
    </div>
  );
};