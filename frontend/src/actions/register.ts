"use server";

import * as z from "zod";
import { RegisterSchema } from "@/lib/schemas";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  // 1. التحقق من صحة البيانات في السيرفر
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "البيانات غير صحيحة!" };
  }

  const { email, password, name } = validatedFields.data;

  // 2. هنا سنضع كود الاتصال بـ Laravel API لاحقاً
  // حالياً سنطبع البيانات في التيرمينال للتأكد من وصولها
  console.log("بيانات التسجيل الواصلة:", { email, name, password });

  // 3. محاكاة نجاح العملية مؤقتاً
  return { success: "تم إرسال طلب إنشاء الحساب بنجاح!" };
};