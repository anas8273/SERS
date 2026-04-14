'use client';
import { ta } from '@/i18n/auto-translations';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslation } from '@/i18n/useTranslation';

export default function TemplateDetailRedirect() {
  const { dir } = useTranslation();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    window.location.href = `/marketplace/${id}`;
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-gray-400 font-medium">{ta('جاري التوجيه...', 'Redirecting...')}</p>
      </div>
    </div>
  );
}
