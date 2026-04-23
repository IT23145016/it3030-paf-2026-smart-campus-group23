import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import SiteFooter from "./SiteFooter";
import SupportAssistant from "./SupportAssistant";

const NOTIFICATION_POLL_INTERVAL_MS = 15000;

export default function Shell({ title, children }) {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationAlert, setNotificationAlert] = useState("");
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
  const notificationHref = "/notifications";
  const knownUnreadIdsRef = useRef([]);
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

  useEffect(() => {
    async function loadUnreadCount() {
      if (!user) {
        setUnreadCount(0);
        knownUnreadIdsRef.current = [];
        setNotificationAlert("");
        return;
      }

      try {
        const [unread, notifications] = await Promise.all([api.getUnreadCount(), api.getNotifications()]);
        setUnreadCount(unread.count || 0);

        const nextUnreadIds = notifications.filter((item) => !item.read).map((item) => item.id);
        const newUnreadItems = notifications.filter(
          (item) => !item.read && !knownUnreadIdsRef.current.includes(item.id)
        );

        if (knownUnreadIdsRef.current.length > 0 && newUnreadItems.length > 0) {
          setNotificationAlert(
            newUnreadItems.length === 1
              ? `New notification: ${newUnreadItems[0].title}`
              : `${newUnreadItems.length} new notifications received.`
          );
        }

        knownUnreadIdsRef.current = nextUnreadIds;
      } catch {
        setUnreadCount(0);
      }
    }

    loadUnreadCount();

    if (!user) {
      return undefined;
    }

    const intervalId = window.setInterval(loadUnreadCount, NOTIFICATION_POLL_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadUnreadCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    if (!notificationAlert) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotificationAlert("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [notificationAlert]);

  return (
    <div className="shell">
      <div className="page-menubar">
        <div className="page-menubar-links">
          <button type="button" className="menu-icon-link" onClick={() => setMenuOpen((current) => !current)} aria-label="Open menu">
            <MenuIcon />
          </button>
          <Link to="/">Home</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/help">Help</Link>
        </div>

        <div className="page-menubar-actions">
          <Link className="page-menubar-link" to="/about">
            About Us
          </Link>
          {user ? (
            <Link className="menu-icon-link notification-bell-link" to={notificationHref} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}>
              <BellIcon />
              {unreadCount ? <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
            </Link>
          ) : null}
          {user ? (
            <a className="page-menubar-logout" href={`${apiBaseUrl}/logout`}>
              Log out
            </a>
          ) : null}
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

      {notificationAlert ? (
        <div className="global-notification-alert">
          <Link to={notificationHref}>{notificationAlert}</Link>
        </div>
      ) : null}

      <main className="content">
        {children}
      </main>

      <SiteFooter compact />
      <SupportAssistant />

      {menuOpen ? <button type="button" className="drawer-backdrop" onClick={closeMenu} aria-label="Close menu" /> : null}

      <aside className={`drawer ${menuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-brand">
            <span className="drawer-mark">SC</span>
            <div>
              <strong>Quick Access</strong>
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
          {user && !user.roles?.includes("ADMIN") ? (
            <Link to="/bookings" onClick={closeMenu}>
              My Bookings
            </Link>
          ) : null}
          {user ? (
            <Link to="/tickets" onClick={closeMenu}>
              Incident Tickets
            </Link>
          ) : null}
          {user ? (
            <Link to="/notifications" onClick={closeMenu}>
              Notifications
            </Link>
          ) : null}
          {user?.roles?.some((role) => role === "ADMIN" || role === "TECHNICIAN") ? (
            <Link to="/tickets/manage" onClick={closeMenu}>
              Ticket Operations
            </Link>
          ) : null}
          {user?.roles?.includes("ADMIN") ? (
            <>
              <Link to="/admin/resources" onClick={closeMenu}>
                Resource Administration
              </Link>
              <Link to="/admin/bookings" onClick={closeMenu}>
                Booking Requests
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

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5.25a4.25 4.25 0 0 0-4.25 4.25v2.42c0 .63-.2 1.25-.58 1.76L5.9 15.4A1 1 0 0 0 6.7 17h10.6a1 1 0 0 0 .8-1.6l-1.27-1.72a3 3 0 0 1-.58-1.76V9.5A4.25 4.25 0 0 0 12 5.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 18a2.25 2.25 0 0 0 4.5 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

