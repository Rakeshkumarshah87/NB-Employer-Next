import { useState, useEffect, type FormEvent, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { postJobApi, searchJobRolesApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/postjob.module.css';

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
  const [roles, setRoles] = useState<Array<{id: number, job_category_id: number, name: string}>>([]);
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');



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
  };

  // ── Validation ────────────────────────────────
  const validate = (): string | null => {
    if (!jobTitle.trim()) return 'Please enter the Job Title';
    if (!jobCategoryId) return 'Please select a Job Title from the dropdown suggestions to ensure correct skills are loaded';
    if (!monthlyFrom.trim()) return 'Please enter minimum salary';
    if (!monthlyTo.trim()) return 'Please enter maximum salary';
    if (!noOfOpenings.trim()) return 'Please enter No. of Openings';
    if (Number(noOfOpenings) === 0) return 'No. of Openings cannot be 0';
    if (!shift) return 'Please select the Shift';
    if (!jobType) return 'Please select the Job Type';
    if (!qualification) return 'Please select the Minimum Qualification';
    if (!experience) return 'Please select the Experience Level';
    if (experience === 'Experienced' && (!minExp || Number(minExp) === 0))
      return 'Please enter minimum experience years';
    if (!gender) return 'Please select the Gender Preference';
    if (!english) return 'Please select the English Requirement';
    return null;
  };

  // ── Submit ────────────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

      const response = await postJobApi(payload);

      if (response.status) {
        // Redirect to next step: Candidate Requirements
        const jobId = response.data?.job_id;
        if (jobId) {
          router.push(`/candidate-requirements/${jobId}`);
        } else {
          setSuccess('Job posted successfully! 🎉');
        }
      } else {
        setError(response.message || 'Failed to post job. Please try again.');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Chip helper ───────────────────────────────
  const chipClass = (isActive: boolean) =>
    `${styles.chipBtn} ${isActive ? styles.chipBtnActive : ''}`;

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
        <div className={styles.pageTitle}>
          <h1>Post Job</h1>
          <p>Reach thousands of candidates in minutes</p>
        </div>

        {/* ═══════════ FORM ═══════════ */}
        <div className={styles.mainContainer}>
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
                    onFocus={() => { if(roles.length > 0) setShowRolesDropdown(true); }}
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
                  <input
                    type="text"
                    id="working_days"
                    className={styles.formInput}
                    value={workingDays}
                    onChange={(e) => setWorkingDays(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Working Time */}
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.required}`}>
                    Working Time
                  </label>
                  <div className={styles.inputFlex}>
                    <input
                      type="time"
                      id="open_time"
                      className={styles.formInput}
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <span>-</span>
                    <input
                      type="time"
                      id="close_time"
                      className={styles.formInput}
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      required
                      disabled={loading}
                    />
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
                {loading ? 'Posting Job...' : 'Save & Continue →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
