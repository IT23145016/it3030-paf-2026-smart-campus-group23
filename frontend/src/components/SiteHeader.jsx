import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SiteHeader() {
  const { user } = useAuth();

  return (
    <header className="site-header">
      <Link className="brand-mark" to="/">
        <span className="brand-icon">SU</span>
        <span>
          <strong>Smart Uni Hub</strong>
          <small>Campus operations made simple</small>
        </span>
      </Link>

      <nav className="site-nav">
        <Link to="/">Home</Link>
        <Link to="/contact">Contact Us</Link>
        <Link to="/help">Help</Link>
        <Link to="/about">About Us</Link>
      </nav>

      <div className="site-header-actions">
        {user ? (
          <Link
            className="site-header-icon"
            to="/notifications"
            aria-label="Notifications"
          >
            <NotificationIcon />
          </Link>
        ) : null}

        {!user ? (
          <>
            <Link className="site-header-signup" to="/signup">
              Sign Up
            </Link>
            <Link className="site-header-login" to="/signin">
              Sign In
            </Link>
          </>
        ) : (
          <Link
            className="site-header-icon"
            to={user.roles?.includes("ADMIN") ? "/dashboard" : "/resources"}
            aria-label="My account"
          >
            <AccountIcon />
          </Link>
        )}
      </div>
    </header>
  );
}

function NotificationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4a4 4 0 0 0-4 4v2.3c0 .8-.3 1.6-.8 2.3L6 14.5h12l-1.2-1.9a4.2 4.2 0 0 1-.8-2.3V8a4 4 0 0 0-4-4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 17a2.5 2.5 0 0 0 5 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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
