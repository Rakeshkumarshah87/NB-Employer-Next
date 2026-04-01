import { useState, useEffect, type FormEvent, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { postJobApi, searchJobRolesApi, getJobDetailApi, updateJobApi, getJobCategoriesApi, getAllJobsApi, getPlanInfoApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import JobStepper from '@/components/JobStepper';
import styles from '@/styles/postjob.module.css';

/**
 * Default descriptions for common job roles
 */
const DEFAULT_JOB_DESCRIPTIONS: Record<string, string> = {
  "DEVELOPER": "Responsible for designing, developing, and maintaining high-quality software applications. Writing clean, efficient code and collaborating with the team to deliver scalable technical solutions.",
  "SOFTWARE": "Designing and developing software systems. Focusing on performance, security, and user experience to meet business objectives.",
  "BACK OFFICE": "Handling administrative tasks, data entry, managing office records, and providing clerical support to ensure smooth business operations.",
  "SALES": "Driving growth by identifying new business opportunities, meeting targets, and maintaining strong relationships with clients.",
  "DATA ENTRY": "Accurately entering and updating company data into databases. Ensuring high levels of speed and data integrity.",
  "DELIVERY": "Efficiently delivering orders to customers on time while maintaining safety standards and providing helpful customer service.",
  "DRIVER": "Safely transporting passengers or goods to various locations. Maintaining the vehicle and following all traffic regulations strictly.",
  "ACCOUNTANT": "Managing financial records, preparing tax returns, and ensuring compliance with financial regulations and company policy.",
  "RECEPTIONIST": "Greeting visitors, managing phone calls, and providing professional front-desk support to ensure a positive company image.",
  "MARKETING": "Developing marketing strategies, analyzing market trends, and promoting company products to increase brand visibility.",
  "TEACHER": "Planning and delivering high-quality education. Assessing progress and creating a positive learning environment.",
  "MANAGER": "Leading team operations, setting goals, and ensuring all department objectives are met with high efficiency and quality.",
  "SECURITY": "Maintaining a safe and secure environment for customers and employees by patrolling and monitoring premises.",
  "COOK": "Preparing delicious meals according to menu specifications. Maintaining kitchen cleanliness and food safety standards.",
  "HR": "Managing recruitment, employee relations, and administrative tasks related to human resources management.",
  "NURSE": "Providing high-quality patient care and support. Working closely with the medical team to ensure patient health and recovery."
};

const AUTO_DESC_HEADER = "We are looking for a dedicated";

/**
 * Smart descriptive generator based on keywords or dynamic template
 */
const getAutoDescription = (title: string): string => {
  const normalized = title.toUpperCase().trim();
  if (!normalized || normalized.length < 3) return "";

  // 1. Keyword matching (More specific matches first in later logic, or just simple check)
  for (const key in DEFAULT_JOB_DESCRIPTIONS) {
    if (normalized.includes(key)) return DEFAULT_JOB_DESCRIPTIONS[key];
  }

  // 2. Generic Professional Template for any of 10,000+ titles
  const titleLower = title.trim();
  return `${AUTO_DESC_HEADER} ${titleLower} to join our professional team. The ideal candidate will be responsible for the daily tasks and responsibilities associated with this role, ensuring high efficiency, quality service, and strict adherence to company standards. Candidate should be hardworking and reliable for the ${titleLower} position.`;
};

/**
 * Post Free Job Page
 * Replicates the live networkbaba.co/post-free-jobs/add/ form
 * Auth-gated: redirects to /login if not authenticated
 */
export default function PostJobPage() {
  const router = useRouter();

  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  // ── Form State: Basic Job Details ─────────────
  const [jobTitle, setJobTitle] = useState('');
  const [jobCategoryId, setJobCategoryId] = useState<number>(0);
  const [categories, setCategories] = useState<Array<{ id: number, name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: number, job_category_id: number, name: string }>>([]);
  const [showRolesDropdown, setShowRolesDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [monthlyFrom, setMonthlyFrom] = useState('');
  const [monthlyTo, setMonthlyTo] = useState('');
  const [noOfOpenings, setNoOfOpenings] = useState('');
  const [workingDays, setWorkingDays] = useState('Monday to Saturday');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:30');
  const [shift, setShift] = useState('');
  const [jobType, setJobType] = useState('Full Time');
  const [categoryType, setCategoryType] = useState('Job');
  const [workFromHome, setWorkFromHome] = useState(false);

  // ── Form State: Candidate Requirements ────────
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [minExp, setMinExp] = useState('');
  const [maxExp, setMaxExp] = useState('');
  const [gender, setGender] = useState('');
  const [english, setEnglish] = useState('');

  // ── Form State: Job Description ───────────────
  const [jobDescription, setJobDescription] = useState('');

  // ── UI State ──────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [dataFetching, setDataFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const editId = router.query.edit ? Number(router.query.edit) : null;
  const duplicateId = router.query.duplicate ? Number(router.query.duplicate) : null;
  const isEdit = !!editId;
  const isDuplicate = !!duplicateId;

  // ── Global Limit Enforcer for New Jobs ──────────
  useEffect(() => {
    if (!user || isEdit || isDuplicate) return;

    const enforceLimit = async () => {
      try {
        const [jobsRes, planRes] = await Promise.all([
          getAllJobsApi(),
          getPlanInfoApi()
        ]);
        const activeJobCount = jobsRes?.data?.active_job_count || 0;
        const hasPlan = planRes?.data?.has_active_plan;
        const isExpired = planRes?.data?.is_expired;
        const approval = planRes?.data?.approval_status;

        const hasActiveSubscription = hasPlan && !isExpired && approval === 'Accept';

        if (!hasActiveSubscription && activeJobCount > 3) {
          router.replace('/all-post-jobs?limit_error=true');
        }
      } catch (err) {
        // Ignored
      }
    };
    enforceLimit();
  }, [user, isEdit, isDuplicate, router]);

  // ── Fetch existing job for edit/duplicate ──────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getJobCategoriesApi();
        if (res.status && res.data) {
          setCategories(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const jobID = editId || duplicateId;
    if (jobID && !loading && user) {
      const fetchJobData = async () => {
        setDataFetching(true);
        try {
          const res = await getJobDetailApi(jobID);
          if (res.status && res.data && res.data.job) {
            const j = res.data.job;

            // Set this FIRST so useEffect for title search doesn't wipe category
            setIsSelecting(true);

            setJobTitle(j.job_role_name || '');
            setJobCategoryId(Number(j.job_category_id) || 0);
            setMonthlyFrom(j.monthly_from?.toString() || '');
            setMonthlyTo(j.monthly_to?.toString() || '');
            setNoOfOpenings(j.no_of_openings?.toString() || '');
            setWorkingDays(j.working_days || 'Monday to Saturday');
            setOpenTime(j.open_time?.substring(0, 5) || '09:00');
            setCloseTime(j.close_time?.substring(0, 5) || '18:30');
            setShift(j.shift || '');
            setJobType(j.job_type || 'Full Time');
            setCategoryType(j.category_type || 'Job');
            // Normalize Boolean Status
            setWorkFromHome(Number(j.work_from_home_status) === 1);

            // Normalize Qualification (DB might have "10th Pass or Above")
            const normalizeChip = (val: string, options: string[]) => {
              if (!val) return '';
              const found = options.find(opt => opt.toLowerCase() === val.toLowerCase() || val.toLowerCase().includes(opt.toLowerCase()));
              return found || val;
            };

            setQualification(normalizeChip(j.min_qualification, ['Below 10th', '10th Pass', '12th Pass', 'Graduate', 'Master Degree']));
            setExperience(normalizeChip(j.candi_experience, ['Fresher', 'Experienced']));
            setGender(normalizeChip(j.gen_preference, ['Both', 'Male', 'Female']));
            setEnglish(normalizeChip(j.eng_required, ['No English', 'Little English', 'Good English', 'Fluent English']));
            setShift(normalizeChip(j.shift, ['Days Shift', 'Night Shift', 'Rotation Shift']));
            setJobType(normalizeChip(j.job_type, ['Full Time', 'Part Time']));
            setCategoryType(normalizeChip(j.category_type, ['Job', 'Internship']));

            setMinExp(j.min_exp?.toString() || '');
            setMaxExp(j.max_exp?.toString() || '');

            // Clean HTML tags for textarea if needed
            let cleanDesc = j.job_info || '';
            cleanDesc = cleanDesc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            cleanDesc = cleanDesc.replace(/<\/?[^>]+(>|$)/g, ""); // Remove tags for plain textarea
            setJobDescription(cleanDesc);

            // Critical: Set isSelecting to true during fetch to prevent the lookup useEffect from resetting category
            setIsSelecting(true);
          } else {
            setError(res.message || 'Failed to load job details');
          }
        } catch (err) {
          setError('Network error fetching job details');
        } finally {
          setDataFetching(false);
        }
      };
      fetchJobData();
    }
  }, [editId, duplicateId, user, loading]);



  // ── Handling Autocomplete ──────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowRolesDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (isSelecting) {
      setIsSelecting(false);
      return;
    }
    setJobCategoryId(0); // Reset category if user types a new title freely

    const fetchRoles = async () => {
      if (!jobTitle.trim() || jobTitle.length < 2) {
        setRoles([]);
        setShowRolesDropdown(false);
        return;
      }

      try {
        const res = await searchJobRolesApi(jobTitle);
        if (res.status && res.data && res.data.length > 0) {
          setRoles(res.data);
          setShowRolesDropdown(true);
        } else {
          setRoles([]);
          setShowRolesDropdown(false);
        }
      } catch (e) {
        console.error("Failed to fetch roles", e);
      }
    };
    const timeoutId = setTimeout(fetchRoles, 300);
    return () => clearTimeout(timeoutId);
  }, [jobTitle]);

  const handleRoleSelect = (role: { id: number; job_category_id: number; name: string }) => {
    setIsSelecting(true);
    setJobTitle(role.name);
    setJobCategoryId(role.job_category_id);
    setShowRolesDropdown(false);

    // Auto-populate description if currently empty or just a previously auto-generated one
    // We allow overwrite if the description is empty OR it's one of our auto-templates
    const currentDesc = jobDescription.trim();
    const isAutoGenerated = currentDesc.startsWith(AUTO_DESC_HEADER) || Object.values(DEFAULT_JOB_DESCRIPTIONS).includes(currentDesc);

    if (!currentDesc || isAutoGenerated) {
      setJobDescription(getAutoDescription(role.name));
    }
  };

  const handleTitleBlur = () => {
    const currentDesc = jobDescription.trim();
    const isAutoGenerated = currentDesc.startsWith(AUTO_DESC_HEADER) || Object.values(DEFAULT_JOB_DESCRIPTIONS).includes(currentDesc);

    if (!currentDesc || isAutoGenerated) {
      setJobDescription(getAutoDescription(jobTitle));
    }
    // Give small delay for dropdown click if needed
    setTimeout(() => setShowRolesDropdown(false), 200);
  };

  // ── Validation ────────────────────────────────
  const validate = (): string | null => {
    if (!jobTitle.trim()) return 'Please enter the Job Title';
    if (!jobCategoryId) return 'Please select a Job Title from the suggestions or choose a Job Category directly';
    if (!monthlyFrom.trim()) return 'Please enter minimum salary';
    if (!monthlyTo.trim()) return 'Please enter maximum salary';
    if (!noOfOpenings.trim()) return 'Please enter No. of Openings';
    if (Number(noOfOpenings) === 0) return 'No. of Openings cannot be 0';
    if (!shift) return 'Please select the Shift';
    if (!jobType) return 'Please select the Job Type';
    if (!qualification) return 'Please select the Minimum Qualification';
    if (!experience) return 'Please select the Experience Level';
    if (experience === 'Experienced' && (minExp === '' || minExp === null))
      return 'Please enter minimum experience years';
    if (!gender) return 'Please select the Gender Preference';
    if (!english) return 'Please select the English Requirement';
    return null;
  };

  // ── Submit ────────────────────────────────────
  const saveAndNavigate = async (targetStep?: number) => {
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        job_category_id: jobCategoryId,
        job_role_name: jobTitle.trim().toUpperCase(),
        monthly_from: monthlyFrom,
        monthly_to: monthlyTo,
        no_of_openings: noOfOpenings,
        working_days: workingDays,
        open_time: openTime,
        close_time: closeTime,
        shift,
        job_type: jobType,
        category_type: categoryType,
        work_from_home_status: workFromHome ? 1 : 0,
        qualification_data: qualification,
        experience_data: experience,
        min_exp: experience === 'Experienced' ? Number(minExp) : 0,
        max_exp: experience === 'Experienced' ? Number(maxExp) : 0,
        gender_data: gender,
        english_data: english,
        job_info: jobDescription,
      };

      const response = isEdit
        ? await updateJobApi(editId!, payload)
        : await postJobApi(payload);

      if (response.status) {
        // Redirect to next step: Candidate Requirements
        const jobId = isEdit ? editId : response.data?.job_id;
        if (jobId) {
          if (targetStep === 1) router.push(`/post-job?edit=${jobId}`);
          else if (targetStep === 2) router.push(`/candidate-requirements/${jobId}`);
          else if (targetStep === 3) router.push(`/employer-company-info/${jobId}`);
          else if (targetStep === 4) router.push(`/employer-job-reviews/${jobId}`);
          else router.push(`/candidate-requirements/${jobId}`);
        } else {
          setSuccess(isEdit ? 'Job updated successfully! 🎉' : 'Job posted successfully! 🎉');
        }
      } else {
        setError(response.message || 'Failed to save job. Please try again.');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveAndNavigate();
  };

  const handleStepClick = (stepId: number) => {
    if (stepId === 1) return;
    saveAndNavigate(stepId);
  };

  // ── Chip helper ───────────────────────────────
  const chipClass = (isActive: boolean) =>
    `${styles.chipBtn} ${isActive ? styles.chipBtnActive : ''}`;

  // ── Time Helpers (24h <-> 12h for Dropdowns) ──
  const generateTimeOptions = () => {
    const opts = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        const hStr = h12.toString().padStart(2, '0');
        const mStr = m.toString().padStart(2, '0');
        const display = `${hStr}:${mStr} ${period}`;
        const value = `${h.toString().padStart(2, '0')}:${mStr}`;
        opts.push({ display, value });
      }
    }
    return opts;
  };

  const timeOptions = generateTimeOptions();

  // ── Get user initials ─────────────────────────
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <>
      <Head>
        <title>Post Free Job | NetworkBaba</title>
        <meta
          name="description"
          content="Post free job listings and reach thousands of candidates in minutes. NetworkBaba employer dashboard."
        />
      </Head>

      <div className={styles.pageWrapper}>
        {/* ═══════════ HEADER ═══════════ */}


        {/* ═══════════ PAGE TITLE ═══════════ */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <h1 className={styles.pageTitleMain}>
              {isEdit ? 'Edit job' : isDuplicate ? 'Duplicate job' : 'Post a new job'}
            </h1>
          </div>
        </div>

        {dataFetching && (
          <div className={styles.card} style={{ textAlign: 'center', padding: '40px' }}>
            <span className={styles.spinner} style={{ borderColor: '#2d6eb5', borderTopColor: 'transparent', width: '30px', height: '30px' }} />
            <p style={{ marginTop: '10px', color: '#666' }}>Fetching job details...</p>
          </div>
        )}

        <div className={`${styles.mainContainer} ${dataFetching ? styles.hidden : ''}`} style={dataFetching ? { display: 'none' } : {}}>
          <JobStepper currentStep={1} onStepClick={handleStepClick} />
          <form onSubmit={handleSubmit} noValidate>

            {/* ── SECTION 1: Basic Job Details ── */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.cardTitleIcon}>💼</span>
                Basic Job Details
              </div>

              <div className={styles.formGrid}>
                {/* Job Title - full width */}
                <div className={`${styles.formGroup} ${styles.span2}`} ref={wrapperRef} style={{ position: 'relative' }}>
                  <label className={`${styles.formLabel} ${styles.required}`} htmlFor="job_title">
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="job_title"
                    className={styles.formInput}
                    placeholder="E.G. SOFTWARE DEVELOPER"
                    style={{ textTransform: 'uppercase' }}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    onFocus={() => { if (roles.length > 0) setShowRolesDropdown(true); }}
                    onBlur={handleTitleBlur}
                    required
                    disabled={loading}
                    autoComplete="off"
                  />
                  {showRolesDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}>
                      {roles.map(role => (
                        <div
                          key={role.id}
                          onClick={() => handleRoleSelect(role)}
                          style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#374151', textTransform: 'uppercase' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {role.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Job Category Dropdown (Fallback) */}
                {jobTitle.trim().length > 0 && !showRolesDropdown && (!jobCategoryId || jobCategoryId === 0 || roles.length === 0) && (
                  <div className={`${styles.formGroup} ${styles.span2}`}>
                    <label className={`${styles.formLabel} ${styles.required}`} htmlFor="job_category">
                      Job Category
                    </label>
                    <select
                      id="job_category"
                      className={styles.formInput}
                      value={jobCategoryId}
                      onChange={(e) => setJobCategoryId(Number(e.target.value))}
                      required
                      disabled={loading}
                    >
                      <option value={0}>---- Select Category ----</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Monthly Salary */}
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.required}`}>
                    Monthly Salary (In-Hand)
                  </label>
                  <div className={styles.inputFlex}>
                    <input
                      type="number"
                      id="monthly_from"
                      className={styles.formInput}
                      placeholder="Min"
                      value={monthlyFrom}
                      onChange={(e) => setMonthlyFrom(e.target.value)}
                      min="0"
                      required
                      disabled={loading}
                    />
                    <span>to</span>
                    <input
                      type="number"
                      id="monthly_to"
                      className={styles.formInput}
                      placeholder="Max"
                      value={monthlyTo}
                      onChange={(e) => setMonthlyTo(e.target.value)}
                      min="0"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* No. of Openings */}
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.required}`} htmlFor="no_of_openings">
                    No. of Openings
                  </label>
                  <input
                    type="number"
                    id="no_of_openings"
                    className={styles.formInput}
                    placeholder="e.g. 5"
                    value={noOfOpenings}
                    onChange={(e) => setNoOfOpenings(e.target.value)}
                    min="1"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Working Days */}
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.required}`} htmlFor="working_days">
                    Working Days
                  </label>
                  <select
                    id="working_days"
                    className={styles.formInput}
                    value={workingDays}
                    onChange={(e) => setWorkingDays(e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="Monday to Saturday">Monday to Saturday</option>
                    <option value="Monday to Friday">Monday to Friday</option>
                    <option value="Full Week">Full Week</option>
                  </select>
                </div>

                {/* Working Time (12h format dropdowns) */}
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.required}`}>
                    Working Time
                  </label>
                  <div className={styles.inputFlex}>
                    <select
                      className={styles.formInput}
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      required
                      disabled={loading}
                    >
                      {timeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.display}</option>
                      ))}
                    </select>
                    <span>-</span>
                    <select
                      className={styles.formInput}
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      required
                      disabled={loading}
                    >
                      {timeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.display}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Shift - chips */}
                <div className={`${styles.formGroup} ${styles.span2}`}>
                  <label className={`${styles.formLabel} ${styles.required}`}>Shift</label>
                  <div className={styles.chipsWrapper}>
                    {['Days Shift', 'Night Shift', 'Rotation Shift'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={chipClass(shift === val)}
                        onClick={() => setShift(val)}
                        disabled={loading}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Job Type - chips */}
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.required}`}>Job Type</label>
                  <div className={styles.chipsWrapper}>
                    {['Full Time', 'Part Time'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={chipClass(jobType === val)}
                        onClick={() => setJobType(val)}
                        disabled={loading}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hiring For - chips */}
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.required}`}>Hiring For</label>
                  <div className={styles.chipsWrapper}>
                    {[
                      { label: 'Regular Job', value: 'Job' },
                      { label: 'Internship', value: 'Internship' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={chipClass(categoryType === item.value)}
                        onClick={() => setCategoryType(item.value)}
                        disabled={loading}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* WFH Checkbox - full width */}
                <div className={`${styles.formGroup} ${styles.span2}`}>
                  <label className={styles.wfhBox}>
                    <input
                      type="checkbox"
                      id="work_from_home_status"
                      checked={workFromHome}
                      onChange={(e) => setWorkFromHome(e.target.checked)}
                      disabled={loading}
                    />
                    <span>
                      This job allows <b>Work From Home</b> option.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Candidate Requirements ── */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.cardTitleIcon}>📋</span>
                Candidate Requirements
              </div>

              <div className={styles.formGrid}>
                {/* Minimum Qualification */}
                <div className={`${styles.formGroup} ${styles.span2}`}>
                  <label className={`${styles.formLabel} ${styles.required}`}>
                    Minimum Qualification
                  </label>
                  <div className={styles.chipsWrapper}>
                    {['Below 10th', '10th Pass', '12th Pass', 'Graduate', 'Master Degree'].map(
                      (val) => (
                        <button
                          key={val}
                          type="button"
                          className={chipClass(qualification === val)}
                          onClick={() => setQualification(val)}
                          disabled={loading}
                        >
                          {val}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Experience Level */}
                <div className={`${styles.formGroup} ${styles.span2}`}>
                  <label className={`${styles.formLabel} ${styles.required}`}>
                    Experience Level
                  </label>
                  <div className={styles.chipsWrapper}>
                    {['Fresher', 'Experienced'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={chipClass(experience === val)}
                        onClick={() => {
                          setExperience(val);
                          if (val === 'Fresher') {
                            setMinExp('0');
                            setMaxExp('0');
                          } else {
                            setMinExp('');
                            setMaxExp('');
                          }
                        }}
                        disabled={loading}
                      >
                        {val}
                      </button>
                    ))}
                  </div>

                  {experience === 'Experienced' && (
                    <div className={styles.expRange}>
                      <div className={styles.inputFlex}>
                        <input
                          type="number"
                          id="min_exp"
                          className={styles.formInput}
                          placeholder="Min Years"
                          value={minExp}
                          onChange={(e) => setMinExp(e.target.value)}
                          min="0"
                          disabled={loading}
                        />
                        <span>-</span>
                        <input
                          type="number"
                          id="max_exp"
                          className={styles.formInput}
                          placeholder="Max Years"
                          value={maxExp}
                          onChange={(e) => setMaxExp(e.target.value)}
                          min="0"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Gender Preference */}
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.required}`}>
                    Gender Preference
                  </label>
                  <div className={styles.chipsWrapper}>
                    {['Both', 'Male', 'Female'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={chipClass(gender === val)}
                        onClick={() => setGender(val)}
                        disabled={loading}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* English Fluency */}
                <div className={`${styles.formGroup} ${styles.span2}`}>
                  <label className={`${styles.formLabel} ${styles.required}`}>
                    English Fluency
                  </label>
                  <div className={styles.chipsWrapper}>
                    {[
                      'No English',
                      'Little English',
                      'Good English',
                      'Fluent English',
                    ].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={chipClass(english === val)}
                        onClick={() => setEnglish(val)}
                        disabled={loading}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 3: Job Description ── */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.cardTitleIcon}>📝</span>
                Job Description
              </div>

              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.span2}`}>
                  <label className={styles.formLabel} htmlFor="job_description">
                    Job Description / Additional Info
                  </label>
                  <textarea
                    id="job_description"
                    className={styles.formTextarea}
                    placeholder="Describe the job role, responsibilities, perks, etc."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* ── Submit ── */}
            <div className={styles.submitArea}>
              {error && <div className={styles.errorMsg}>{error}</div>}
              {success && <div className={styles.successMsg}>{success}</div>}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
                id="submit-post-job-btn"
              >
                {loading && <span className={styles.spinner} />}
                {loading ? (isEdit ? 'Updating Job...' : 'Posting Job...') : (isEdit ? 'Update & Continue →' : 'Save & Continue →')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
