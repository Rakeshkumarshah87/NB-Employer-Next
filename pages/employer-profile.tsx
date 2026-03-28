import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getEmployerProfileApi, uploadLogoApi, removeLogoApi, type EmployerProfileData } from '@/services/api';
import styles from '@/styles/employerProfile.module.css';

// Base URL pointing directly to the main site's public_html folder where images are saved
const LOGO_BASE_URL = 'https://networkbaba.co/company_logo';

export default function EmployerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoSrc, setLogoSrc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getEmployerProfileApi();
      if (res.status && res.data) {
        setProfile(res.data);
        const logo = res.data.company.company_logo;
        if (logo) {
          setLogoSrc(`${LOGO_BASE_URL}/${logo}`);
        } else {
          setLogoSrc('');
        }
      } else {
        setError(res.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ── Loading State ─────────────────────────────────────
  if (loading) {
    return (
      <>
        <Head><title>Employer Profile | NetworkBaba</title></Head>
        <div className={styles.pageWrapper}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        </div>
      </>
    );
  }

  // ── Error State ──────────────────────────────────────
  if (error || !profile) {
    return (
      <>
        <Head><title>Employer Profile | NetworkBaba</title></Head>
        <div className={styles.pageWrapper}>
          <div className={styles.error}>
            <p>{error || 'Something went wrong.'}</p>
            <button className={styles.retryBtn} onClick={fetchProfile}>
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  const { company, subscription } = profile;

  // Helper: display value or placeholder
  const val = (v: string) => v && v !== '----' ? v : '';
  const displayVal = (v: string, fallback = '----') => {
    const clean = val(v);
    return clean || fallback;
  };

  // Company name initial for placeholder
  const nameInitial = company.company_name ? company.company_name.charAt(0).toUpperCase() : '?';

  return (
    <>
      <Head><title>Employer Profile | NetworkBaba</title></Head>

      <div className={styles.pageWrapper}>
        {/* ── Header ─────────────────────────────────── */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Company Profile</h1>
          <Link href="/all-post-jobs" className={styles.backBtn}>
            <span className={styles.backIcon}>←</span> Back to Jobs
          </Link>
        </div>

        {/* ── Grid ───────────────────────────────────── */}
        <div className={styles.profileGrid}>

          {/* ═══ LEFT COLUMN ═══ */}
          <div className={styles.leftCol}>

            {/* ── Company Logo Card ──────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Company Logo</h3>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.logoContainer}>
                  <div className={styles.logoWrapper}>
                    {logoSrc ? (
                      <img
                        className={styles.logoImage}
                        src={logoSrc}
                        alt={company.company_name || 'Company Logo'}
                        onError={() => setLogoSrc('')}
                      />
                    ) : (
                      <div className={styles.logoPlaceholder}>{nameInitial}</div>
                    )}
                  </div>

                  <div className={styles.uploadBtnWrapper}>
                    <button className={styles.btnUpload}>
                      📷 Change Logo
                    </button>
                    <input
                      ref={fileInputRef}
                      className={styles.fileInput}
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Quick preview
                          const preview = URL.createObjectURL(file);
                          setLogoSrc(preview);
                          try {
                            const res = await uploadLogoApi(file);
                            if (res.status && res.data) {
                              setLogoSrc(`${LOGO_BASE_URL}/${res.data.logo}`);
                            } else {
                              alert(res.message || 'Failed to upload logo');
                            }
                          } catch (err) {
                            console.error('Upload failed:', err);
                            alert('Upload failed. Please try again.');
                          }
                        }
                      }}
                    />
                  </div>

                  {logoSrc && (
                    <button
                      className={styles.removeLogo}
                      onClick={async () => {
                        if (confirm('Are you sure you want to remove the company logo?')) {
                          try {
                            const res = await removeLogoApi();
                            if (res.status) {
                              setLogoSrc('');
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            } else {
                              alert(res.message || 'Failed to remove logo');
                            }
                          } catch (err) {
                            console.error('Remove failed:', err);
                            alert('Remove failed. Please try again.');
                          }
                        }
                      }}
                    >
                      ✕ Remove Picture
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Subscription Card ──────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Subscription</h3>
              </div>
              <div className={styles.cardBody}>
                {subscription.has_active_plan ? (
                  <>
                    <div className={styles.subRow}>
                      <span className={styles.subLabel}>Active Plan</span>
                      <span className={styles.subVal}>{subscription.package_name}</span>
                    </div>
                    <div className={styles.subRow}>
                      <span className={styles.subLabel}>Activated On</span>
                      <span className={styles.subVal}>{subscription.activated_on}</span>
                    </div>
                    <div className={styles.subRow}>
                      <span className={styles.subLabel}>Validity</span>
                      <span className={styles.validityBadge}>{subscription.validity}</span>
                    </div>
                  </>
                ) : (
                  <div className={styles.noPlan}>
                    <p>No active plan found.</p>
                    <small>Upgrade to unlock features.</small>
                  </div>
                )}

                <div className={styles.upgradeLink}>
                  <Link href="/employer-upgrade-plan">Upgrade Plan →</Link>
                </div>
              </div>
            </div>

          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div className={styles.rightCol}>

            {/* ── About Company Card ─────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>About Company</h3>
                <button className={styles.editBtn} title="Edit Company Info">✎</button>
              </div>
              <div className={styles.cardBody}>
                <ul className={styles.infoList}>
                  <li className={styles.infoItem}>
                    <span className={styles.infoLabel}>Company Name</span>
                    <span className={styles.infoValue}>
                      {displayVal(company.company_name)}
                    </span>
                  </li>
                  <li className={styles.infoItem}>
                    <span className={styles.infoLabel}>GST No</span>
                    <span className={`${styles.infoValue} ${!val(company.gst_no) ? styles.emptyValue : ''}`}>
                      {displayVal(company.gst_no)}
                    </span>
                  </li>
                  <li className={styles.infoItem}>
                    <span className={styles.infoLabel}>Established In</span>
                    <span className={`${styles.infoValue} ${!val(company.year_of_establish) ? styles.emptyValue : ''}`}>
                      {displayVal(company.year_of_establish)}
                    </span>
                  </li>
                  <li className={styles.infoItem}>
                    <span className={styles.infoLabel}>Total Employees</span>
                    <span className={`${styles.infoValue} ${!val(company.no_of_employee) ? styles.emptyValue : ''}`}>
                      {displayVal(company.no_of_employee)}
                    </span>
                  </li>
                  <li className={styles.infoItem}>
                    <span className={styles.infoLabel}>Website</span>
                    <span className={styles.infoValue}>
                      {val(company.company_website) ? (
                        <a href={company.company_website} target="_blank" rel="noopener noreferrer">
                          {company.company_website}
                        </a>
                      ) : (
                        <span className={styles.emptyValue}>----</span>
                      )}
                    </span>
                  </li>
                  <li className={styles.infoItem}>
                    <span className={styles.infoLabel}>LinkedIn</span>
                    <span className={styles.infoValue}>
                      {val(company.linkedin) ? (
                        <a href={company.linkedin} target="_blank" rel="noopener noreferrer">
                          View Profile
                        </a>
                      ) : (
                        <span className={styles.emptyValue}>----</span>
                      )}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* ── Office Address Card ────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Office Address</h3>
                <button className={styles.editBtn} title="Edit Address">✎</button>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.addressText}>
                  {company.address || <span className={styles.emptyValue}>No address added</span>}
                </p>
              </div>
            </div>

            {/* ── Employer Info Card ─────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Employer Info</h3>
                <button className={styles.editBtn} title="Edit Employer Info">✎</button>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.contactGrid}>
                  <div className={styles.contactBox}>
                    <div className={styles.contactIcon}>👤</div>
                    <h4>Name</h4>
                    <p>{company.contact_person_name || user?.contact_person || '----'}</p>
                  </div>
                  <div className={styles.contactBox}>
                    <div className={styles.contactIcon}>✉️</div>
                    <h4>Email</h4>
                    <p>{company.email_id || user?.email || '----'}</p>
                  </div>
                  <div className={styles.contactBox}>
                    <div className={styles.contactIcon}>📞</div>
                    <h4>Contact</h4>
                    <p>{company.contact_person_number || user?.mobileno || '----'}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
