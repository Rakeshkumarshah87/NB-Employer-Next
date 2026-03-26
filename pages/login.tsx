import { useState, useEffect, type FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { loginApi, saveAuth, type AuthUser } from '@/services/api';
import styles from '@/styles/login.module.css';

/**
 * Employer Login Page
 *
 * Replicates legacy employer-login.php logic:
 *   - Mobile number + password form
 *   - Calls /auth/login API
 *   - On success: saves token in cookie, updates auth context, redirects to /
 *   - On failure: shows error message
 */
export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuth();

  // ── Form State ─────────────────────────────
  const [mobileno, setMobileno] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  // ── Redirect if already logged in ──────────
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  // ── Trigger shake animation ────────────────
  const triggerShake = () => {
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 500);
  };

  // ── Handle Form Submit ─────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    const trimmedMobile = mobileno.trim();
    const trimmedPassword = password.trim();

    if (!trimmedMobile || !trimmedPassword) {
      setError('Mobile number and password are required');
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const response = await loginApi(trimmedMobile, trimmedPassword);

      if (response.status && response.data) {
        // Build user data object
        const userData: AuthUser = {
          employer_id: response.data.employer_id,
          mobileno: response.data.mobileno,
          company_name: response.data.company_name,
          contact_person: response.data.contact_person,
          company_logo: response.data.company_logo || '',
          city: response.data.city || '',
        };

        // Save auth token and user data in cookies
        saveAuth(response.data.token, userData);

        // Update auth context
        setUser(userData);

        setSuccess('Login successful! Redirecting...');

        // Redirect to dashboard
        setTimeout(() => {
          router.push('/');
        }, 800);
      } else {
        setError(response.message || 'Login failed. Please try again.');
        triggerShake();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Don't show login form if already authenticated (will redirect)
  if (!authLoading && user) {
    return null;
  }

  return (
    <>
      {/* ── SEO Meta Tags ──────────────────── */}
      <Head>
        <title>Employer Login | NetworkBaba - Post Jobs & Hire Talent</title>
        <meta
          name="description"
          content="Login to your NetworkBaba employer account. Post jobs, manage applications, and hire the best talent for your company."
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Employer Login | NetworkBaba" />
        <meta
          property="og:description"
          content="Login to your NetworkBaba employer account. Post jobs and hire talent."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Employer Login | NetworkBaba" />
      </Head>

      {/* ── Page Layout ────────────────────── */}
      <main className={styles.pageWrapper}>
        {/* Animated Background Orbs */}
        <div className={`${styles.orb} ${styles.orb1}`} aria-hidden="true" />
        <div className={`${styles.orb} ${styles.orb2}`} aria-hidden="true" />
        <div className={`${styles.orb} ${styles.orb3}`} aria-hidden="true" />

        {/* Login Card */}
        <div className={`${styles.loginCard} ${shakeForm ? styles.shake : ''}`}>
          {/* Branding */}
          <div className={styles.brandSection}>
            <div className={styles.brandLogo}>
              <span className={styles.brandIcon} role="img" aria-label="NetworkBaba">
                🏢
              </span>
            </div>
            <h1 className={styles.brandTitle}>Employer Login</h1>
            <p className={styles.brandSubtitle}>
              Sign in to manage your job postings
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorBox} role="alert" id="login-error">
              <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
              <span className={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className={styles.successBox} role="status" id="login-success">
              <span className={styles.successIcon} aria-hidden="true">✅</span>
              <span className={styles.successText}>{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Mobile Number */}
            <div className={styles.formGroup}>
              <label htmlFor="mobileno" className={styles.label}>
                Mobile Number
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon} aria-hidden="true">📱</span>
                <input
                  id="mobileno"
                  name="mobileno"
                  type="tel"
                  className={styles.input}
                  placeholder="Enter your mobile number"
                  value={mobileno}
                  onChange={(e) => setMobileno(e.target.value)}
                  autoComplete="tel"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon} aria-hidden="true">🔒</span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              <span className={styles.btnContent}>
                {loading && <span className={styles.spinner} aria-hidden="true" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <div className={styles.dividerLine} />
          </div>

          {/* Footer Links */}
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>
              Forgot Password?
            </a>
            <span className={styles.footerDot}>•</span>
            <a href="/register" className={styles.footerLink}>
              Create Account
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
