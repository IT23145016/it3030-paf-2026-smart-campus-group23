import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

const ROLE_OPTIONS = ["USER", "ADMIN", "TECHNICIAN", "STUDENT"];
const NOTIFICATION_REFRESH_EVENT = "scoh:refresh-notifications";

const ROLE_COLORS = {
  ADMIN:      { bg: "rgba(33,76,113,0.12)",  color: "#173f61" },
  TECHNICIAN: { bg: "rgba(79,143,190,0.12)", color: "#1f567f" },
  USER:       { bg: "rgba(93,111,125,0.1)",  color: "#3d5166" },
  STUDENT:    { bg: "rgba(123,94,167,0.1)",  color: "#5a3d8a" },
};

function getInitials(name, email) {
  if (name) return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  return email?.[0]?.toUpperCase() || "?";
}

export default function RoleManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ query: "", role: "all", status: "all" });
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      setError("");
      setUsers(await api.getUsers());
    } catch (err) { setError(err.message); }
  }

  async function toggleRole(userId, role) {
    const target = users.find((u) => u.id === userId);
    const nextRoles = target.roles.includes(role)
      ? target.roles.filter((r) => r !== role)
      : [...target.roles, role];
    try {
      setUpdatingUserId(userId);
      const updated = await api.updateRoles(userId, nextRoles);
      setUsers((cur) => cur.map((u) => u.id === userId ? updated : u));
      setError("");
      window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT));
    } catch (err) { setError(err.message); }
    finally { setUpdatingUserId(""); }
  }

  async function toggleStatus(userId, active) {
    if (currentUser?.id === userId && !active) { setError("Admins cannot deactivate their own account."); return; }
    try {
      setUpdatingUserId(userId);
      const updated = await api.updateUserStatus(userId, active);
      setUsers((cur) => cur.map((u) => u.id === userId ? updated : u));
      setError("");
      window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT));
    } catch (err) { setError(err.message); }
    finally { setUpdatingUserId(""); }
  }

  function deleteUser(userId) {
    if (currentUser?.id === userId) { setError("Admins cannot delete their own account."); return; }
    setConfirmDeleteUser(users.find((u) => u.id === userId));
  }

  async function confirmDelete() {
    if (!confirmDeleteUser) return;
    try {
      setDeletingUserId(confirmDeleteUser.id);
      await api.deleteUser(confirmDeleteUser.id);
      setUsers((cur) => cur.filter((u) => u.id !== confirmDeleteUser.id));
      setError("");
      setSuccessMessage(`${confirmDeleteUser.fullName || confirmDeleteUser.email} deleted successfully.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT));
    } catch (err) { setError(err.message); }
    finally { setDeletingUserId(""); setConfirmDeleteUser(null); }
  }

  const filteredUsers = users.filter((u) => {
    const q = filters.query.trim().toLowerCase();
    return (!q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      && (filters.role === "all" || u.roles.includes(filters.role))
      && (filters.status === "all" || (filters.status === "active" ? u.active : !u.active));
  });

  return (
    <Shell title="Manage User Access">

      {error ? <p className="error">{error}</p> : null}

      {/* Success Toast */}
      {successMessage ? (
        <div style={{ position: "fixed", top: "1.5rem", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #214c71, #5f93bc)", color: "#f7fbff", padding: "0.9rem 1.6rem", borderRadius: "16px", boxShadow: "0 14px 32px rgba(33,76,113,0.22)", fontWeight: 600, zIndex: 999, whiteSpace: "nowrap" }}>
          ✓ {successMessage}
        </div>
      ) : null}

      {/* Delete Confirm Modal */}
      {confirmDeleteUser ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,33,29,0.45)", zIndex: 50, display: "grid", placeItems: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px", padding: "2rem", maxWidth: "400px", width: "90%", boxShadow: "0 24px 60px rgba(33,76,113,0.18)", display: "grid", gap: "1.2rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem" }}>🗑️</div>
            <h3 style={{ margin: 0, color: "#173f61" }}>Delete Account</h3>
            <p style={{ margin: 0, color: "#5d6f7d" }}>Are you sure you want to delete <strong>{confirmDeleteUser.fullName || confirmDeleteUser.email}</strong>? This cannot be undone.</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={confirmDelete} disabled={!!deletingUserId}>{deletingUserId ? "Deleting…" : "Yes, Delete"}</button>
              <button className="secondary-button" onClick={() => setConfirmDeleteUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Filters */}
      <section className="table-card" style={{ padding: "1.3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>Users — {filteredUsers.length} shown</p>
          </div>
          <button type="button" className="secondary-button" onClick={loadUsers} style={{ width: "38px", height: "38px", padding: 0, borderRadius: "999px", display: "grid", placeItems: "center" }} aria-label="Refresh">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.85rem", alignItems: "end" }}>
          <label>Search<input name="query" value={filters.query} onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))} placeholder="Name or email" /></label>
          <label>Role
            <select name="role" value={filters.role} onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}>
              <option value="all">All roles</option>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label>Status
            <select name="status" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
              <option value="all">All users</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <button type="button" className="secondary-button" onClick={() => setFilters({ query: "", role: "all", status: "all" })} style={{ marginBottom: "0" }}>Clear</button>
        </div>
      </section>

      {/* User Cards */}
      <section style={{ display: "grid", gap: "0.75rem" }}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem", background: "var(--card)", borderRadius: "18px", border: "1px dashed rgba(53,102,141,0.16)", color: "var(--muted)" }}>
            No users matched the selected filters.
          </div>
        ) : null}

        {filteredUsers.map((user) => (
          <article key={user.id} style={{
            background: "var(--card)", borderRadius: "18px", padding: "1.1rem 1.3rem",
            border: "1px solid var(--outline)", display: "grid",
            gridTemplateColumns: "auto 1fr auto", gap: "1rem", alignItems: "center",
            boxShadow: "0 8px 24px rgba(16,33,29,0.06)", opacity: user.active ? 1 : 0.65
          }}>
            {/* Avatar */}
            <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "linear-gradient(135deg, #214c71, #5f93bc)", display: "grid", placeItems: "center", color: "#f7fbff", fontWeight: 700, fontSize: "0.95rem", flexShrink: 0, overflow: "hidden" }}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "grid"; }} />
                : null}
              <span style={{ display: user.avatarUrl ? "none" : "grid", placeItems: "center", width: "100%", height: "100%" }}>{getInitials(user.fullName, user.email)}</span>
            </div>

            {/* Info */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                <strong style={{ color: "#173f61", fontSize: "0.95rem" }}>{user.fullName || "—"}</strong>
                <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{user.email}</span>
                {currentUser?.id === user.id ? <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "rgba(33,76,113,0.1)", color: "#214c71", fontWeight: 700 }}>You</span> : null}
              </div>
              {/* Role checkboxes */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {ROLE_OPTIONS.map((role) => {
                  const cfg = ROLE_COLORS[role] || ROLE_COLORS.USER;
                  const active = user.roles.includes(role);
                  return (
                    <label key={role} style={{
                      display: "inline-flex", alignItems: "center", gap: "0.35rem",
                      padding: "0.25rem 0.65rem", borderRadius: "999px", cursor: updatingUserId === user.id ? "not-allowed" : "pointer",
                      background: active ? cfg.bg : "rgba(240,247,255,0.8)",
                      border: `1px solid ${active ? cfg.color + "44" : "rgba(53,102,141,0.1)"}`,
                      color: active ? cfg.color : "var(--muted)", fontWeight: active ? 700 : 500,
                      fontSize: "0.78rem", transition: "all 0.15s ease"
                    }}>
                      <input type="checkbox" checked={active} onChange={() => toggleRole(user.id, role)} disabled={updatingUserId === user.id} style={{ width: "auto", margin: 0, accentColor: cfg.color }} />
                      {role}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
              <button type="button" onClick={() => toggleStatus(user.id, !user.active)} disabled={updatingUserId === user.id}
                style={{
                  padding: "0.4rem 0.85rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700,
                  background: user.active ? "rgba(46,139,87,0.1)" : "rgba(217,95,75,0.1)",
                  color: user.active ? "#2e8b57" : "#d95f4b", border: "none", boxShadow: "none"
                }}>
                {updatingUserId === user.id ? "…" : user.active ? "Active" : "Inactive"}
              </button>
              <button type="button" onClick={() => deleteUser(user.id)} disabled={currentUser?.id === user.id}
                style={{ padding: "0.4rem 0.85rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700, background: "rgba(217,95,75,0.08)", color: "#d95f4b", border: "none", boxShadow: "none", opacity: currentUser?.id === user.id ? 0.4 : 1 }}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </Shell>
  );
}
