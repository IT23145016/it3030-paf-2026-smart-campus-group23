import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Shell({ title, children }) {
  const { user, loading } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "SC";

  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="eyebrow">Smart Campus Operations Hub</p>
        <h1>{title}</h1>
        <p className="muted">A focused operations layer for alerts, access, and accountability.</p>
        <nav className="nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/resources">Facilities Catalogue</Link>
          <Link to="/admin/roles">Role Management</Link>
        </nav>
        {user ? (
          <a className="oauth-button" href={`${apiBaseUrl}/logout`}>
            End Session
          </a>
        ) : (
          <Link className="oauth-button" to="/signin">
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
      <main className="content">{children}</main>
    </div>
  );
}
