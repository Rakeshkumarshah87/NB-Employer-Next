import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { getAllJobsApi, getPlanInfoApi, updateJobStatusApi, getJobDetailApi, getCandidatesApplied, getCandidatesRecommended } from '@/services/api';
import styles from '@/styles/allPostJobs.module.css';

const IMG = '/nt/images/icon';

// --- CANDIDATE LIST VIEW COMPONENT ---
const CandidateListView = ({ postId, viewMode, statusFilter, isPlanActive, jobStatus }: { postId: number, viewMode: 'applied'|'recommended', statusFilter: string, isPlanActive: boolean, jobStatus?: number }) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadCandidates = useCallback(async (reset: boolean = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      if (reset) {
        setLoading(true);
        setError('');
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
    } catch (e: any) {
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

  if (loading && offset === 0) {
    return <div style={{ textAlign: 'center', padding: 60 }}><div className={styles.spinner}></div></div>;
  }
  if (error) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'red' }}>{error}</div>;
  }
  if (candidates.length === 0) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#666', background: '#f8f9fa', borderRadius: 8 }}>No candidates found for this selection.</div>;
  }

  return (
    <div style={{ marginTop: 20 }}>
      {candidates.map((c, idx) => (
        <div key={idx} className={styles.candidateCard}>
          {viewMode === 'applied' && <span className={styles.newCandidatePill}>New Candidate</span>}
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
                📍 {c.location} {c.recommended_status === 1 && <span className={styles.recommendedBadge}>Recommended</span>}
              </div>
              <div className={styles.candidateMeta}>
                <div><strong>Experience:</strong><br/>{c.experience}</div>
                <div><strong>Education:</strong><br/>{c.qualification}</div>
                {viewMode === 'applied' && <div><strong>Applied On:</strong><br/>{c.apply_date}</div>}
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
                {isPlanActive ? (
                  <>
                    <button onClick={() => alert('Mobile: ' + c.contact_number)} style={{ background: '#007bff', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>📞 Show Number</button>
                    <a href={`https://wa.me/91${(c.contact_number || '').slice(-10)}`} target="_blank" style={{ textDecoration: 'none' }}>
                      <button style={{ background: '#28a745', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>💬 WhatsApp</button>
                    </a>
                    <button style={{ background: '#fff', color: '#007bff', border: '1px solid #007bff', padding: '8px 15px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>View Profile</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => router.push('/employer-upgrade-plan')} style={{ background: '#007bff', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>🔒 Show Number</button>
                    <button onClick={() => router.push('/employer-upgrade-plan')} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>🔒 WhatsApp</button>
                  </>
                )}
              </div>
              
              <select className={styles.candidateSelect}>
                <option value="">Update Status</option>
                <option value="Interview Fixed">Interview Fixed</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
                <option value="Absent for Interview">Absent for Interview</option>
              </select>
            </>
          )}

          {viewMode === 'applied' && c.status && (
            <div style={{ marginTop: 15, background: '#fffdfd', border: '1px solid #e1cdcd', padding: '8px', borderRadius: 4, fontSize: 13 }}>
              <b style={{ color: '#ff7600' }}>{c.review} ★</b> | <strong>{c.status}</strong> | <i>{c.remark}</i>
            </div>
          )}
        </div>
      ))}
      
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 15 }}>
          <button onClick={() => loadCandidates(false)} disabled={loading} style={{ padding: '8px 20px', background: '#343a40', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {loading ? 'Loading...' : 'Load More Candidates'}
          </button>
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

  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [expiredJobs, setExpiredJobs] = useState<Job[]>([]);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [limitError, setLimitError] = useState('');
  const [postJobMsg, setPostJobMsg] = useState('');
  const [activeJobCount, setActiveJobCount] = useState(0);
  const [candidateView, setCandidateView] = useState<'applied' | 'recommended'>('applied');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [pageError, setPageError] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

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
          setActiveJobs(jobsRes.data.active_jobs || []);
          setExpiredJobs(jobsRes.data.expired_jobs || []);
          setActiveJobCount(jobsRes.data.active_job_count || 0);

          // Auto-select first active job
          const allJobs = jobsRes.data.active_jobs || [];
          if (allJobs.length > 0) {
            setSelectedJobId(allJobs[0].id);
            loadJobDetail(allJobs[0].id);
          }
        }
        if (planRes.status && planRes.data) {
          setPlanInfo(planRes.data);
        }
      } catch (e: any) {
        console.error('Failed to load data', e);
        setPageError(e.message || 'An error occurred loading the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const loadJobDetail = useCallback(async (postId: number) => {
    setSelectedJobId(postId);
    try {
      const res = await getJobDetailApi(postId);
      if (res.status && res.data) {
        setJobDetail(res.data);
      }
    } catch (e) {
      console.error('Failed to load job detail', e);
    }
  }, []);

  // ── Update job status ──
  const handleUpdateStatus = async (postId: number, newStatus: number) => {
    // If activating, check plan limits
    if (newStatus === 1 && planInfo && planInfo.can_post_job === 0) {
      setLimitError('⚠️ Limit Reached! Cannot reactivate. You have hit your active job limit. Expire a job or upgrade.');
      setTimeout(() => setLimitError(''), 5000);
      return;
    }

    try {
      const res = await updateJobStatusApi(postId, newStatus);
      if (res.status) {
        // Update local state
        if (newStatus === 0) {
          // Move from active to expired
          const job = activeJobs.find(j => j.id === postId);
          if (job) {
            setActiveJobs(prev => prev.map(j => j.id === postId ? { ...j, active_status: 0 } : j));
            setExpiredJobs(prev => [{ ...job, active_status: 0 }, ...prev]);
            setActiveJobCount(prev => prev - 1);
          }
        } else {
          // Reactivate
          const job = expiredJobs.find(j => j.id === postId);
          if (job) {
            setExpiredJobs(prev => prev.filter(j => j.id !== postId));
            setActiveJobs(prev => [{ ...job, active_status: 1 }, ...prev]);
            setActiveJobCount(prev => prev + 1);
          } else {
            // Was in active list but status 0
            setActiveJobs(prev => prev.map(j => j.id === postId ? { ...j, active_status: 1 } : j));
            setActiveJobCount(prev => prev + 1);
          }
        }
      } else {
        alert(res.message || 'Failed to update status');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const goToPostJob = () => {
    if (planInfo && planInfo.can_post_job === 0) {
      setLimitError('⚠️ Limit Reached! You have used all active jobs. Please expire a job or upgrade your plan to post more.');
      setTimeout(() => setLimitError(''), 5000);
      return;
    }
    if (activeJobCount > 3) {
      setPostJobMsg('Maximum You can Post 4 Active Jobs');
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

  // ── Render a single job card ──
  const renderJobCard = (job: Job, isExpiredSection: boolean = false) => {
    const isSelected = selectedJobId === job.id;
    const isActive = job.active_status === 1;
    const isUnderReview = job.active_status === 2;
    const isExpired = job.active_status === 0;

    return (
      <div
        key={job.id}
        className={`${styles.jobCard} ${isSelected ? styles.jobCardSelected : ''}`}
        onClick={() => loadJobDetail(job.id)}
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
          {expandedJobs[job.id] ? job.job_info_full : job.job_info_short}
          {job.has_more && (
            <button className={styles.moreLink} onClick={(e) => { e.stopPropagation(); toggleMore(job.id); }}>
              {expandedJobs[job.id] ? '...less' : '...more'}
            </button>
          )}
        </div>

        <div className={styles.jobFooter} onClick={(e) => e.stopPropagation()}>
          {isExpired && planInfo?.approval_status === 'Accept' && (
            <button className={styles.btnReactivate} onClick={() => handleUpdateStatus(job.id, 1)}>
              ↻ Reactivate
            </button>
          )}
          {isActive && (
            <button className={styles.btnExpire} onClick={() => handleUpdateStatus(job.id, 0)}>
              ✕ Expire Job
            </button>
          )}
          {job.active_status === 4 && job.verification_remark && (
            <span className={styles.rejectedRemark}>
              Rejected: {job.verification_remark.toUpperCase()}
            </span>
          )}
          <button className={styles.btnCandidateDetail} onClick={() => { 
            loadJobDetail(job.id); 
            setCandidateView('applied'); 
            setStatusFilter('All');
            setIsMobileDetailOpen(true); 
          }}>
            👥 Candidate Detail
          </button>
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
        <div className={`${styles.sidebar} ${isMobileDetailOpen ? styles.mobileHidden : ''}`}>
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
                    {planInfo.used_jobs} / {planInfo.total_jobs} Used
                  </span>
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #e1e4e8', textAlign: 'center' }}>
                  <button className={styles.upgradeLink} style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => router.push('/employer-upgrade-plan')}>
                    💎 Upgrade Your Plan
                  </button>
                </div>
                {limitError && (
                  <div className={styles.limitErrorBox}>
                    <strong>{limitError}</strong>
                  </div>
                )}
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
                  <h1 className={styles.detailJobTitle}>{jobDetail.job.job_role_name}</h1>
                </div>
                <div className={styles.detailActions}>
                  <button className={styles.btnAction}>✏️ Edit</button>
                  <button className={`${styles.btnAction} ${styles.btnDuplicate}`}>📋 Duplicate</button>
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
                  <span>
                    Showing <strong>{candidateView === 'applied' ? (statusFilter !== 'All' ? `${statusFilter} Applied` : 'Applied') : 'Recommended'}</strong> candidates...
                  </span>
                </div>
                
                <CandidateListView 
                  postId={jobDetail.job.id} 
                  viewMode={candidateView} 
                  statusFilter={statusFilter}
                  isPlanActive={planInfo ? (planInfo.has_active_plan && !planInfo.is_expired && planInfo.approval_status === 'Accept') : false} 
                  jobStatus={jobDetail.job.active_status}
                />
              </div>

            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <p>Select a job to view candidate details</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
