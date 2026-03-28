import { useState, FormEvent, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { approveAgreementApi } from '@/services/api';
import JobStepper from '@/components/JobStepper';
import styles from '@/styles/codeOfConduct.module.css';

export default function EmployerJobReviewsPage() {
  const router = useRouter();
  const { id } = router.query;
  const jobId = Number(id);
  const { user, loading: authLoading } = useAuth();

  const [agreed, setAgreed] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const saveAndNavigate = async (targetStep?: number) => {
    if (!agreed) {
      setErrorMsg('Please confirm the agreement by checking the box.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await approveAgreementApi(jobId);
      if (res.status) {
        if (targetStep === 1) router.push(`/post-job?edit=${jobId}`);
        else if (targetStep === 2) router.push(`/candidate-requirements/${jobId}`);
        else if (targetStep === 3) router.push(`/employer-company-info/${jobId}`);
        else if (targetStep === 4) router.push(`/employer-job-reviews/${jobId}`);
        else router.push('/all-post-jobs');
      } else {
        setErrorMsg(res.message || 'Failed to approve. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error. Failed to connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveAndNavigate();
  };

  const handleStepClick = (stepId: number) => {
    if (stepId === 4) return;
    if (stepId === 1) router.push(`/post-job?edit=${jobId}`);
    else if (stepId === 2) router.push(`/candidate-requirements/${jobId}`);
    else if (stepId === 3) router.push(`/employer-company-info/${jobId}`);
  };

  const goBack = () => {
    router.push(`/employer-company-info/${jobId}`);
  };

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Code of Conduct | NetworkBaba</title>
      </Head>

      <div className={styles.pageWrapper}>


        <div className={styles.mainContainer}>
          <JobStepper currentStep={4} onStepClick={handleStepClick} />
          <form onSubmit={handleSubmit}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Reviews & Guidelines</h3>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.guidelineList}>

                  <div className={styles.guidelineItem}>
                    <div className={styles.iconBox}>
                      <img src="/employer/images/icon/call.png" alt="Call" />
                    </div>
                    <div className={styles.contentBox}>
                      <h4 className={styles.contentTitle}>Answer the phone</h4>
                      <p className={styles.contentDesc}>
                        When Candidate will call you and respond in WhatsApp
                        <img src="/employer/images/icon/whatsapp-button.png" alt="WhatsApp" className={styles.whatsappIcon} />
                      </p>
                    </div>
                  </div>

                  <div className={styles.guidelineItem}>
                    <div className={styles.iconBox}>
                      <img src="/employer/images/icon/right_info.jpg" alt="Info" />
                    </div>
                    <div className={styles.contentBox}>
                      <h4 className={styles.contentTitle}>Right Info</h4>
                      <p className={styles.contentDesc}>Provide the complete and correct information regarding the job role.</p>
                    </div>
                  </div>

                  <div className={styles.guidelineItem}>
                    <div className={styles.iconBox}>
                      <img src="/employer/images/icon/polite.jpg" alt="Polite" />
                    </div>
                    <div className={styles.contentBox}>
                      <h4 className={styles.contentTitle}>Be Polite and Respectful</h4>
                      <p className={styles.contentDesc}>Always treat candidates willing to work for you with respect.</p>
                    </div>
                  </div>

                  <div className={styles.guidelineItem}>
                    <div className={styles.iconBox}>
                      <img src="/employer/images/icon/deactive_job.png" alt="Deactive" />
                    </div>
                    <div className={styles.contentBox}>
                      <h4 className={styles.contentTitle}>Deactivate The Job</h4>
                      <p className={styles.contentDesc}>Once you have filled the vacancy or stopped taking interviews, please deactivate the post.</p>
                    </div>
                  </div>

                  <div className={styles.guidelineItem}>
                    <div className={styles.iconBox}>
                      <img src="/employer/images/icon/no_charge.png" alt="Free" />
                    </div>
                    <div className={styles.contentBox}>
                      <h4 className={styles.contentTitle}>No Charges or Money</h4>
                      <p className={styles.contentDesc}>Do not ask for money from candidates. If there is a registration fee or kit charge, please explicitly mention it in the job description.</p>
                    </div>
                  </div>

                </div>

                <div className={styles.approvalSection}>
                  <input type="checkbox" id="agreement_approval" className={styles.customCheckbox} checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <label htmlFor="agreement_approval" className={styles.approvalText}>
                    I agree to follow the Networkbaba Code of Conduct.
                  </label>
                </div>

                <div className={styles.expiryNote}>
                  <strong>Note:</strong> Your job listing will automatically deactivate within <strong>15 days</strong>.<br />
                  Please come back and reactivate if your vacancy is not filled by then.
                </div>

              </div>
            </div>

            {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

            <div className={styles.formFooter}>
              <button type="button" className={`${styles.btn} ${styles.btnBack}`} onClick={goBack} disabled={submitting}>
                &laquo; Back
              </button>
              <button type="submit" className={`${styles.btn} ${styles.btnNext}`} disabled={submitting}>
                {submitting ? 'Saving...' : 'Continue \u00BB'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  );
}
