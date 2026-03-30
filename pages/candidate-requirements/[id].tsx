import { useState, useEffect, type FormEvent } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import JobStepper from '@/components/JobStepper';
import {
  getCandidateRequirementsApi,
  saveCandidateRequirementsApi,
  type CandidateRequirementsData,
  type RequirementItem,
} from '@/services/api';
import styles from '@/styles/candidateReq.module.css';

declare global {
  interface Window {
    CKEDITOR: any;
  }
}

/**
 * Candidate Requirements Page
 * Route: /candidate-requirements/[id]
 * Mirrors: networkbaba.co/candidate-job-requirements/add/{job_id}
 */
export default function CandidateRequirementsPage() {
  const router = useRouter();
  const { id } = router.query;
  const jobId = id ? Number(id) : 0;

  const { user, loading: authLoading } = useAuth();

  // ── Data from API ──────────────────────────────
  const [pageData, setPageData] = useState<CandidateRequirementsData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');

  // ── Selected state ─────────────────────────────
  const [selectedReqs, setSelectedReqs] = useState<Set<number>>(new Set());
  const [selectedSkills, setSelectedSkills] = useState<Set<number>>(new Set());
  const [jobInfo, setJobInfo] = useState('');

  // ── Submit state ───────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [scriptLoaded, setScriptLoaded] = useState(false);

  // ── Auth Guard ─────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // ── Fetch Data ─────────────────────────────────
  useEffect(() => {
    if (!router.isReady || authLoading || !user) return;

    const idParam = router.query.id;
    const jId = idParam ? Number(idParam) : 0;

    if (!jId || isNaN(jId)) return;

    const fetchData = async () => {
      setLoadingData(true);
      setLoadError('');
      try {
        const res = await getCandidateRequirementsApi(jId);
        if (res.status && res.data) {
          setPageData(res.data);
          setSelectedReqs(new Set(res.data.selected_requirements));
          setSelectedSkills(new Set(res.data.selected_skills));
          setJobInfo(res.data.job_info || '');
        } else {
          setLoadError(res.message || 'Failed to load job requirements.');
        }
      } catch (err: any) {
        setLoadError(`Connection error: ${err.message || 'unknown'}. (ID: ${jId})`);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [router.isReady, router.query.id, authLoading, user]);

  // ── CKEditor Initialization ────────────────────
  const initEditor = () => {
    const el = document.getElementById('job_info_editor');
    if (window.CKEDITOR && el) {
      if (window.CKEDITOR.instances.job_info_editor) {
        window.CKEDITOR.instances.job_info_editor.destroy(true);
      }
      const editor = window.CKEDITOR.replace('job_info_editor', {
        height: 250,
        versionCheck: false,
        removePlugins: 'elementspath,resize',
        toolbar: [
          { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'] },
          { name: 'paragraph', items: ['NumberedList', 'BulletedList'] },
          { name: 'tools', items: ['Maximize'] }
        ]
      });

      editor.on('change', () => {
        const data = editor.getData();
        setJobInfo(data);
      });

      if (pageData?.job_info) {
        editor.setData(pageData.job_info);
      }
    }
  };

  useEffect(() => {
    if (scriptLoaded && !loadingData && pageData) {
      initEditor();
    }
  }, [scriptLoaded, loadingData, pageData]);

  // ── Toggle Handlers ────────────────────────────
  const toggleReq = (reqId: number) => {
    setSelectedReqs((prev) => {
      const next = new Set(prev);
      if (next.has(reqId)) next.delete(reqId);
      else next.add(reqId);
      return next;
    });
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  // ── Submit ─────────────────────────────────────
  const saveAndNavigate = async (targetStep?: number) => {
    if (!pageData) return;

    setSubmitting(true);
    setSubmitError('');

    let finalJobInfo = jobInfo;
    const txtArea = document.getElementById('job_info_editor') as HTMLTextAreaElement;
    if (window.CKEDITOR && window.CKEDITOR.instances.job_info_editor) {
      finalJobInfo = window.CKEDITOR.instances.job_info_editor.getData();
    } else if (txtArea && txtArea.value) {
      finalJobInfo = txtArea.value;
    }

    const requirements: RequirementItem[] = pageData.requirements
      .filter((r) => selectedReqs.has(r.id))
      .map((r) => ({ id: r.id, name: r.requirement }));

    const skills: RequirementItem[] = pageData.skills
      .filter((s) => selectedSkills.has(s.id))
      .map((s) => ({ id: s.id, name: s.name }));

    try {
      const res = await saveCandidateRequirementsApi({
        job_id: jobId,
        requirements,
        skills,
        job_info: finalJobInfo,
      });

      if (res.status) {
        if (targetStep === 1) router.push(`/post-job?edit=${jobId}`);
        else if (targetStep === 2) router.push(`/candidate-requirements/${jobId}`);
        else if (targetStep === 3) router.push(`/employer-company-info/${jobId}`);
        else if (targetStep === 4) router.push(`/employer-job-reviews/${jobId}`);
        else router.push(`/employer-company-info/${jobId}`);
      } else {
        setSubmitError(res.message || 'Failed to save. Please try again.');
      }
    } catch {
      setSubmitError('Unable to connect to server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveAndNavigate();
  };

  const handleStepClick = (stepId: number) => {
    if (stepId === 2) return;
    saveAndNavigate(stepId);
  };

  const chipClass = (active: boolean) =>
    `${styles.chip} ${active ? styles.chipActive : ''}`;

  if (authLoading || (!user && !authLoading)) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Candidate Requirements | NetworkBaba</title>
        <meta name="description" content="Select skills and documents for your job." />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>

      <Script
        src="https://cdn.ckeditor.com/4.22.1/standard/ckeditor.js"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className={styles.pageWrapper}>
        <div className={styles.contentWrapper}>
          <div className={styles.mainContainer}>
            <JobStepper currentStep={2} onStepClick={handleStepClick} />

            {loadingData && (
              <div className={styles.loadingWrapper}>
                <div className={styles.loadingSpinner} />
                Loading job requirements…
              </div>
            )}

            {!loadingData && loadError && (
              <div className={styles.errorMsg}>{loadError}</div>
            )}

            {!loadingData && !loadError && pageData && (
              <form onSubmit={handleSubmit} noValidate>
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.mainTitle}>Candidate Requirements</h2>
                    <p className={styles.subTitle}>Select the assets and skills required for this role</p>
                  </div>

                  {pageData.requirements.length > 0 && (
                    <>
                      <span className={styles.sectionTitle}>
                        <i className="fa fa-folder-open"></i> DOCUMENTS / ASSETS
                      </span>
                      <div className={styles.chipContainer}>
                        {pageData.requirements.map((req) => (
                          <button
                            key={req.id}
                            type="button"
                            className={chipClass(selectedReqs.has(req.id))}
                            onClick={() => toggleReq(req.id)}
                            disabled={submitting}
                          >
                            {req.requirement}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {pageData.requirements.length > 0 && pageData.skills.length > 0 && (
                    <hr className={styles.sectionDivider} />
                  )}

                  {pageData.skills.length > 0 && (
                    <>
                      <span className={styles.sectionTitle}>
                        <i className="fa fa-star"></i> TECHNICAL SKILLS
                      </span>
                      <div className={styles.chipContainer}>
                        {pageData.skills.map((skill) => (
                          <button
                            key={skill.id}
                            type="button"
                            className={chipClass(selectedSkills.has(skill.id))}
                            onClick={() => toggleSkill(skill.id)}
                            disabled={submitting}
                          >
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <hr className={styles.sectionDivider} />

                  <span className={styles.sectionTitle}>
                    <i className="fa fa-align-left"></i> JOB DESCRIPTION
                  </span>
                  <div className={styles.editorWrapper}>
                    <textarea
                      id="job_info_editor"
                      name="job_info_editor"
                      className={styles.jobInfoTextarea}
                      defaultValue={jobInfo}
                    />
                  </div>

                  <div className={styles.footerActions}>
                    <button
                      type="button"
                      className={styles.btnBack}
                      onClick={() => router.push(`/post-job?edit=${jobId}`)}
                      disabled={submitting}
                    >
                      ← Go Back
                    </button>
                    <button
                      type="submit"
                      className={styles.btnContinue}
                      disabled={submitting}
                      id="save-requirements-btn"
                    >
                      {submitting && <span className={styles.spinner} />}
                      {submitting ? 'Saving…' : 'Save & Continue →'}
                    </button>
                  </div>

                  {submitError && (
                    <p className={styles.errorMsg}>{submitError}</p>
                  )}

                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
