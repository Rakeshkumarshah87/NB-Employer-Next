import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/dashboard.module.css';

const LOGO_BASE_URL = 'https://networkbaba.co/images/icon/';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Avatar URL
  const avatarUrl = user?.company_logo ? `${LOGO_BASE_URL}${user.company_logo}` : null;
  const showAvatar = avatarUrl && !avatarError;
  const firstName = user?.contact_person?.split(' ')[0] || 'User';
  const avatarInitial = (user?.company_name || 'N').charAt(0).toUpperCase();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [router.pathname]);

  const toggleDropdown = useCallback(() => setDropdownOpen(p => !p), []);

  const handleLogout = useCallback(() => {
    setDropdownOpen(false);
    logout();
  }, [logout]);

  if (!user) return null;

  return (
    <>
      {/* ── Header Bar ─────────────────────────── */}
      <header className={styles.header} id="main-header">
        <div className={styles.headerAccent} aria-hidden="true" />
        <div className={styles.headerInner}>

          {/* Brand */}
          <Link href="/" className={styles.brand}>
            <img
              src="/nt/images/networkBabaLogoGif.gif"
              alt="NetworkBaba"
              className={styles.brandLogoImg}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className={styles.desktopNav}>
            <Link href="/" className={`${styles.navLink} ${router.pathname === '/' ? styles.navLinkActive : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              Jobs
            </Link>
            <Link href="/post-job" className={styles.postJobBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Post Job
            </Link>
          </nav>

          {/* Desktop User Section */}
          <div className={styles.userSection} ref={dropdownRef}>
            <button
              className={`${styles.userBtn} ${dropdownOpen ? styles.userBtnActive : ''}`}
              onClick={toggleDropdown}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              id="user-menu-btn"
            >
              {showAvatar ? (
                <img
                  src={avatarUrl!}
                  alt=""
                  className={styles.userAvatar}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className={styles.avatarFallback}>{avatarInitial}</div>
              )}
              <span className={styles.userDisplayName}>{firstName}</span>
              <svg
                className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
                width="12" height="12" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className={styles.dropdown} role="menu" id="user-dropdown">
                {/* User Info Header */}
                <div className={styles.ddUserInfo}>
                  {showAvatar ? (
                    <img
                      src={avatarUrl!}
                      alt=""
                      className={styles.ddAvatar}
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className={styles.ddAvatarFallback}>{avatarInitial}</div>
                  )}
                  <div className={styles.ddUserDetails}>
                    <div className={styles.ddCompany}>{user.company_name?.toUpperCase()}</div>
                    <div className={styles.ddPerson}>{user.contact_person}</div>
                    <div className={styles.ddPhone}>{user.mobileno}</div>
                  </div>
                </div>

                <div className={styles.ddSep} />

                {/* Menu Items */}
                <Link href="/employer-profile" className={styles.ddItem} role="menuitem" onClick={() => setDropdownOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Profile
                </Link>
                <Link href="/feedback" className={styles.ddItem} role="menuitem" onClick={() => setDropdownOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Feedback / Complaint
                </Link>

                <div className={styles.ddSep} />

                <button className={styles.ddLogout} role="menuitem" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </button>

                <div className={styles.ddSep} />

                <a 
                  href="https://wa.me/917447389856?text=Hi%20NetworkBaba%20Support,%20I%20need%20help%20with..." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.ddWhatsapp}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.185-.573c.948.517 2.031.787 3.145.787 3.181 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.767-5.767-5.767zm3.39 8.044c-.145.405-.851.778-1.2.823-.349.045-.697.07-1.442-.227-1.156-.462-1.9-1.631-1.958-1.708-.057-.077-.463-.615-.463-.1.17 0-.54-.34-.54-.34-.148-.13-.243-.312-.243-.51 0-.198.095-.38.243-.51l.142-.142c.036-.036.075-.069.117-.099-.181-.462-.312-.953-.388-1.458-.027-.184-.183-.322-.369-.322h-.24c-.198 0-.38.095-.51.243l-.142.142c-.22.22-.353.518-.353.847 0 .151.026.297.075.433.25.688.756 1.293 1.396 1.637.64.343 1.394.468 2.115.344.405-.07.773-.242 1.077-.492l.142-.142c.148-.13.243-.312.243-.51s-.095-.38-.243-.51l-.142-.142c-.042-.03-.081-.063-.117-.099.076.505.207.996.388 1.458.186 0 .342.138.369.322.076.505.207.953.388 1.458.148.13.243.312.243.51 0 .198-.095.38-.243.51l-.142.142z"/>
                    <path d="M12.036 0C5.39 0 0 5.391 0 12.036c0 2.121.554 4.189 1.605 6.01L0 24l6.101-1.6c1.848 1.03 3.948 1.572 6.096 1.572 6.647 0 12.037-5.39 12.037-12.036S18.683 0 12.036 0zm0 21.688c-1.84 0-3.642-.486-5.215-1.405l-.371-.219-3.606.945.961-3.51-.24-.383A9.626 9.626 0 0 1 2.375 12.036c0-5.32 4.34-9.66 9.66-9.66 5.32 0 9.66 4.34 9.66 9.66s-4.341 9.66-9.66 9.66z"/>
                  </svg>
                  Support / Feedback
                </a>
              </div>
            )}
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <nav className={styles.bottomNav}>
            <Link href="/" className={`${styles.bottomNavItem} ${router.pathname === '/' ? styles.bottomNavItemActive : ''}`}>
              <svg className={styles.bottomNavIcon} viewBox="0 0 24 24" fill={router.pathname === '/' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <span className={styles.bottomNavText}>Job List</span>
            </Link>
            
            <Link href="/post-job" className={`${styles.bottomNavItem} ${router.pathname === '/post-job' ? styles.bottomNavItemActive : ''}`}>
               <svg className={styles.bottomNavIcon} viewBox="0 0 24 24" fill={router.pathname === '/post-job' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                 <line x1="12" y1="8" x2="12" y2="16"/>
                 <line x1="8" y1="12" x2="16" y2="12"/>
               </svg>
               <span className={styles.bottomNavText}>New Job</span>
            </Link>

            <Link href="#" className={styles.bottomNavItem}>
              <div className={styles.notificationWrapper}>
                <svg className={styles.bottomNavIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span className={styles.notificationBadge}>0</span>
              </div>
              <span className={styles.bottomNavText}>Notification</span>
            </Link>

            <Link href="/employer-profile" className={`${styles.bottomNavItem} ${router.pathname === '/employer-profile' ? styles.bottomNavItemActive : ''}`}>
               <svg className={styles.bottomNavIcon} viewBox="0 0 24 24" fill={router.pathname === '/employer-profile' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                 <circle cx="12" cy="7" r="4"/>
               </svg>
               <span className={styles.bottomNavText}>Profile</span>
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
