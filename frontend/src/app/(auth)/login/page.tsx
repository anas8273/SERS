// Server component — allows Suspense to work for useSearchParams
import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginPageClient />
    </Suspense>
  );
}
