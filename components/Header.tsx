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
            <Link href="/all-post-jobs" className={`${styles.navLink} ${router.pathname === '/all-post-jobs' ? styles.navLinkActive : ''}`}>
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
              <div className={styles.userBtnInfo}>
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
              </div>
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
                <a href="mailto:support@networkbaba.co" className={styles.ddItem} role="menuitem" onClick={() => setDropdownOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Feedback / Complaint
                </a>

                <div className={styles.ddSep} />

                <button className={styles.ddLogout} role="menuitem" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <nav className={styles.bottomNav}>
            <Link href="/all-post-jobs" className={`${styles.bottomNavItem} ${router.pathname === '/all-post-jobs' ? styles.bottomNavItemActive : ''}`}>
              <svg className={styles.bottomNavIcon} viewBox="0 0 24 24" fill={router.pathname === '/all-post-jobs' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <span className={styles.bottomNavText}>Job List</span>
            </Link>
            
            <Link href="/post-job" className={`${styles.bottomNavItem} ${router.pathname === '/post-job' ? styles.bottomNavItemActive : ''}`}>
               <svg className={styles.bottomNavIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill={router.pathname === '/post-job' ? "currentColor" : "none"} stroke={router.pathname === '/post-job' ? "none" : "currentColor"}/>
                 <line x1="12" y1="8" x2="12" y2="16" stroke={router.pathname === '/post-job' ? "#ffffff" : "currentColor"} />
                 <line x1="8" y1="12" x2="16" y2="12" stroke={router.pathname === '/post-job' ? "#ffffff" : "currentColor"} />
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
