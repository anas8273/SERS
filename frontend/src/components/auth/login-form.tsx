"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

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
        toast.success("تم تسجيل الدخول بنجاح!");
        // Redirect will happen, usually logic is in the page or strict redirect here
        // For better UX we redirect here
        router.push("/dashboard");
      } catch (err: any) {
        console.error("Login failed", err);
        // Extract error message from API response
        const errorMessage =
          err?.message ||
          err?.errors?.email?.[0] ||
          (typeof err === "string" ? err : "بيانات الدخول غير صحيحة");
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
      headerLabel="تسجيل الدخول"
      backButtonLabel="ليس لديك حساب؟ تسجيل جديد"
      backButtonHref="/register"
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
                    <Button size="sm" variant="link" asChild className="px-0 font-normal">
                      <Link href="/forgot-password">نسيت كلمة المرور؟</Link>
                    </Button>
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
            {isPending ? "جاري الدخول..." : "دخول"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};