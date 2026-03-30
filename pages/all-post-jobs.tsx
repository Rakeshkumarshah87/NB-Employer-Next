/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { getAllJobsApi, getPlanInfoApi, updateJobStatusApi, getJobDetailApi, getCandidatesApplied, getCandidatesRecommended, updateCandidateStatusApi } from '@/services/api';
import styles from '@/styles/allPostJobs.module.css';

const IMG = '/employer/images/icon';

// --- CANDIDATE LIST VIEW COMPONENT ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CandidateListView = ({ postId, viewMode, statusFilter, isPlanActive, jobStatus, onLoadingChange }: { postId: number, viewMode: 'applied' | 'recommended', statusFilter: string, isPlanActive: boolean, jobStatus?: number, onLoadingChange?: (loading: boolean) => void }) => {
  const LIVE_BASE = 'https://networkbaba.co';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // States for displaying contact number and profile modal
  const [revealedNumbers, setRevealedNumbers] = useState<Record<number, boolean>>({});
  const [modalCandidate, setModalCandidate] = useState<any | null>(null);

  // State for Status Update Form
  const [activeUpdateId, setActiveUpdateId] = useState<number | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [updateRating, setUpdateRating] = useState<number>(0);
  const [updateRemark, setUpdateRemark] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadCandidates = useCallback(async (reset: boolean = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      setLoading(true);
      if (reset) {
        setOffset(0);
        setError('');
        setCandidates([]);
      }

      let res;
      if (viewMode === 'applied') {
        res = await getCandidatesApplied(postId, currentOffset, 10, statusFilter);
      } else {
        res = await getCandidatesRecommended(postId, currentOffset, 10);
      }

      if (res?.status && res?.data) {
        setCandidates(prev => reset ? (res.data.candidates || []) : [...prev, ...(res.data.candidates || [])]);
        setHasMore(res.data.has_more);
        setOffset(currentOffset + 10);
      } else {
        setError(res?.message || 'Failed to load candidates');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: unknown) {
      setError('Error loading candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [postId, viewMode, statusFilter, offset]);

  const router = useRouter();

  // Reset and fetch when dependencies change
  useEffect(() => {
    loadCandidates(true);
  }, [postId, viewMode, statusFilter]);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadCandidates(false);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, loading, loadCandidates]);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading && offset === 0);
    }
  }, [loading, offset, onLoadingChange]);

  if (loading && offset === 0) {
    return <div style={{ textAlign: 'center', padding: 60 }}><div className={styles.spinner}></div></div>;
  }
  if (error) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'red' }}>{error}</div>;
  }
  if (candidates.length === 0) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#666', background: '#f8f9fa', borderRadius: 8 }}>No candidates found for this selection.</div>;
  }

  const handleStatusChange = (userId: number, value: string) => {
    if (value) {
      setActiveUpdateId(userId);
      setUpdateStatus(value);
    } else {
      setActiveUpdateId(null);
      setUpdateStatus('');
    }
  };

  const submitStatusUpdate = async (userId: number, applyId: number) => {
    if (!updateStatus) {
      alert('Please select a status first.');
      return;
    }
    setIsUpdating(true);
    try {
      const payload = {
        post_id: postId,
        user_id: userId,
        apply_id: applyId || 0,
        status: updateStatus,
        review: updateRating,
        remark: updateRemark
      };
      const res = await updateCandidateStatusApi(payload);
      if (res.status !== false) {
        // Optimistically update the candidate in the list
        setCandidates(prev => prev.map(c => {
          if (c.user_id === userId) {
            return {
              ...c,
              status: updateStatus,
              review: updateRating.toString(),
              remark: updateRemark
            };
          }
          return c;
        }));
        // Reset form
        setActiveUpdateId(null);
        setUpdateStatus('');
        setUpdateRating(0);
        setUpdateRemark('');
        alert('Status updated successfully!');
      } else {
        alert(res.message || 'Failed to update status.');
      }
    } catch (e) {
      alert('Error updating status.');
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      {candidates.map((c, idx) => {
        const isCandidateUnlocked = isPlanActive || (viewMode === 'recommended' && idx < 10);

        return (
          <div key={idx} className={styles.candidateCard}>
            {viewMode === 'applied' && c.status_badge && <span className={styles.newCandidatePill}>{c.status_badge}</span>}
            <div className={styles.candidateHeader}>
              {c.profile_pic ? (
                <img src={c.profile_pic} alt="" className={styles.candidateAvatar} />
              ) : (
                <div className={styles.candidateAvatarFallback}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div className={styles.candidateNameRow}>
                  <h3 className={styles.candidateName}>{c.name}</h3>
                  {c.status_badge && <span className={styles.newCandidateBadge}>{c.status_badge}</span>}
                </div>
                <div className={styles.candidateLocation}>
                  📍 {c.location} {(viewMode === 'recommended' || c.recommended_status === 1) && <span className={styles.recommendedBadge}>Recommended</span>}
                </div>
                <div className={styles.candidateMeta}>
                  <div><strong>Experience:</strong><br />{c.experience} Years</div>
                  <div><strong>Education:</strong><br />{c.qualification} {c.degree_name ? <><br /><small style={{ color: '#888' }}>({c.degree_name})</small></> : ''}</div>
                  {viewMode === 'applied' && <div><strong>Applied On:</strong><br />{c.apply_date}</div>}
                </div>
              </div>
            </div>

            {jobStatus === 2 ? (
              <div className={styles.candidateReviewBanner}>
                Your Job is Under Review
              </div>
            ) : (
              <>
                <div className={styles.candidateActions}>
                  {isCandidateUnlocked ? (
                    <>
                      {revealedNumbers[idx] ? (
                        <button className={styles.btnShowNumber} style={{ cursor: 'text', background: '#f8f9fa', color: '#333', border: '1px solid #ced4da', boxShadow: 'none' }}>
                          📞 {c.contact_number}
                        </button>
                      ) : (
                        <button onClick={() => setRevealedNumbers({ ...revealedNumbers, [idx]: true })} className={styles.btnShowNumber}>
                          📞 Show Number
                        </button>
                      )}
                      <a href={`https://wa.me/91${(c.contact_number || '').slice(-10)}`} target="_blank" style={{ textDecoration: 'none' }}>
                        <button className={styles.btnWhatsApp}>💬 WhatsApp</button>
                      </a>
                      <button onClick={() => setModalCandidate(c)} className={styles.btnViewProfile}>
                        👤 View Profile
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => router.push('/employer-upgrade-plan')} className={styles.btnShowNumber}>🔒 Show Number</button>
                      <button onClick={() => router.push('/employer-upgrade-plan')} className={styles.btnWhatsApp}>🔒 WhatsApp</button>
                      <button onClick={() => router.push('/employer-upgrade-plan')} className={styles.btnViewProfileLocked}>🔒 View Profile</button>
                    </>
                  )}
                </div>
                {viewMode === 'applied' && (
                  <div style={{ marginTop: 15 }}>
                    <select
                      className={styles.candidateSelect}
                      value={activeUpdateId === c.user_id ? updateStatus : ''}
                      onChange={(e) => handleStatusChange(c.user_id, e.target.value)}
                    >
                      <option value="">Update Status</option>
                      <option value="Interview Fixed">Interview Fixed</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Hired">Hired</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Absent for Interview">Absent for Interview</option>
                    </select>

                    {/* Show Review Form logic  */}
                    {activeUpdateId === c.user_id && updateStatus && (
                      <div className={styles.statusUpdateBox}>
                        <div className={styles.ratingRow}>
                          <label><b>Rating:</b></label>
                          <div className={styles.starRating}>
                            {[5, 4, 3, 2, 1].map(num => (
                              <span key={num} style={{ display: 'inline-flex', flexDirection: 'row-reverse' }}>
                                <input
                                  type="radio"
                                  id={`star${num}-${c.user_id}`}
                                  name={`rating-${c.user_id}`}
                                  value={num}
                                  checked={updateRating === num}
                                  onChange={() => setUpdateRating(num)}
                                  style={{ display: 'none' }}
                                />
                                <label htmlFor={`star${num}-${c.user_id}`} className={styles.starLabel}>☆</label>
                              </span>
                            ))}
                          </div>
                        </div>
                        <textarea
                          className={styles.remarkBox}
                          placeholder="Add a remark..."
                          value={updateRemark}
                          onChange={(e) => setUpdateRemark(e.target.value)}
                        />
                        <button
                          onClick={() => submitStatusUpdate(c.user_id, c.apply_id)}
                          className={styles.btnStatusUpdate}
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Updating...' : 'Update Status'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {viewMode === 'applied' && c.status && activeUpdateId !== c.user_id && (
              <div className={styles.statusBoxDisplay}>
                <b style={{ color: '#ff7600' }}>{c.review} ★</b> | <strong>{c.status}</strong> | <i>{c.remark}</i>
              </div>
            )}
          </div>
        );
      })}

      {/* Infinite Scroll Target & Loader */}
      {(hasMore || loading) ? (
        <div ref={observerTarget} style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', padding: '10px' }}>
          {loading && <div className={styles.spinner}></div>}
        </div>
      ) : offset > 0 ? (
        <div style={{ textAlign: 'center', margin: '20px 0', color: '#8c98a4', fontStyle: 'italic', fontSize: '13px' }}>
          -- End of candidates list --
        </div>
      ) : null}

      {/* Profile Modal */}
      {modalCandidate && (
        <div className={styles.profileModalOverlay} onClick={() => setModalCandidate(null)}>
          <div className={styles.profileModalContentNative} onClick={e => e.stopPropagation()}>
            <div className={styles.profileModalHeader}>
              <h3 className={styles.profileModalTitle}>Candidate Profile</h3>
              <button className={styles.profileModalNativeClose} onClick={() => setModalCandidate(null)}>✕</button>
            </div>

            <div className={styles.profileModalBody}>
              <div className={styles.profileHeaderBox}>
                {modalCandidate.profile_pic ? (
                  <img src={modalCandidate.profile_pic} alt="" className={styles.profileModalAvatar} />
                ) : (
                  <div className={styles.profileModalAvatarFallback}>
                    {modalCandidate.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={styles.profileModalInfo}>
                  <h2>{modalCandidate.name}</h2>
                  <div className={styles.profileModalTags}>
                    <span>📍 {modalCandidate.location}</span>
                    <span>📞 {modalCandidate.contact_number}</span>
                  </div>
                </div>
              </div>

              <div className={styles.profileModalSection}>
                <h4>🧠 Skills</h4>
                <div className={styles.skillsTagBox}>
                  {(modalCandidate.skills ? modalCandidate.skills.split(',') : []).map((skill: string, idx: number) => {
                    const skillName = skill.trim();
                    if (!skillName) return null;
                    return <span key={idx} className={styles.skillTag}>{skillName}</span>;
                  })}
                  {!modalCandidate.skills && <span className={styles.noData}>No skills specified</span>}
                </div>
              </div>

              <div className={styles.profileModalSection}>
                <h4>🎓 Education & Qualification</h4>
                <div className={styles.detailText}>
                  <strong>{modalCandidate.qualification}</strong>
                  {modalCandidate.degree_name && (
                    <div className={styles.subDetailText}>{modalCandidate.degree_name}</div>
                  )}
                </div>
              </div>

              <div className={styles.profileModalSection}>
                <h4>👤 Personal Info</h4>
                <div className={styles.personalInfoGrid}>
                  <div className={styles.infoCol}>
                    <span className={styles.infoLabel}>Email</span>
                    <strong className={styles.infoValue}>{modalCandidate.email || 'N/A'}</strong>
                  </div>
                  <div className={styles.infoCol}>
                    <span className={styles.infoLabel}>Gender</span>
                    <strong className={styles.infoValue}>{modalCandidate.gender || 'N/A'}</strong>
                  </div>
                  <div className={styles.infoCol}>
                    <span className={styles.infoLabel}>Date of Birth</span>
                    <strong className={styles.infoValue}>{(modalCandidate.dob && modalCandidate.dob !== '0000-00-00') ? modalCandidate.dob : 'N/A'}</strong>
                  </div>
                  <div className={styles.infoCol}>
                    <span className={styles.infoLabel}>English Speaking</span>
                    <strong className={styles.infoValue}>{modalCandidate.english_speaking || 'N/A'}</strong>
                  </div>
                  <div className={styles.infoCol}>
                    <span className={styles.infoLabel}>Experience</span>
                    <strong className={styles.infoValue}>{modalCandidate.experience} Years</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.profileModalFooter}>
              <a href={`https://wa.me/91${(modalCandidate.contact_number || '').slice(-10)}`} target="_blank" style={{ textDecoration: 'none' }}>
                <button className={styles.btnWhatsApp}>💬 WhatsApp</button>
              </a>
              <a href={`tel:${modalCandidate.contact_number}`} style={{ textDecoration: 'none' }}>
                <button className={styles.btnShowNumber}>📞 Call Now</button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface Job {
  id: number;
  job_role_name: string;
  job_city: string;
  job_area: string;
  phone_number: string;
  monthly_from: string;
  monthly_to: string;
  min_qualification: string;
  candi_experience: string;
  min_exp: string;
  max_exp: string;
  open_time: string;
  close_time: string;
  active_status: number;
  verified_sts?: number;
  days_ago: number;
  job_info_short: string;
  job_info_full: string;
  has_more: boolean;
  verification_remark: string;
  skills: string | string[];
}

interface PlanInfo {
  has_active_plan: boolean;
  package_name: string;
  expiry_date: string;
  is_expired: boolean;
  total_jobs: number;
  used_jobs: number;
  can_post_job: number;
  package_offer: string;
  approval_status: string;
  approval_remark: string;
}

interface JobDetail {
  job: any;
  counts: {
    applied: number;
    recommended: number;
    all: number;
    new: number;
    interview_fixed: number;
    shortlisted: number;
    hired: number;
    rejected: number;
    absent_for_interview: number;
  };
}

export default function AllPostJobsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobs, setJobs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [expiredJobs, setExpiredJobs] = useState<any[]>([]);
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Record<number, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobDetail, setJobDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [candidateView, setCandidateView] = useState<'applied' | 'recommended'>('applied');
  const [candidateListLoading, setCandidateListLoading] = useState<boolean>(true);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState<boolean>(false);
  // State for Status Update Form
  const [activeUpdateId, setActiveUpdateId] = useState<number | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [updateRating, setUpdateRating] = useState<number>(0);
  const [updateRemark, setUpdateRemark] = useState<string>('');
  const [limitError, setLimitError] = useState('');
  const [postJobMsg, setPostJobMsg] = useState('');
  const [activeJobCount, setActiveJobCount] = useState(0);
  const [pageError, setPageError] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // ── Fetch data on mount ──
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [jobsRes, planRes] = await Promise.all([
          getAllJobsApi(),
          getPlanInfoApi(),
        ]);
        if (jobsRes.status && jobsRes.data) {
          // Keep legacy states for UI rendering
          setActiveJobs(jobsRes.data.active_jobs || []);
          setExpiredJobs(jobsRes.data.expired_jobs || []);

          // Combine active and expired jobs for a single list
          const allJobs = [...(jobsRes.data.active_jobs || []), ...(jobsRes.data.expired_jobs || [])];
          setJobs(allJobs);
          setActiveJobCount(jobsRes.data.active_job_count || 0);

          // Auto-select first active job
          if (allJobs.length > 0) {
            setSelectedJobId(allJobs[0].id);
            loadJobDetail(allJobs[0].id);
          }
        }
        if (planRes.status && planRes.data) {
          setPlanInfo(planRes.data);
        }

        // Check for limit_error from query parameters
        if (router.query.limit_error === 'true') {
          setPostJobMsg('Maximum You can Post 4 Active Jobs. Please purchase a plan.');
          router.replace('/all-post-jobs', undefined, { shallow: true });
        }
      } catch (e: any) {
        console.error('Failed to load data', e);
        setPageError(e.message || 'An error occurred loading the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, router.query]);

  const loadJobDetail = useCallback(async (postId: number) => {
    setSelectedJobId(postId);
    setLoadingDetail(true);
    try {
      const res = await getJobDetailApi(postId);
      if (res.status && res.data) {
        setJobDetail(res.data);
      }
    } catch (e) {
      console.error('Failed to load job detail', e);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // ── Strip HTML tags helper ──
  const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    // Remove HTML tags and decode entities
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // ── Update job status ──
  const handleUpdateStatus = async (jobId: number, newStatus: number) => {
    // If activating (reactivating), check active job count limit. If no active plan, max 4 jobs allowed.
    if (newStatus === 1 && !planInfo?.has_active_plan && activeJobCount >= 4) {
      setLimitError(`Maximum You can Post 4 Active Jobs. Please purchase a plan to post more.`);
      // Scroll sidebar to top so user sees the message
      if (sidebarRef.current) {
        sidebarRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => setLimitError(''), 8000);
      return;
    }

    try {
      const res = await updateJobStatusApi(jobId, newStatus);
      if (res.status) {
        // Update status in-place for all lists so immediate toggling works
        setJobs(prev => prev.map((j: any) => j.id === jobId ? { ...j, active_status: newStatus } : j));
        setActiveJobs(prev => prev.map(j => j.id === jobId ? { ...j, active_status: newStatus } : j));
        setExpiredJobs(prev => prev.map(j => j.id === jobId ? { ...j, active_status: newStatus } : j));

        // Only adjust count correctly
        setActiveJobCount(prev => newStatus === 1 ? prev + 1 : prev - 1);
      } else {
        console.log('Status update response:', res.message);
      }
    } catch (e) {
      console.error('Network error updating status', e);
    }
  };

  const goToPostJob = () => {
    const hasActiveSubscription = planInfo?.has_active_plan && !planInfo?.is_expired && planInfo?.approval_status === 'Accept';
    
    if (!hasActiveSubscription && activeJobCount > 3) {
      setPostJobMsg('Maximum You can Post 4 Active Jobs. Please purchase a plan.');
      return;
    }
    router.push('/post-job');
  };

  const toggleMore = (jobId: number) => {
    setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  if (!user) return null;
  if (loading) return null;

  if (pageError) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#dc3545', fontFamily: 'sans-serif' }}>
        <h2>Internal Server Error</h2>
        <p>{pageError}</p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}>
          Retry
        </button>
      </div>
    );
  }

  // ── Check if candidate button should show (mirrors PHP: show for all non-expired jobs) ──
  const checkJobStatus = (jobStatus: number): boolean => {
    // Only hide for expired (0) and rejected (4) jobs
    return jobStatus !== 0 && jobStatus !== 4;
  };

  // ── Render a single job card ──
  const renderJobCard = (job: Job, isExpiredSection: boolean = false) => {
    const isSelected = selectedJobId === job.id;
    const isActive = job.active_status === 1;
    const isUnderReview = job.active_status === 2;
    const isExpired = job.active_status === 0;
    const isRejected = job.active_status === 4;
    const showCandidateButton = checkJobStatus(job.active_status);

    return (
      <div
        key={job.id}
        className={`${styles.jobCard} ${isSelected ? styles.jobCardSelected : ''}`}
        onClick={() => {
          // Load job detail for all non-expired/non-rejected jobs (active, under review, etc.)
          if (!isExpired && !isRejected) {
            loadJobDetail(job.id);
          }
        }}
        style={{ cursor: (!isExpired && !isRejected) ? 'pointer' : 'default' }}
      >
        <div className={styles.jobCardHeader}>
          <div className={styles.jobTitleWrapper}>
            <h3 className={styles.jobTitle}>{job.job_role_name}</h3>
            <div className={styles.jobDate}>⏱ {job.days_ago}d ago</div>
          </div>
          <div>
            {isExpired && (
              <span className={`${styles.statusBadge} ${styles.badgeExpired}`}>
                <img src={`${IMG}/deactive.png`} alt="" /> Expired
              </span>
            )}
            {isActive && (
              <span className={`${styles.statusBadge} ${styles.badgeActive}`}>
                <img src={`${IMG}/right.png`} alt="" /> Active
              </span>
            )}
            {isUnderReview && (
              <span className={`${styles.statusBadge} ${styles.badgeReview}`}>
                <img src={`${IMG}/deactive.png`} alt="" /> Under Review
              </span>
            )}
          </div>
        </div>

        <div className={styles.jobMeta}>
          <span><img src={`${IMG}/location1.png`} alt="" />{job.job_area ? `${job.job_area}-` : ''}{job.job_city}</span>
          <span><img src={`${IMG}/contact.png`} alt="" />{job.phone_number}</span>
        </div>

        <div className={styles.jobMeta}>
          <span className={styles.highlightInfo}>
            <img src={`${IMG}/rup.png`} alt="" /> Rs. {job.monthly_from} - Rs. {job.monthly_to}
          </span>
          <span className={styles.highlightInfo}>
            <img src={`${IMG}/edu.png`} alt="" /> {job.min_qualification}
          </span>
          <span className={styles.highlightInfo}>
            <img src={`${IMG}/eperiances.png`} alt="" />
            {job.candi_experience === 'Experienced' ? `${job.min_exp}-${job.max_exp} yrs` : ''} {job.candi_experience}
          </span>
          <span className={styles.highlightInfo}>
            <img src={`${IMG}/timing.png`} alt="" /> {job.open_time} - {job.close_time}
          </span>
        </div>

        <div className={styles.jobDescPreview}>
          {expandedJobs[job.id] ? (
            <div className={styles.expandedBox}>
              <div
                dangerouslySetInnerHTML={{ __html: job.job_info_full }}
                style={{ whiteSpace: 'pre-wrap' }}
              />

              {job.skills && (
                <div className={styles.skillsContainer}>
                  <span className={styles.skillLabel}>Skills:</span>
                  {(Array.isArray(job.skills) ? job.skills : (typeof job.skills === 'string' ? (job.skills as string).split(',') : [])).map((skill: any, idx: number) => {
                    const cleanSkill = typeof skill === 'string' ? skill.trim() : '';
                    if (!cleanSkill) return null;
                    return <span key={idx} className={styles.skillTag}>{cleanSkill}</span>;
                  })}
                </div>
              )}

              <button
                className={styles.moreLink}
                onClick={(e) => { e.stopPropagation(); toggleMore(job.id); }}
                style={{ marginTop: '20px', display: 'block', paddingBottom: '5px' }}
              >
                ...less
              </button>
            </div>
          ) : (
            <span>
              {job.job_info_short}{job.job_info_short ? ' ' : ''}
              <button
                className={styles.moreLink}
                onClick={(e) => { e.stopPropagation(); toggleMore(job.id); }}
                style={{ display: 'inline-block' }}
              >
                ...more
              </button>
            </span>
          )}
        </div>

        <div className={styles.jobFooter} onClick={(e) => e.stopPropagation()}>
          {isExpired && planInfo?.approval_status === 'Accept' && (
            <button className={styles.btnReactivate} onClick={() => handleUpdateStatus(job.id, 1)}>
              ↻ Reactivate
            </button>
          )}
          {showCandidateButton && isActive && (
            <button className={styles.btnExpire} onClick={() => handleUpdateStatus(job.id, 0)}>
              ✕ Expire Job
            </button>
          )}
          {job.active_status === 4 && (
            <div className={styles.rejectedJobMessage}>
              <span className={styles.rejectedJobText}>This job post has Rejected Due to</span>
              {job.verification_remark && <span className={styles.rejectedJobReason}>{job.verification_remark.toUpperCase()}</span>}
            </div>
          )}
          {showCandidateButton && (
            <button className={styles.btnCandidateDetail} onClick={() => {
              loadJobDetail(job.id);
              setCandidateView('applied');
              setStatusFilter('All');
              setIsMobileDetailOpen(true);
            }}>
              👥 Candidate Detail
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>All Post Jobs | NetworkBaba</title>
      </Head>

      <div className={styles.pageWrapper}>
        {/* ── Left Sidebar ── */}
        <div className={`${styles.sidebar} ${isMobileDetailOpen ? styles.mobileHidden : ''}`} ref={sidebarRef}>
          {/* Post New Job */}
          <div className={styles.postJobContainer}>
            {planInfo?.approval_status !== 'Reject' && (
              <button className={styles.btnPostJob} onClick={goToPostJob}>
                ➕ Post New Job
              </button>
            )}
            {planInfo?.approval_status === 'Reject' && (
              <div className={styles.rejectedBox}>
                <b style={{ color: '#dc3545', fontSize: 14 }}>
                  Your Account Is Rejected Due To {planInfo.approval_remark}
                </b>
              </div>
            )}
            {postJobMsg && <div className={styles.postJobMsg}>{postJobMsg}</div>}
          </div>

          {/* Plan Status Card */}
          <div className={styles.planCard}>
            {planInfo?.has_active_plan ? (
              <>
                <div className={styles.planRow}>
                  <span className={styles.planLabel}>Active Plan</span>
                  <span className={styles.planName}>{planInfo.package_name}</span>
                </div>
                <div className={styles.planRow}>
                  <span className={styles.planLabel}>Validity</span>
                  <span className={`${styles.planDate} ${planInfo.is_expired ? styles.planDateExpired : styles.planDateActive}`}>
                    {planInfo.expiry_date}
                  </span>
                </div>
                {planInfo.is_expired && (
                  <button className={styles.btnUpgradePlan} onClick={() => router.push('/employer-upgrade-plan')}>Upgrade Plan</button>
                )}
                {planInfo.package_offer && (
                  <div className={styles.planRow}>
                    <span className={styles.planLabel}>Current Offer</span>
                    <span className={styles.planName} style={{ color: '#28a745' }}>{planInfo.package_offer}</span>
                  </div>
                )}
                <div className={styles.planRow}>
                  <span className={styles.planLabel}>Active Jobs Limit</span>
                  <span className={styles.planName} style={{ color: planInfo.used_jobs >= planInfo.total_jobs ? '#dc3545' : '#28a745' }}>
                    {planInfo.total_jobs >= 999 ? 'Unlimited' : `${planInfo.used_jobs} / ${planInfo.total_jobs} Used`}
                  </span>
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #e1e4e8', textAlign: 'center' }}>
                  <button className={styles.upgradeLink} style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => router.push('/employer-upgrade-plan')}>
                    💎 Upgrade Your Plan
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.planRow} style={{ justifyContent: 'center' }}>
                  <span className={styles.planLabel} style={{ color: '#999' }}>No Active Subscription</span>
                </div>
                <div style={{ textAlign: 'center', marginTop: 5 }}>
                  <button onClick={() => router.push('/employer-upgrade-plan')} style={{ fontSize: 13, fontWeight: 600, color: '#007bff', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Upgrade Now</button>
                </div>
              </>
            )}
            {limitError && (
              <div className={styles.limitErrorBox}>
                <strong>{limitError}</strong>
              </div>
            )}
          </div>

          {/* Job Cards - Active */}
          {activeJobs.map(job => renderJobCard(job))}

          {/* Job Cards - Expired */}
          {expiredJobs.map(job => renderJobCard(job, true))}

          {activeJobs.length === 0 && expiredJobs.length === 0 && (
            <div className={styles.emptyState}>
              <p>No jobs posted yet.</p>
              <p>Click "Post New Job" to get started!</p>
            </div>
          )}
        </div>

        {/* ── Right Detail Panel ── */}
        <div className={`${styles.detailPanel} ${!isMobileDetailOpen ? styles.mobileHidden : ''}`}>
          {jobDetail ? (
            <div className={styles.detailContainer}>
              <button
                className={styles.btnBackMobile}
                onClick={() => setIsMobileDetailOpen(false)}
              >
                ← Back to Jobs
              </button>
              {/* Header */}
              <div className={styles.detailHeader}>
                <div>
                  <h1 className={styles.detailJobTitle}>
                    <span style={{ marginRight: '10px' }}>💼</span>
                    {jobDetail.job.job_role_name}
                  </h1>
                </div>
                <div className={styles.detailActions}>
                  <button onClick={() => router.push(`/post-job?edit=${jobDetail.job.id}`)} className={styles.btnAction}>✏️ Edit</button>
                  <button onClick={() => router.push(`/post-job?duplicate=${jobDetail.job.id}`)} className={`${styles.btnAction} ${styles.btnDuplicate}`}>📋 Duplicate</button>
                </div>
              </div>

              {/* Meta Grid */}
              <div className={styles.detailMetaGrid}>
                <div className={styles.metaItem}>
                  <img src={`${IMG}/location1.png`} alt="" />
                  <span>{jobDetail.job.job_area ? `${jobDetail.job.job_area}, ` : ''}{jobDetail.job.job_city}</span>
                </div>
                <div className={styles.metaItem}>
                  <img src={`${IMG}/contact.png`} alt="" />
                  <span>{jobDetail.job.phone_number}</span>
                </div>
                <div className={styles.metaItem}>
                  <img src={`${IMG}/rup.png`} alt="" />
                  <span>Rs. {jobDetail.job.monthly_from} - Rs. {jobDetail.job.monthly_to}</span>
                </div>
                <div className={styles.metaItem}>
                  <img src={`${IMG}/edu.png`} alt="" />
                  <span>{jobDetail.job.min_qualification}</span>
                </div>
                <div className={styles.metaItem}>
                  <img src={`${IMG}/eperiances.png`} alt="" />
                  <span>
                    {jobDetail.job.candi_experience === 'Experienced'
                      ? `${jobDetail.job.min_exp}-${jobDetail.job.max_exp} Yrs`
                      : `Fresher ${jobDetail.job.candi_experience}`}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <img src={`${IMG}/timing.png`} alt="" />
                  <span>{jobDetail.job.open_time} - {jobDetail.job.close_time}</span>
                </div>
              </div>

              {/* Toggle: Applied / Recommended */}
              <div className={styles.toggleGroup}>
                <div
                  className={`${styles.btnToggle} ${styles.btnApplied} ${candidateView === 'applied' ? styles.activeTab : ''}`}
                  onClick={() => { setCandidateView('applied'); setStatusFilter('All'); }}
                  style={{ opacity: candidateView === 'applied' ? 1 : 0.6 }}
                >
                  Applied : {jobDetail.counts.applied}
                </div>
                <div
                  className={`${styles.btnToggle} ${styles.btnRecommended} ${jobDetail.counts.applied < 3 ? styles.btnAnim : ''} ${candidateView === 'recommended' ? styles.activeTab : ''}`}
                  onClick={() => { setCandidateView('recommended'); setStatusFilter('All'); }}
                  style={{ opacity: candidateView === 'recommended' ? 1 : 0.6 }}
                >
                  Recommended : {jobDetail.counts.recommended}
                </div>
              </div>

              {/* Stats Dashboard */}
              <div className={styles.statsDashboard}>
                <div className={styles.statCard} onClick={() => { setCandidateView('applied'); setStatusFilter('All'); }}>
                  <div className={`${styles.statHeader} ${styles.bgAll}`}>All</div>
                  <div className={styles.statBody}>{jobDetail.counts.all}</div>
                </div>
                <div className={styles.statCard} onClick={() => { setCandidateView('applied'); setStatusFilter('New'); }}>
                  <div className={`${styles.statHeader} ${styles.bgNew}`}>New</div>
                  <div className={styles.statBody}>{jobDetail.counts.new}</div>
                </div>
                <div className={styles.statCard} onClick={() => { setCandidateView('applied'); setStatusFilter('Interview Fixed'); }}>
                  <div className={`${styles.statHeader} ${styles.bgInterview}`}>Interview Fixed</div>
                  <div className={styles.statBody}>{jobDetail.counts.interview_fixed}</div>
                </div>
                <div className={styles.statCard} onClick={() => { setCandidateView('applied'); setStatusFilter('Shortlisted'); }}>
                  <div className={`${styles.statHeader} ${styles.bgShortlisted}`}>Shortlisted</div>
                  <div className={styles.statBody}>{jobDetail.counts.shortlisted}</div>
                </div>
                <div className={styles.statCard} onClick={() => { setCandidateView('applied'); setStatusFilter('Hired'); }}>
                  <div className={`${styles.statHeader} ${styles.bgHired}`}>Hired</div>
                  <div className={styles.statBody}>{jobDetail.counts.hired}</div>
                </div>
                <div className={styles.statCard} onClick={() => { setCandidateView('applied'); setStatusFilter('Rejected'); }}>
                  <div className={`${styles.statHeader} ${styles.bgRejected}`}>Rejected</div>
                  <div className={styles.statBody}>{jobDetail.counts.rejected}</div>
                </div>
                <div className={styles.statCard} onClick={() => { setCandidateView('applied'); setStatusFilter('Absent for Interview'); }}>
                  <div className={`${styles.statHeader} ${styles.bgAbsent}`}>Absent For Interview</div>
                  <div className={styles.statBody}>{jobDetail.counts.absent_for_interview}</div>
                </div>
              </div>

              {/* Candidate List Area */}
              <div style={{ marginTop: '10px' }}>
                <div className={styles.listHeader}>
                  <span style={{ fontSize: '18px' }}>👥</span>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Showing <strong>&nbsp;{candidateView === 'applied' ? (statusFilter !== 'All' ? `${statusFilter} Applied` : 'Applied') : 'Recommended'}</strong>&nbsp;candidates...
                  </span>
                </div>

                <CandidateListView
                  postId={jobDetail.job.id}
                  viewMode={candidateView}
                  statusFilter={statusFilter}
                  isPlanActive={planInfo ? (planInfo.has_active_plan && !planInfo.is_expired && planInfo.approval_status === 'Accept') : false}
                  jobStatus={jobDetail.job.active_status}
                  onLoadingChange={setCandidateListLoading}
                />
              </div>

            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <p>Select a job to view candidate details</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}















