import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getEmployerProfileApi, uploadLogoApi, removeLogoApi, updateEmployerProfileApi, type EmployerProfileData } from '@/services/api';
import styles from '@/styles/employerProfile.module.css';

// Base URL pointing directly to the main site's public_html folder where images are saved
const LOGO_BASE_URL = 'https://networkbaba.co/company_logo';

export default function EmployerProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<EmployerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoSrc, setLogoSrc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'company' | 'address' | 'employer' | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const openEditModal = (type: 'company' | 'address' | 'employer') => {
    if (!profile) return;
    setEditType(type);

    // Initialize form data based on type
    const data: any = {};
    if (type === 'company') {
      data.company_name = profile.company.company_name;
      data.gst_no = profile.company.gst_no === '----' ? '' : profile.company.gst_no;
      data.year_of_establish = profile.company.year_of_establish === '----' ? '' : profile.company.year_of_establish;
      data.no_of_employee = profile.company.no_of_employee === '----' ? '' : profile.company.no_of_employee;
      data.company_website = profile.company.company_website === '----' ? '' : profile.company.company_website;
      data.linkedin = profile.company.linkedin === '----' ? '' : profile.company.linkedin;
    } else if (type === 'address') {
      data.flat_bulding = profile.company.flat_bulding;
      data.city = profile.company.city;
      data.state = profile.company.state;
      data.country = profile.company.country;
      data.pincode = profile.company.pincode;
      data.lat = profile.company.lat;
      data.lng = profile.company.lng;
      data.full_add = profile.company.full_add;
    } else if (type === 'employer') {
      data.contact_person_name = profile.company.contact_person_name;
      data.contact_person_number = profile.company.contact_person_number;
      data.email_id = profile.company.email_id;
    }

    setEditFormData(data);
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!editType) return;
    setIsSaving(true);
    try {
      const res = await updateEmployerProfileApi(editType, editFormData);
      if (res.status) {
        setIsEditModalOpen(false);
        await fetchProfile(); // Refresh local profile page data
        
        // Force refresh global auth state (Header, etc.)
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        alert(res.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

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
                <button
                  className={styles.editBtn}
                  title="Edit Company Info"
                  onClick={() => openEditModal('company')}
                >✎</button>
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
                <button
                  className={styles.editBtn}
                  title="Edit Address"
                  onClick={() => openEditModal('address')}
                >✎</button>
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
                <button
                  className={styles.editBtn}
                  title="Edit Employer Info"
                  onClick={() => openEditModal('employer')}
                >✎</button>
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

      {/* ── Edit Profile Modal ────────────────────────────── */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>
                {editType === 'company' && 'Edit Company Details'}
                {editType === 'address' && 'Edit Office Address'}
                {editType === 'employer' && 'Edit Employer Info'}
              </h3>
              <button className={styles.closeBtn} onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>

            <div className={styles.modalBody}>
              {editType === 'company' && (
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel}>Company Name</label>
                    <input
                      className={styles.formInput}
                      name="company_name"
                      value={editFormData.company_name || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. Acme Corporation"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>GST No</label>
                    <input
                      className={styles.formInput}
                      name="gst_no"
                      value={editFormData.gst_no || ''}
                      onChange={handleInputChange}
                      placeholder="Optional"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Established Year</label>
                    <select
                      className={styles.formInput}
                      name="year_of_establish"
                      value={editFormData.year_of_establish || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Total Employees</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      name="no_of_employee"
                      value={editFormData.no_of_employee || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Website</label>
                    <input
                      className={styles.formInput}
                      name="company_website"
                      value={editFormData.company_website || ''}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel}>LinkedIn Profile</label>
                    <input
                      className={styles.formInput}
                      name="linkedin"
                      value={editFormData.linkedin || ''}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                </div>
              )}

              {editType === 'address' && (
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel}>Flat / Building / Street</label>
                    <input
                      className={styles.formInput}
                      name="flat_bulding"
                      value={editFormData.flat_bulding || ''}
                      onChange={handleInputChange}
                      placeholder="Address line 1"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>City</label>
                    <input
                      className={styles.formInput}
                      name="city"
                      value={editFormData.city || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>State</label>
                    <input
                      className={styles.formInput}
                      name="state"
                      value={editFormData.state || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Country</label>
                    <input
                      className={styles.formInput}
                      name="country"
                      value={editFormData.country || 'India'}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Pincode</label>
                    <input
                      className={styles.formInput}
                      name="pincode"
                      value={editFormData.pincode || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {editType === 'employer' && (
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel}>Contact Person Name</label>
                    <input
                      className={styles.formInput}
                      name="contact_person_name"
                      value={editFormData.contact_person_name || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mobile Number</label>
                    <input
                      className={styles.formInput}
                      name="contact_person_number"
                      value={editFormData.contact_person_number || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email ID</label>
                    <input
                      className={styles.formInput}
                      name="email_id"
                      value={editFormData.email_id || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
