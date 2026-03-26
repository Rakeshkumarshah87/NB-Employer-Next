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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [router.pathname]);

  const toggleDropdown = useCallback(() => setDropdownOpen(p => !p), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleLogout = useCallback(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
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
            <div className={styles.brandIconBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span className={styles.brandText}>
              Network<span className={styles.brandHighlight}>Baba</span>
            </span>
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
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}
            onClick={() => setMobileOpen(p => !p)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            id="mobile-menu-btn"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ── Mobile Menu Overlay ────────────────── */}
      <div
        className={`${styles.mobileOverlay} ${mobileOpen ? styles.mobileOverlayOpen : ''}`}
        onClick={closeMobile}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`${styles.mobilePanel} ${mobileOpen ? styles.mobilePanelOpen : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button className={styles.mobileClose} onClick={closeMobile} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Mobile User Info */}
          <div className={styles.mobileUser}>
            {showAvatar ? (
              <img src={avatarUrl!} alt="" className={styles.mobileAvatar} onError={() => setAvatarError(true)} />
            ) : (
              <div className={styles.mobileAvatarFallback}>{avatarInitial}</div>
            )}
            <div>
              <div className={styles.mobileCompany}>{user.company_name?.toUpperCase()}</div>
              <div className={styles.mobilePerson}>{user.contact_person}</div>
              <div className={styles.mobilePhone}>{user.mobileno}</div>
            </div>
          </div>

          <div className={styles.mobileSep} />

          {/* Mobile Nav Links */}
          <nav className={styles.mobileNav}>
            <Link href="/" className={`${styles.mobileNavLink} ${router.pathname === '/' ? styles.mobileNavLinkActive : ''}`} onClick={closeMobile}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              Jobs
            </Link>
            <Link href="/post-job" className={styles.mobileNavLink} onClick={closeMobile}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Post Job
            </Link>
            <Link href="/employer-profile" className={styles.mobileNavLink} onClick={closeMobile}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Profile
            </Link>
            <Link href="/feedback" className={styles.mobileNavLink} onClick={closeMobile}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Feedback / Complaint
            </Link>
          </nav>

          <div className={styles.mobileSep} />

          {/* Mobile Logout */}
          <button className={styles.mobileLogoutBtn} onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
