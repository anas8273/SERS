"use server";

import * as z from "zod";
import { LoginSchema } from "@/lib/schemas";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "البيانات غير صحيحة!" };
  }

  const { email, password } = validatedFields.data;

  try {
    // محاولة تسجيل الدخول باستخدام NextAuth
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard", // التوجيه للوحة التحكم بعد النجاح
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة!" };
        default:
          return { error: "حدث خطأ ما!" };
      }
    }
    throw error;
  }
};