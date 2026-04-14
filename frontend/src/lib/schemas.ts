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
    message: "عنوان البريد الإلكتروني غير صالح",
  }),
  password: z.string()
    .min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" })
    .regex(/[A-Z]/, { message: "يجب أن تحتوي على حرف كبير واحد على الأقل" })
    .regex(/[a-z]/, { message: "يجب أن تحتوي على حرف صغير واحد على الأقل" })
    .regex(/[0-9]/, { message: "يجب أن تحتوي على رقم واحد على الأقل" })
    .regex(/[^A-Za-z0-9]/, { message: "يجب أن تحتوي على رمز خاص واحد على الأقل" }),
  name: z.string().min(2, {
    message: "الاسم يجب أن يكون حرفين على الأقل",
  }),
});