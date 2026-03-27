import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import { updatePaymentStatusApi } from '@/services/api';

// Simple external types for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function EmployerProcessPayment() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth() as any;
  
  const [loading, setLoading] = useState(true);
  const [clockDisplay, setClockDisplay] = useState('Loading...');
  
  // URL Params
  const { order_id, pkg_id, amount } = router.query;

  // Success State Data
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(6);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!order_id || !amount) {
      // Avoid rendering if missing params
      return;
    }
    setLoading(false);
  }, [user, authLoading, order_id, amount]);

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        day: 'numeric', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      };
      setClockDisplay(now.toLocaleDateString('en-IN', options));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown Redirect
  useEffect(() => {
    if (isSuccess && timeLeft > 0) {
      const waitTimer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(waitTimer);
    } else if (isSuccess && timeLeft === 0) {
      router.push('/all-post-jobs');
    }
  }, [isSuccess, timeLeft, router]);

  const handlePayment = () => {
    if (!window.Razorpay) {
      alert("Payment gateway failed to load. Please refresh.");
      return;
    }

    const payAmountRs = Number(amount);
    const amountInPaise = Math.round(payAmountRs * 100);
    const userEmail = (user as any)?.email || '';
    const userPhone = (user as any)?.company_number || (user as any)?.mobileno || '';
    const companyName = (user as any)?.company_name || 'Valued Customer';

    const options = {
      key: "rzp_live_FJrLKxgzWZKHTN", // Legacy key
      amount: amountInPaise.toString(),
      currency: "INR",
      name: "Network Baba",
      description: "Premium Package",
      image: "https://www.networkbaba.co/s31/images/vertical_baba.png",
      handler: async function (response: any) {
        const rzpPaymentId = response.razorpay_payment_id;
        
        try {
          const res = await updatePaymentStatusApi(Number(order_id), rzpPaymentId);
          if (res.status && res.data) {
            setSuccessData({
              tx_id: res.data.tx_id,
              start_date: res.data.start_date,
              expiry_date: res.data.expiry_date,
              amount: res.data.amount,
              company_name: companyName
            });
            setIsSuccess(true);
          } else {
            alert("Payment Verified but profile activation failed: " + res.message);
          }
        } catch (error) {
          alert("System Error during payment confirmation.");
        }
      },
      prefill: {
        name: companyName,
        email: userEmail,
        contact: userPhone
      },
      theme: { color: "#1e3c72" }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (loading) return null;

  return (
    <>
      <Head>
        <title>Secure Payment Checkout</title>
      </Head>
      
      {/* Razorpay Setup */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div style={styles.container}>
        {!isSuccess ? (
          <div style={styles.checkoutWrapper}>
            <div style={styles.brandBox}>
              <img src="https://www.networkbaba.co/s31/images/vertical_baba.png" alt="Logo" style={{ width: 35, height: 35, objectFit: 'contain' }} />
            </div>
            
            <h2 style={styles.merchantTitle}>Network Baba</h2>
            
            <div style={styles.trustIndicator}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              Verified Merchant
            </div>

            <div style={styles.costSummaryPanel}>
              <div style={styles.lblSm}>Total Payable</div>
              <div style={styles.priceLg}>₹{Number(amount).toLocaleString('en-IN')}</div>
              <div style={styles.clockBadge}>{clockDisplay}</div>
            </div>

            <div style={styles.formRow}>
              <label style={styles.captionText}>Email Address</label>
              <input type="email" style={styles.modernInput} value={(user as any)?.email || ''} readOnly />
            </div>

            <div style={styles.formRow}>
              <label style={styles.captionText}>Phone Number</label>
              <input type="tel" style={styles.modernInput} value={(user as any)?.company_number || (user as any)?.mobileno || ''} readOnly />
            </div>

            <button onClick={handlePayment} style={styles.actionBtn}>
              Pay Securely
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>

            <div style={styles.secBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Secured by Razorpay Encryption
            </div>
          </div>
        ) : (
          <div style={styles.checkoutWrapper}>
            <div style={{ ...styles.closeX }} onClick={() => router.push('/all-post-jobs')}>&times;</div>

            <div style={{...styles.successIconCircle}}>
              <svg style={{...styles.successCheck}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            
            <div style={styles.successTitle}>Payment Successful!</div>
            <div style={styles.successSub}>Your subscription is now active.</div>
            
            <div style={styles.detailsBox}>
              <div style={styles.dtRow}>
                <span style={styles.dtLbl}>Transaction ID</span>
                <span style={{...styles.dtVal, fontFamily: 'monospace'}}>{successData.tx_id}</span>
              </div>
              <div style={styles.dtRow}>
                <span style={styles.dtLbl}>Order ID</span>
                <span style={styles.dtVal}>#{order_id}</span>
              </div>
              <div style={styles.dtRow}>
                <span style={styles.dtLbl}>Company</span>
                <span style={styles.dtVal}>{successData.company_name}</span>
              </div>
              <div style={styles.dtRow}>
                <span style={styles.dtLbl}>Activated On</span>
                <span style={styles.dtVal}>{successData.start_date}</span>
              </div>
              <div style={styles.dtRow}>
                <span style={styles.dtLbl}>Expiry Date</span>
                <span style={{...styles.dtVal, color: '#d97706'}}>{successData.expiry_date}</span>
              </div>
              <div style={{...styles.dtRow, marginTop: 10, paddingTop: 10, borderTop: '1px dashed #e5e7eb'}}>
                <span style={{...styles.dtLbl, fontSize: 15, color: '#111827'}}>Amount Paid</span>
                <span style={{...styles.dtVal, fontSize: 16}}>₹{successData.amount}</span>
              </div>
            </div>

            <div style={styles.redirectMsg}>Redirecting in <span>{timeLeft}</span> seconds...</div>

            <button style={styles.btnDashboard} onClick={() => router.push('/all-post-jobs')}>
              Go to Dashboard Now
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
    fontFamily: '"Manrope", sans-serif',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  checkoutWrapper: {
    background: '#ffffff',
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 30,
    textAlign: 'center',
    boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.1)',
    position: 'relative' as 'relative',
  },
  brandBox: {
    width: 60, height: 60, background: '#fff', borderRadius: 14,
    margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 5px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9'
  },
  merchantTitle: { fontSize: 18, color: '#1e293b', fontWeight: 800, marginBottom: 4 },
  trustIndicator: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: '#f0f9ff', color: '#0284c7', fontSize: 11,
    fontWeight: 700, padding: '4px 10px', borderRadius: 20,
    textTransform: 'uppercase', marginBottom: 20
  },
  costSummaryPanel: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16,
    padding: 15, marginBottom: 20
  },
  lblSm: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 },
  priceLg: { fontSize: 32, color: '#0f172a', fontWeight: 800, lineHeight: 1, marginBottom: 5 },
  clockBadge: { fontSize: 11, color: '#64748b', background: '#e2e8f0', padding: '4px 10px', borderRadius: 20, display: 'inline-block', fontWeight: 600 },
  formRow: { marginBottom: 15, textAlign: 'left' },
  captionText: { fontSize: 13, color: '#475569', fontWeight: 600, marginBottom: 5, display: 'block', marginLeft: 2 },
  modernInput: {
    width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1',
    borderRadius: 10, fontSize: 14, fontWeight: 600,
    color: '#334155', background: '#f8fafc', outline: 'none'
  },
  actionBtn: {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white',
    width: '100%', padding: 14, border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(30, 60, 114, 0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10
  },
  secBadge: { marginTop: 20, fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 },
  
  // Success UI
  successIconCircle: { width: 80, height: 80, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' },
  successCheck: { color: '#16a34a', width: 40, height: 40 },
  successTitle: { fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 5 },
  successSub: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  detailsBox: { background: '#f9fafb', borderRadius: 12, padding: 15, textAlign: 'left', marginBottom: 20 },
  dtRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 },
  dtLbl: { color: '#6b7280', fontWeight: 600 },
  dtVal: { color: '#111827', fontWeight: 700, textAlign: 'right' },
  redirectMsg: { fontSize: 12, color: '#9ca3af', marginBottom: 10 },
  btnDashboard: { background: '#111827', color: '#fff', width: '100%', padding: 14, borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'block' },
  closeX: { position: 'absolute', top: 15, right: 15, cursor: 'pointer', color: '#9ca3af', fontSize: 20, width: 30, height: 30, lineHeight: 30, borderRadius: '50%', background: '#f3f4f6' }
};
