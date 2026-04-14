import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'رابط إحالة | SERS',
    description: 'سجّل عبر رابط الإحالة واحصل على مكافأة ترحيبية خاصة',
    robots: {
        index: false,
        follow: false,
    },
};


export default function ReferralCodeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
