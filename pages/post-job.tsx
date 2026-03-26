import { useState, useEffect, type FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { isAuthenticated, getAuthUser, clearAuth, postJobApi } from '@/services/api';
import styles from '@/styles/postjob.module.css';

/**
 * Post Free Job Page
 * Replicates the live networkbaba.co/post-free-jobs/add/ form
 * Auth-gated: redirects to /login if not authenticated
 */
export default function PostJobPage() {
  const router = useRouter();

  // ── Auth State ────────────────────────────────
  const [user, setUser] = useState<{ employer_id: number; mobileno: string; company_name: string; contact_person: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // ── Form State: Basic Job Details ─────────────
  const [jobTitle, setJobTitle] = useState('');
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

  // ── Auth Guard ────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    const authUser = getAuthUser();
    setUser(authUser);
  }, [router]);

  // ── Close dropdown on outside click ───────────
  useEffect(() => {
    const handler = () => setShowDropdown(false);
    if (showDropdown) {
      document.addEventListener('click', handler);
    }
    return () => document.removeEventListener('click', handler);
  }, [showDropdown]);

  // ── Logout ────────────────────────────────────
  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // ── Validation ────────────────────────────────
  const validate = (): string | null => {
    if (!jobTitle.trim()) return 'Please enter the Job Title';
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
        setSuccess('Job posted successfully! 🎉');
        // Clear form
        setJobTitle('');
        setMonthlyFrom('');
        setMonthlyTo('');
        setNoOfOpenings('');
        setShift('');
        setQualification('');
        setExperience('');
        setMinExp('');
        setMaxExp('');
        setGender('');
        setEnglish('');
        setJobDescription('');
        setWorkFromHome(false);
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className={styles.pageWrapper}>
        {/* ═══════════ HEADER ═══════════ */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.backBtn}
              onClick={() => router.back()}
              aria-label="Go back"
              id="back-btn"
            >
              ←
            </button>

            <div className={styles.logoText}>
              <span>N</span>etwork<span>Baba</span>
            </div>

            <a href="/post-job" className={styles.jobsBtn} id="jobs-nav-btn">
              💼 <span>JOBS</span>
            </a>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.notifBtn} id="notification-btn" aria-label="Notifications">
              🔔
              <span className={styles.notifBadge}>5</span>
            </button>

            { /* User Dropdown */ }
            <div className={styles.userDropdownWrap}>
              <button
                className={styles.userBtn}
                id="user-menu-btn"
                onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
              >
                <div className={styles.userAvatar}>
                  {user ? getInitials(user.contact_person || user.company_name) : '?'}
                </div>
                <span className={styles.userName}>
                  {user?.contact_person?.split(' ')[0] || 'User'}
                </span>
                <span className={styles.userDropdownArrow}>▼</span>
              </button>

              {showDropdown && (
                <div className={styles.userDropdown}>
                  <div className={styles.dropdownItem} style={{ fontWeight: 600, color: '#2563eb' }}>
                    {user?.company_name || 'Company'}
                  </div>
                  <div className={styles.dropdownItem} style={{ color: '#6b7280', fontSize: 13 }}>
                    📞 {user?.mobileno}
                  </div>
                  <div className={styles.dropdownDivider} />
                  <button className={styles.dropdownItem} id="profile-btn">
                    👤 Profile
                  </button>
                  <button className={styles.dropdownItem} onClick={handleLogout} id="logout-btn">
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ═══════════ PAGE TITLE ═══════════ */}
        <div className={styles.pageTitle}>
          <h1>Post Free Job</h1>
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
                <div className={`${styles.formGroup} ${styles.span2}`}>
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
                    required
                    disabled={loading}
                  />
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
