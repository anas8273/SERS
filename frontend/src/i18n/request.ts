import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, isValidLocale } from './config';

export default getRequestConfig(async () => {
  // Get locale from cookie or use default
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;
  const locale = localeCookie && isValidLocale(localeCookie) ? localeCookie : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
