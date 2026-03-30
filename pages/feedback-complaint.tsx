import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';

export default function FeedbackComplaint() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Support & Feedback | NetworkBaba</title>
      </Head>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '82vh', 
        padding: '20px', 
        backgroundColor: '#fafcff' 
      }}>
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '20px', 
          padding: '45px 40px', 
          maxWidth: '540px', 
          width: '100%', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)', 
          textAlign: 'center', 
          border: '1px solid #eef2f6' 
        }}>
          
          <div style={{ 
            width: '85px', 
            height: '85px', 
            background: 'linear-gradient(135deg, #e4f0ff 0%, #f4fbff 100%)', 
            borderRadius: '50%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            margin: '0 auto 25px',
            boxShadow: 'inset 0 0 0 2px #d4e8ff'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2d6eb5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a', marginBottom: '12px', fontFamily: 'inherit' }}>
            We're Here to Help
          </h1>
          <p style={{ fontSize: '15px', color: '#5b6b79', lineHeight: 1.6, marginBottom: '35px' }}>
            Have feedback, a complaint, or a feature request? Please email our dedicated support team directly. We strive to resolve all issues as quickly and efficiently as possible.
          </p>

          <a 
            href={`mailto:support@networkbaba.co?subject=Support Request - ${user.company_name}`}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
              backgroundColor: '#2d6eb5', 
              color: '#ffffff', 
              padding: '16px 36px', 
              borderRadius: '50px',
              textDecoration: 'none', 
              fontWeight: 600, 
              fontSize: '16px', 
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 16px rgba(45, 110, 181, 0.25)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1e5494';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(45, 110, 181, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#2d6eb5';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(45, 110, 181, 0.25)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Write an Email
          </a>

          <div style={{ marginTop: '20px', fontSize: '15px', color: '#2d6eb5', fontWeight: 600, letterSpacing: '0.5px' }}>
            support@networkbaba.co
          </div>

          <div style={{ marginTop: '45px', paddingTop: '25px', borderTop: '1px dashed #e1e7ed', textAlign: 'left', fontSize: '13px', color: '#73808c', lineHeight: 1.6 }}>
            <strong style={{ color: '#3a4a5b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '14px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Terms & Guidelines
            </strong>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>Please include your Company Name (<b>{user.company_name}</b>) and Registered Mobile Number (<b>{user.mobileno}</b>) inside your email for a faster resolution.</li>
              <li style={{ marginBottom: '8px' }}>Our standard response time is within <b>24-48 business hours</b>.</li>
              <li>By contacting support, you agree to treat our staff with respect. Abusive language will not be tolerated and may lead to account suspension.</li>
            </ul>
          </div>

        </div>
      </div>
    </>
  );
}
