import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().email({
    message: "البريد الإلكتروني مطلوب",
  }),
  password: z.string().min(1, {
    message: "كلمة المرور مطلوبة",
  }),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "البريد الإلكتروني مطلوب",
  }),
  password: z.string().min(8, {
    message: "يجب أن تكون 8 أحرف على الأقل",
  }),
  name: z.string().min(1, {
    message: "الاسم مطلوب",
  }),
});