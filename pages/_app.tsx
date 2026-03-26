import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import '@/styles/globals.css';

/**
 * Public pages that should NOT show the dashboard header/layout.
 * All other pages are wrapped in DashboardLayout (auth-gated).
 */
const PUBLIC_PAGES = ['/login'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublicPage = PUBLIC_PAGES.includes(router.pathname);

  return (
    <AuthProvider>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#0a0a1a" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      {isPublicPage ? (
        <Component {...pageProps} />
      ) : (
        <DashboardLayout>
          <Component {...pageProps} />
        </DashboardLayout>
      )}
    </AuthProvider>
  );
}
