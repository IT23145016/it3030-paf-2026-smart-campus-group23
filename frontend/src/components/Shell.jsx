import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SiteFooter from "./SiteFooter";

export default function Shell({ title, children }) {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "SC";

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="shell">
      <div className="page-menubar">
        <div className="page-menubar-links">
          <button type="button" className="menu-icon-link" onClick={() => setMenuOpen((current) => !current)} aria-label="Open menu">
            <MenuIcon />
          </button>
          <Link to="/">Home</Link>
          <a href="#footer-contact">Contact Us</a>
          <a href="#footer-help">Help</a>
        </div>

        <div className="page-menubar-actions">
          <a className="page-menubar-link" href="#footer-about">
            About Us
          </a>
          {!user ? (
            <Link className="menu-icon-link" to="/signin" aria-label="Sign in">
              <SignInIcon />
            </Link>
          ) : null}
          <button type="button" className="menu-icon-link" aria-label="My account" onClick={() => setMenuOpen(true)}>
            <AccountIcon />
          </button>
        </div>
      </div>

      <header className="shell-topbar">
        <div className="shell-topbar-spacer" aria-hidden="true" />
        <div className="shell-title">
          <h1>{title}</h1>
        </div>
        <div className="shell-topbar-spacer" aria-hidden="true" />
      </header>

      <main className="content">
        {children}
      </main>

      <SiteFooter compact />

      {menuOpen ? <button type="button" className="drawer-backdrop" onClick={closeMenu} aria-label="Close menu" /> : null}

      <aside className={`drawer ${menuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-brand">
            <span className="drawer-mark">SC</span>
            <div>
              <p className="profile-label">Quick menu</p>
              <strong>Campus navigation</strong>
            </div>
          </div>
          <button type="button" className="drawer-close-button" onClick={closeMenu} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>

        <nav className="nav">
          {user?.roles?.includes("ADMIN") ? (
            <Link to="/dashboard" onClick={closeMenu}>
              Dashboard
            </Link>
          ) : null}
          <Link to="/resources" onClick={closeMenu}>
            Facilities Catalogue
          </Link>
          {user?.roles?.includes("ADMIN") ? (
            <>
              <Link to="/admin/resources" onClick={closeMenu}>
                Resource Administration
              </Link>
              <Link to="/admin/roles" onClick={closeMenu}>
                Role Management
              </Link>
            </>
          ) : null}
        </nav>

        {user ? (
          <a className="oauth-button" href={`${apiBaseUrl}/logout`}>
            End Session
          </a>
        ) : (
          <Link className="oauth-button" to="/signin" onClick={closeMenu}>
            Continue with Google
          </Link>
        )}

        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar-chip">{user?.avatarUrl ? <img alt={user.fullName} src={user.avatarUrl} /> : initials}</div>
            <div>
              <p className="profile-label">{loading ? "Loading session" : user ? "Current session" : "Guest access"}</p>
              <strong>{loading ? "Preparing..." : user?.fullName || "Campus visitor"}</strong>
            </div>
          </div>
          <small>{user?.email || "Sign in to unlock the workspace"}</small>
          {user?.roles?.length ? (
            <div className="role-stack">
              {user.roles.map((role) => (
                <span className="mini-role" key={role}>
                  {role}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function SignInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 8l4 4-4 4M9 12h9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19c1.6-3 4.1-4.5 7-4.5s5.4 1.5 7 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 7h14M5 12h14M5 17h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7l10 10M17 7L7 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
