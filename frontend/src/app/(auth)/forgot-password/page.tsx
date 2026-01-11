'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { CardWrapper } from '@/components/auth/card-wrapper';
import { Button } from '@/components/ui/button';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

const ForgotPasswordSchema = z.object({
    email: z.string().email({
        message: 'البريد الإلكتروني غير صالح',
    }),
});

export default function ForgotPasswordPage() {
    const [isPending, startTransition] = useTransition();
    const [emailSent, setEmailSent] = useState(false);
    const [sentEmail, setSentEmail] = useState('');

    const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
        resolver: zodResolver(ForgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = (values: z.infer<typeof ForgotPasswordSchema>) => {
        startTransition(async () => {
            try {
                await sendPasswordResetEmail(auth, values.email);
                setEmailSent(true);
                setSentEmail(values.email);
                toast.success('تم إرسال رابط إعادة تعيين كلمة المرور! 📧');
            } catch (error: any) {
                console.error('Reset password error:', error);

                // Handle different Firebase error codes
                switch (error.code) {
                    case 'auth/user-not-found':
                        toast.error('هذا البريد الإلكتروني غير مسجل في النظام.');
                        break;
                    case 'auth/invalid-email':
                        toast.error('البريد الإلكتروني غير صالح.');
                        break;
                    case 'auth/too-many-requests':
                        toast.error('تم إرسال طلبات كثيرة، حاول لاحقاً.');
                        break;
                    default:
                        toast.error('حدث خطأ. تأكد من البريد الإلكتروني وحاول مرة أخرى.');
                }
            }
        });
    };

    // Success state - email sent
    if (emailSent) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <CardWrapper
                    headerLabel="تم إرسال الرابط! 📧"
                    backButtonLabel="العودة لتسجيل الدخول"
                    backButtonHref="/login"
                >
                    <div className="space-y-6 text-center">
                        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-4xl">✉️</span>
                        </div>

                        <div className="space-y-2">
                            <p className="text-gray-700">
                                أرسلنا رابط إعادة تعيين كلمة المرور إلى:
                            </p>
                            <p className="font-semibold text-primary-600 break-all">
                                {sentEmail}
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-right">
                            <h4 className="font-semibold text-amber-800 mb-2">💡 نصائح:</h4>
                            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                                <li>تحقق من مجلد الرسائل غير المرغوب فيها (Spam)</li>
                                <li>الرابط صالح لمدة ساعة واحدة فقط</li>
                                <li>إذا لم تصل الرسالة، انتظر دقيقة وحاول مرة أخرى</li>
                            </ul>
                        </div>

                        <Button
                            onClick={() => setEmailSent(false)}
                            variant="outline"
                            className="w-full"
                        >
                            إرسال مرة أخرى
                        </Button>
                    </div>
                </CardWrapper>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <CardWrapper
                headerLabel="نسيت كلمة المرور؟"
                backButtonLabel="العودة لتسجيل الدخول"
                backButtonHref="/login"
            >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="text-center text-sm text-gray-600 mb-4">
                            أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                        </div>

                        <div className="space-y-4">
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
                        </div>
                        <Button disabled={isPending} type="submit" className="w-full flex items-center justify-center gap-2">
                            {isPending && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />}
                            {isPending ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                        </Button>
                    </form>
                </Form>
            </CardWrapper>
        </div>
    );
}

