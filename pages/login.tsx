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

  // ── OTP Box Ref ───────────────────────────
  const mainOtpRef = useRef<HTMLInputElement>(null);
  const OTP_LENGTH = 4;

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // ── Smart Extraction (Handles whole SMS text if pasted by browser) ──
    const digitsFound = rawValue.match(/\d{4}/);
    if (digitsFound) {
      setOtp(digitsFound[0]);
    } else {
      setOtp(rawValue.replace(/\D/g, '').slice(0, OTP_LENGTH));
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

  // ── Web OTP API (Zero-Click Autofill) ───────
  useEffect(() => {
    if (!otpSent || typeof window === 'undefined' || !('OTPCredential' in window)) {
      return;
    }

    const ac = new AbortController();

    const listenForOtp = async () => {
      try {
        const otpCredential = await (navigator.credentials as any).get({
          otp: { transport: ['sms'] },
          signal: ac.signal
        });

        if (otpCredential && otpCredential.code) {
          setOtp(otpCredential.code.slice(0, OTP_LENGTH));
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.log('WebOTP Error:', err);
        }
      }
    };

    listenForOtp();

    return () => {
      ac.abort();
    };
  }, [otpSent]);

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
              src="/employer/images/network_stat_logo.jpeg"
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

        <div className={styles.splitContainer}>
          {/* Left Info Section - Desktop Only */}
          <div className={styles.leftInfoSection}>
            <h1 className={styles.mainHeadline}>Hire top talent in 48 hours with NetworkBaba.</h1>
            <p className={styles.subHeadline}>
              Streamline your recruitment with AI-driven precision. Single solution from Fresher to experienced hiring.
            </p>

            <div className={styles.statsContainer}>
              <div className={styles.statItem}>
                <h3 className={styles.statValue}>6 crore+</h3>
                <p className={styles.statLabel}>Qualified candidates</p>
              </div>
              <div className={styles.statItem}>
                <h3 className={styles.statValue}>7 lakhs+</h3>
                <p className={styles.statLabel}>Employers use NetworkBaba</p>
              </div>
              <div className={styles.statItem}>
                <h3 className={styles.statValue}>900+</h3>
                <p className={styles.statLabel}>Available cities</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className={styles.rightLoginSection}>
            <div className={`${styles.loginCard} ${shakeForm ? styles.shake : ''}`}>
              <div className={styles.brandSection}>
                <img
                  src="/employer/images/vertical_baba.png"
                  alt="NetworkBaba Logo"
                  className={styles.brandLogoImg}
                />
                <h1 className={styles.brandTitle}>Let&apos;s get started</h1>
                <p className={styles.brandSubtitle}>
                  {otpSent ? 'Enter the OTP sent to your mobile' : 'Hire top talent faster with NetworkBaba'}
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
                <div 
                  className={styles.otpBoxesWrapper} 
                  onClick={() => mainOtpRef.current?.focus()}
                  style={{ position: 'relative', cursor: 'text' }}
                >
                  {/* Hidden underlying REAL input for Autofill reliability */}
                  <input
                    ref={mainOtpRef}
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d*"
                    value={otp}
                    onChange={handleOtpChange}
                    className={styles.hiddenOtpInput}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0.1, // Increased visibility slightly for browser detection
                      zIndex: 10,
                      cursor: 'text',
                      caretColor: 'transparent',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      color: 'transparent',
                      fontSize: '1px'
                    }}
                    autoFocus
                    disabled={loading}
                  />
                  
                  {/* Visual UI Boxes */}
                  {Array.from({ length: OTP_LENGTH }, (_, i) => (
                    <div 
                      key={i} 
                      className={`${styles.otpBox} ${otp.length === i ? styles.otpBoxActive : ''} ${otp[i] ? styles.otpBoxFilled : ''}`}
                    >
                      {otp[i] || ''}
                      {otp.length === i && <span className={styles.otpCursor} />}
                    </div>
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
          </div>
        </div>
      </main>
    </>
  );
}
