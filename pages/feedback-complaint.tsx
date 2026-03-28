import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/feedbackComplaint.module.css';

export default function FeedbackComplaint() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Feedback',
    message: '',
    priority: 'Normal',
    agreeToTerms: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      alert("Please agree to the Terms and Conditions before submitting.");
      return;
    }

    if (!formData.subject || !formData.message) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    
    // Simulate API call for the demo
    setTimeout(() => {
      setLoading(false);
      alert("Thank you! Your feedback/complaint has been submitted successfully.\n\nOur team will review it and get back to you if needed.");
      router.push('/all-post-jobs');
    }, 1500);
  };

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Feedback & Complaint | NetworkBaba</title>
      </Head>

      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          
          {/* Header Block */}
          <div className={styles.headerBlock}>
            <div className={styles.titleWrapper}>
              <svg className={styles.titleIcon} width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h1 className={styles.pageTitle}>Feedback & Complaints</h1>
            </div>
            <p className={styles.pageSubtitle}>
              We value your experience. Let us know how we can improve, or report any issues you've encountered while using NetworkBaba.
            </p>
          </div>

          {/* Form Card */}
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <form onSubmit={handleSubmit}>
                
                <div className={styles.formRow}>
                  {/* Category */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>What is this regarding? *</label>
                    <div className={styles.selectWrapper}>
                      <select 
                        className={`${styles.formControl} ${styles.formSelect}`}
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                      >
                        <option value="Feedback">General Feedback / Suggestion</option>
                        <option value="Complaint">Report an Issue / Complaint</option>
                        <option value="Feature Request">Request a New Feature</option>
                        <option value="Candidate Issue">Issue with a Candidate</option>
                        <option value="Payment">Billing / Payment Issue</option>
                        <option value="Other">Other</option>
                      </select>
                      <svg className={styles.selectIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Priority Level</label>
                    <div className={styles.selectWrapper}>
                      <select 
                        className={`${styles.formControl} ${styles.formSelect}`}
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      >
                        <option value="Low">Low - Not urgent</option>
                        <option value="Normal">Normal - Standard priority</option>
                        <option value="High">High - Requires quick attention</option>
                        <option value="Urgent">Urgent - Blocking my work</option>
                      </select>
                      <svg className={styles.selectIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={styles.formRow}>
                  {/* Subject */}
                  <div className={styles.formGroupFull}>
                     <label className={styles.formLabel}>Subject *</label>
                     <input 
                       type="text" 
                       className={styles.formControl} 
                       placeholder="Brief summary of your feedback or issue..."
                       value={formData.subject}
                       onChange={(e) => setFormData({...formData, subject: e.target.value})}
                       required
                     />
                  </div>
                </div>

                <div className={styles.formRow}>
                  {/* Message */}
                  <div className={styles.formGroupFull}>
                     <label className={styles.formLabel}>Detailed Description *</label>
                     <textarea 
                       className={`${styles.formControl} ${styles.formTextarea}`} 
                       placeholder="Please provide as much detail as possible. If reporting a bug, describe what you were doing when it happened."
                       value={formData.message}
                       onChange={(e) => setFormData({...formData, message: e.target.value})}
                       required
                     ></textarea>
                  </div>
                </div>
                
                {/* User Context (Read-only for demo visual) */}
                <div className={styles.formRow} style={{ opacity: 0.7, pointerEvents: 'none' }}>
                  <div className={styles.formGroup}>
                     <label className={styles.formLabel}>Registered Company</label>
                     <input type="text" className={styles.formControl} value={user.company_name} readOnly />
                  </div>
                  <div className={styles.formGroup}>
                     <label className={styles.formLabel}>Contact Auto-fill</label>
                     <input type="text" className={styles.formControl} value={user.mobileno} readOnly />
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className={styles.optionsSection}>
                   <label className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        className={styles.checkboxInput}
                        checked={formData.agreeToTerms}
                        onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
                      />
                      <span className={styles.checkboxText}>
                        I agree to the <a href="#" onClick={(e) => e.preventDefault()}>Terms and Conditions</a> and understand that my account details along with this message will be securely transmitted to the NetworkBaba support team for resolution purposes.
                      </span>
                   </label>
                </div>

                {/* Footer Buttons */}
                <div className={styles.actionFooter}>
                   <button type="button" className={styles.btnCancel} onClick={() => router.back()}>
                     Cancel
                   </button>
                   <button type="submit" className={styles.btnSubmit} disabled={loading}>
                     {loading ? (
                       <>
                        <svg className={styles.btnIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html: `<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`}} style={{ animation: 'spinAnim 1s linear infinite' }} />
                        Submitting...
                       </>
                     ) : (
                       <>
                        <svg className={styles.btnIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                        Submit Feedback
                       </>
                     )}
                   </button>
                </div>

              </form>
            </div>
          </div>

          {/* Contact Alternatives */}
          <div className={styles.contactBlock}>
            <div className={styles.contactItem}>
              <div className={styles.contactIconCircle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div>
                Direct Email<br />
                <a href="mailto:support@networkbaba.co">support@networkbaba.co</a>
              </div>
            </div>
            
            <div className={styles.contactItem}>
              <div className={styles.contactIconCircle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div>
                Helpline<br />
                <a href="tel:+918149330777">+91 81493 30777</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
