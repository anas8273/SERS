// src/lib/mock-template.ts

export interface TemplateData {
    personalInfo: {
        fullName: string;
        jobTitle: string;
        email: string;
        phone: string;
        location: string;
        bio: string;
        website?: string;
    };
    styles: {
        primaryColor: string;
        fontFamily: string;
    };
}

export const mockTemplateData: TemplateData = {
    personalInfo: {
        fullName: 'أحمد محمد',
        jobTitle: 'معلم لغة عربية',
        email: 'ahmed@example.com',
        phone: '0500000000',
        location: 'الرياض، السعودية',
        bio: 'معلم شغوف بتطوير المناهج التعليمية واستخدام التقنية في التعليم.',
        website: 'https://ahmed.me'
    },
    styles: {
        primaryColor: '#2563eb',
        fontFamily: 'Inter, sans-serif'
    }
};
