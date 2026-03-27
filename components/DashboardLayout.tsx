import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import styles from '@/styles/dashboard.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DashboardLayout
 * Wraps all authenticated pages with the header.
 * Redirects to /login if user is not authenticated.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // ── Loading State ─────────────────────────────
  if (loading) {
    return <div className={styles.loadingWrapper} />;
  }

  // Not authenticated — will redirect (show nothing to avoid flash)
  if (!user) {
    return null;
  }

  // ── Authenticated — render layout ─────────────
  return (
    <div className={styles.layoutWrapper}>
      <Header />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
