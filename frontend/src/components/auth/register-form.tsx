"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

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
        toast.success("تم إنشاء الحساب بنجاح!");
        // Redirect to dashboard or login
        router.push("/dashboard");
      } catch (err: any) {
        console.error("Registration failed", err);
        // Extract error message from API response
        const errorMessage =
          err?.message ||
          err?.errors?.email?.[0] ||
          err?.errors?.password?.[0] ||
          err?.errors?.name?.[0] ||
          (typeof err === "string" ? err : "حدث خطأ غير متوقع!");
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <CardWrapper
      headerLabel="إنشاء حساب جديد"
      backButtonLabel="لديك حساب بالفعل؟ تسجيل الدخول"
      backButtonHref="/login"
      showSocial
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <motion.div variants={item}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="الاسم الكامل"
                        className="bg-background/50 border-primary/20 focus:border-primary transition-all text-right"
                      />
                    </FormControl>
                    <FormMessage className="text-right" />
                  </FormItem>
                )}
              />
            </motion.div>
            <motion.div variants={item}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="name@example.com"
                        type="email"
                        className="bg-background/50 border-primary/20 focus:border-primary transition-all text-right"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage className="text-right" />
                  </FormItem>
                )}
              />
            </motion.div>
            <motion.div variants={item}>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="******"
                        type="password"
                        className="bg-background/50 border-primary/20 focus:border-primary transition-all text-right"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage className="text-right" />
                  </FormItem>
                )}
              />
            </motion.div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive"
            >
              ⚠️ {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-emerald-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-emerald-500"
            >
              ✅ {success}
            </motion.div>
          )}

          <Button disabled={isPending} type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2">
            {isPending && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />}
            {isPending ? "جاري الإنشاء..." : "تسجيل"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};