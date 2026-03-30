import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/dashboard.module.css';

/**
 * Dashboard Home Page
 * Shows welcome message and quick action cards.
 */
export default function DashboardHome() {
  const { user } = useAuth();

  const firstName = user?.contact_person?.split(' ')[0] || 'there';

  return (
    <>
      <Head>
        <title>Dashboard | NetworkBaba Employer</title>
        <meta
          name="description"
          content="Manage your job postings, view applications, and hire talent with NetworkBaba employer dashboard."
        />
      </Head>

      <div className={styles.dashboardPage}>
        {/* Welcome */}
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>Welcome back, {firstName} 👋</h1>
          <p className={styles.welcomeSub}>
            {user?.company_name ? `${user.company_name} — ` : ''}Manage your job postings from here
          </p>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <Link href="/post-job" className={styles.actionCard}>
            <div className={`${styles.actionIcon} ${styles.actionIconBlue}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div className={styles.actionCardContent}>
              <div className={styles.actionTitle}>Post a New Job</div>
              <div className={styles.actionDesc}>Create and publish job listings to find the right candidates</div>
            </div>
          </Link>



          <Link href="/employer-profile" className={styles.actionCard}>
            <div className={`${styles.actionIcon} ${styles.actionIconPurple}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className={styles.actionCardContent}>
              <div className={styles.actionTitle}>Company Profile</div>
              <div className={styles.actionDesc}>Update your company details and contact information</div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
