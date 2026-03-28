import { useState, useEffect, useRef, type FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { sendOtpApi, loginApi, saveAuth, type AuthUser } from '@/services/api';
import styles from '@/styles/login.module.css';

/**
 * Employer Login Page (OTP Based)
 *
 * 1. User enters 10-digit mobile number -> Requests OTP.
 * 2. Backend generates OTP, sends SMS, saves to `otp` table.
 * 3. User enters OTP.
 * 4. Calls /auth/login with Mobile + OTP. Auto-registers if employer doesn't exist.
 */
export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuth();

  // ── Form State ─────────────────────────────
  const [mobileno, setMobileno] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  // ── OTP Box Refs ───────────────────────────
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const OTP_LENGTH = 4;

  const handleOtpBoxChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const otpArr = otp.split('');
    otpArr[index] = digit;
    // Pad with empty strings if needed
    while (otpArr.length < OTP_LENGTH) otpArr.push('');
    setOtp(otpArr.join(''));

    // Auto-focus next box
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty, go to previous
        otpRefs.current[index - 1]?.focus();
        const otpArr = otp.split('');
        otpArr[index - 1] = '';
        setOtp(otpArr.join(''));
      } else {
        const otpArr = otp.split('');
        otpArr[index] = '';
        setOtp(otpArr.join(''));
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted) {
      setOtp(pasted.padEnd(OTP_LENGTH, ''));
      // Focus last filled box or last box
      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      setTimeout(() => otpRefs.current[focusIdx]?.focus(), 0);
    }
  };

  // ── Redirect if already logged in ──────────
  useEffect(() => {
    if (!authLoading && user) {
      if (user.has_jobs) {
        router.replace('/all-post-jobs');
      } else {
        router.replace('/post-job');
      }
    }
  }, [authLoading, user, router]);

  // ── OTP Timer ──────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // ── Trigger shake animation ────────────────
  const triggerShake = () => {
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 500);
  };

  // ── Handle Send OTP ────────────────────────
  const handleSendOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    const trimmedMobile = mobileno.trim();
    if (trimmedMobile.length !== 10 || isNaN(Number(trimmedMobile))) {
      setError('Please enter a valid 10-digit mobile number');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const response = await sendOtpApi(trimmedMobile);
      if (response.status) {
        setSuccess('OTP sent successfully!');
        setOtpSent(true);
        setTimer(60);
      } else {
        setError(response.message || 'Failed to send OTP.');
        triggerShake();
      }
    } catch (err) {
      console.error('OTP error:', err);
      setError('Unable to connect to server. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Verify OTP & Login ──────────────
  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If OTP hasn't been sent yet, the form submission acts as "Send OTP"
    if (!otpSent) {
      return handleSendOtp(e);
    }

    setError('');
    setSuccess('');

    const trimmedMobile = mobileno.trim();
    const trimmedOtp = otp.trim();

    if (!trimmedOtp || trimmedOtp.length < 4) {
      setError('Please enter a valid OTP');
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      // loginApi now takes (mobileno, otp)
      const response = await loginApi(trimmedMobile, trimmedOtp);

      if (response.status && response.data) {
        const userData: AuthUser = {
          employer_id: response.data.employer_id,
          mobileno: response.data.mobileno,
          email: '',
          company_number: response.data.mobileno || '',
          company_name: response.data.company_name || '',
          contact_person: response.data.contact_person || '',
          company_logo: response.data.company_logo || '',
          city: response.data.city || '',
          has_jobs: response.data.has_jobs,
        };

        // Save auth token and user data in cookies (SameSite=Lax handles persistence)
        saveAuth(response.data.token, userData);
        setUser(userData);

        setSuccess('Verification successful! Redirecting...');

        // No need for a separate setTimeout here; 
        // the useEffect above will catch the 'user' state change and redirect.
      } else {
        setError(response.message || 'Invalid or expired OTP.');
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
      <Head>
        <title>Employer Login | NetworkBaba - Post Jobs & Hire Talent</title>
        <meta name="description" content="Login with OTP to your NetworkBaba employer account." />
      </Head>

      {/* ── Login Page Header ─────────────────── */}
      <header className={styles.loginHeader} id="login-header">
        <div className={styles.loginHeaderInner}>
          <a href="https://networkbaba.co" className={styles.loginHeaderBrand}>
            <img
              src="/nt/images/network_stat_logo.jpeg"
              alt="NetworkBaba"
              className={styles.loginHeaderLogo}
            />
          </a>
          <a
            href="https://networkbaba.co/candidate-login"
            className={styles.loginHeaderBtn}
          >
            Candidate Login
          </a>
        </div>
      </header>

      <main className={styles.pageWrapper}>
        <div className={`${styles.orb} ${styles.orb1}`} aria-hidden="true" />
        <div className={`${styles.orb} ${styles.orb2}`} aria-hidden="true" />
        <div className={`${styles.orb} ${styles.orb3}`} aria-hidden="true" />

        <div className={`${styles.loginCard} ${shakeForm ? styles.shake : ''}`}>
          <div className={styles.brandSection}>
            <img
              src="/nt/images/vertical_baba.png"
              alt="NetworkBaba Logo"
              className={styles.brandLogoImg}
            />
            <h1 className={styles.brandTitle}>Employer Login</h1>
            <p className={styles.brandSubtitle}>
              {otpSent ? 'Enter the OTP sent to your mobile' : 'Sign in using your mobile number'}
            </p>
          </div>

          {error && (
            <div className={styles.errorBox} role="alert">
              <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
              <span className={styles.errorText}>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.successBox} role="status">
              <span className={styles.successIcon} aria-hidden="true">✅</span>
              <span className={styles.successText}>{success}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} noValidate>
            {/* Mobile Number Field */}
            <div className={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="mobileno" className={styles.label}>Mobile Number</label>
                {otpSent && (
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Change Number
                  </button>
                )}
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon} aria-hidden="true">📱</span>
                <input
                  id="mobileno"
                  name="mobileno"
                  type="tel"
                  maxLength={10}
                  className={styles.input}
                  placeholder="Enter 10-digit mobile number"
                  value={mobileno}
                  onChange={(e) => setMobileno(e.target.value.replace(/\D/g, ''))}
                  disabled={loading || otpSent}
                  required
                />
              </div>
            </div>

            {/* OTP Field (Visible only after sending OTP) */}
            {otpSent && (
              <div className={styles.formGroup} style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="otp-0" className={styles.label}>One-Time Password</label>
                  {timer > 0 ? (
                    <span style={{ fontSize: '12px', color: '#666' }}>Resend in {timer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      style={{ background: 'none', border: 'none', color: '#2d6eb5', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
                <div className={styles.otpBoxesWrapper}>
                  {Array.from({ length: OTP_LENGTH }, (_, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={styles.otpBox}
                      value={otp[i] || ''}
                      onChange={(e) => handleOtpBoxChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      disabled={loading}
                      autoFocus={i === 0}
                      placeholder="·"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || (!otpSent && mobileno.length !== 10)}
              style={{ marginTop: '24px' }}
            >
              <span className={styles.btnContent}>
                {loading && <span className={styles.spinner} aria-hidden="true" />}
                {!loading && (otpSent ? 'Verify & Sign In' : 'Send OTP')}
              </span>
            </button>
          </form>

        </div>
      </main>
    </>
  );
}
