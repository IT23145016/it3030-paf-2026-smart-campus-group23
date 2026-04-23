import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const POLL_INTERVAL_MS = 15000;
const REFRESH_EVENT_NAME = "scoh:refresh-notifications";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "booking", label: "Bookings" },
  { value: "tickets", label: "Tickets" },
  { value: "comments", label: "Comments" }
];

const TYPE_CONFIG = {
  BOOKING_CREATED:      { icon: "📋", color: "#4f8fbe", bg: "rgba(79,143,190,0.1)",  label: "New Booking" },
  BOOKING_APPROVED:     { icon: "✅", color: "#2e8b57", bg: "rgba(46,139,87,0.1)",   label: "Booking Approved" },
  BOOKING_REJECTED:     { icon: "❌", color: "#d95f4b", bg: "rgba(217,95,75,0.1)",   label: "Booking Rejected" },
  BOOKING_CANCELLED:    { icon: "🚫", color: "#888",    bg: "rgba(136,136,136,0.1)", label: "Booking Cancelled" },
  TICKET_CREATED:       { icon: "🎫", color: "#e8a838", bg: "rgba(232,168,56,0.1)",  label: "New Ticket" },
  TICKET_STATUS_CHANGED:{ icon: "🔄", color: "#5f7fbf", bg: "rgba(95,127,191,0.1)",  label: "Ticket Updated" },
  TICKET_COMMENT_ADDED: { icon: "💬", color: "#7b5ea7", bg: "rgba(123,94,167,0.1)",  label: "New Comment" },
  ROLE_UPDATED:         { icon: "👤", color: "#214c71", bg: "rgba(33,76,113,0.1)",   label: "Role Updated" },
  SYSTEM:               { icon: "🔔", color: "#5d6f7d", bg: "rgba(93,111,125,0.1)",  label: "System" },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || { icon: "🔔", color: "#5d6f7d", bg: "rgba(93,111,125,0.1)", label: type?.replaceAll("_", " ") || "Notification" };
}

export default function NotificationPanel() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [preferences, setPreferences] = useState({
    bookingDecisionsEnabled: true,
    ticketStatusChangesEnabled: true,
    ticketCommentsEnabled: true
  });
  const panelRef = useRef(null);
  const unreadIdsRef = useRef(new Set());
  const hasLoadedRef = useRef(false);
  const filteredNotifications = notifications.filter((n) => matchesFilter(n, activeFilter));
  const unreadFiltered = filteredNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (user?.notificationPreferences) setPreferences(user.notificationPreferences);
  }, [user]);

  function syncUnreadState(items) {
    const unreadIds = new Set(items.filter((i) => !i.read).map((i) => i.id));
    unreadIdsRef.current = unreadIds;
    setCount(unreadIds.size);
  }

  async function loadNotifications(options = {}) {
    const { silent = false } = options;
    if (!user) {
      setNotifications([]); setCount(0); setError(""); setAlertMessage("");
      unreadIdsRef.current = new Set(); hasLoadedRef.current = false;
      return;
    }
    try {
      const [items, unread] = await Promise.all([api.getNotifications(), api.getUnreadCount()]);
      const newUnreadItems = items.filter((i) => !i.read && !unreadIdsRef.current.has(i.id));
      setNotifications(items);
      setCount(unread.count);
      setError("");
      unreadIdsRef.current = new Set(items.filter((i) => !i.read).map((i) => i.id));
      if (hasLoadedRef.current && !silent && newUnreadItems.length > 0) {
        setAlertMessage(newUnreadItems.length === 1 ? `New: ${newUnreadItems[0].title}` : `${newUnreadItems.length} new notifications.`);
      }
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!user) return undefined;
    loadNotifications();
    const intervalId = window.setInterval(() => loadNotifications(), POLL_INTERVAL_MS);
    const handleVisibility = () => { if (document.visibilityState === "visible") loadNotifications({ silent: true }); };
    const handleRefresh = () => loadNotifications();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener(REFRESH_EVENT_NAME, handleRefresh);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(REFRESH_EVENT_NAME, handleRefresh);
    };
  }, [user]);

  useEffect(() => {
    if (!alertMessage) return undefined;
    const id = window.setTimeout(() => setAlertMessage(""), 5000);
    return () => window.clearTimeout(id);
  }, [alertMessage]);

  useEffect(() => {
    if (location.hash !== "#notifications" || !panelRef.current) return undefined;
    const id = window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(id);
  }, [location.hash, notifications.length]);

  async function markOneRead(notificationId) {
    try {
      await api.markNotificationRead(notificationId);
      setNotifications((cur) => { const next = cur.map((i) => i.id === notificationId ? { ...i, read: true } : i); syncUnreadState(next); return next; });
    } catch (err) { setError(err.message); }
  }

  async function markAllRead() {
    try {
      await api.markAllNotificationsRead();
      setNotifications((cur) => { const next = cur.map((i) => ({ ...i, read: true })); syncUnreadState(next); return next; });
    } catch (err) { setError(err.message); }
  }

  async function deleteOne(notificationId) {
    try {
      await api.deleteNotification(notificationId);
      setNotifications((cur) => { const next = cur.filter((i) => i.id !== notificationId); syncUnreadState(next); return next; });
    } catch (err) { setError(err.message); }
  }

  function openNotificationTarget(notification) {
    if (!notification.read) {
      api.markNotificationRead(notification.id).catch(() => {});
      setNotifications((cur) => { const next = cur.map((i) => i.id === notification.id ? { ...i, read: true } : i); syncUnreadState(next); return next; });
    }
    if (notification.targetUrl) window.location.href = notification.targetUrl;
  }

  function handlePreferenceChange(e) {
    setPreferences((cur) => ({ ...cur, [e.target.name]: e.target.checked }));
    setPreferencesMessage(""); setError("");
  }

  async function savePreferences(e) {
    e.preventDefault();
    try {
      setPreferencesSaving(true);
      const updated = await api.updateNotificationPreferences(preferences);
      setUser((cur) => cur ? { ...cur, notificationPreferences: updated } : cur);
      setPreferences(updated);
      setPreferencesMessage("Preferences saved.");
    } catch (err) {
      if (user?.notificationPreferences) setPreferences(user.notificationPreferences);
      setError(err.message);
    } finally { setPreferencesSaving(false); }
  }

  return (
    <section id="notifications" ref={panelRef} style={{ display: "grid", gap: "1.25rem" }}>

      {/* Alert Banner */}
      {alertMessage ? (
        <div style={{ padding: "0.9rem 1.2rem", borderRadius: "14px", background: "linear-gradient(135deg, rgba(79,143,190,0.15), rgba(214,231,246,0.6))", border: "1px solid rgba(79,143,190,0.2)", color: "#214c71", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.6rem" }}>
          🔔 {alertMessage}
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      {/* Toolbar */}
      <div style={{ background: "var(--card)", borderRadius: "20px", border: "1px solid var(--outline)", padding: "1.2rem 1.4rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", boxShadow: "0 16px 40px rgba(16,33,29,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #214c71, #5f93bc)", display: "grid", placeItems: "center", fontSize: "1.3rem" }}>🔔</div>
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--muted)" }}>Inbox</p>
            <h3 style={{ margin: 0, color: "#173f61" }}>
              {count > 0 ? <span style={{ color: "#4f8fbe" }}>{count} unread</span> : "All caught up"}
            </h3>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Filter chips */}
          {FILTER_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => setActiveFilter(opt.value)}
              style={{
                padding: "0.45rem 1rem", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 700,
                background: activeFilter === opt.value ? "linear-gradient(135deg, #214c71, #5f93bc)" : "rgba(224,238,249,0.8)",
                color: activeFilter === opt.value ? "#f7fbff" : "#244866",
                border: "none", boxShadow: activeFilter === opt.value ? "0 6px 16px rgba(33,76,113,0.2)" : "none",
                transition: "all 0.18s ease"
              }}>
              {opt.label}
            </button>
          ))}
          <div style={{ width: "1px", height: "24px", background: "var(--outline)" }} />
          {/* Icon buttons */}
          <button type="button" onClick={() => loadNotifications({ silent: true })} title="Refresh"
            style={{ width: "38px", height: "38px", padding: 0, borderRadius: "999px", background: "rgba(224,238,249,0.8)", border: "none", boxShadow: "none", display: "grid", placeItems: "center", color: "#214c71" }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
          </button>
          <button type="button" onClick={() => setSettingsOpen((c) => !c)} title="Preferences"
            style={{ width: "38px", height: "38px", padding: 0, borderRadius: "999px", background: settingsOpen ? "linear-gradient(135deg, #214c71, #5f93bc)" : "rgba(224,238,249,0.8)", border: "none", boxShadow: "none", display: "grid", placeItems: "center", color: settingsOpen ? "#fff" : "#214c71" }}>
            <SettingsIcon />
          </button>
          <button type="button" onClick={markAllRead}
            style={{ padding: "0.45rem 1rem", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 700, background: "rgba(224,238,249,0.8)", color: "#244866", border: "none", boxShadow: "none" }}>
            Mark all read
          </button>
        </div>
      </div>

      {/* Preferences Panel */}
      {settingsOpen ? (
        <form onSubmit={savePreferences} style={{ background: "var(--card)", borderRadius: "20px", border: "1px solid var(--outline)", padding: "1.4rem", display: "grid", gap: "1rem", boxShadow: "0 16px 40px rgba(16,33,29,0.07)" }}>
          <div>
            <p className="eyebrow">Notification Preferences</p>
            <h3 style={{ margin: 0 }}>Choose which alerts reach your inbox</h3>
          </div>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {[
              { name: "bookingDecisionsEnabled", label: "Booking approvals & rejections", icon: "📋" },
              { name: "ticketStatusChangesEnabled", label: "Ticket status changes", icon: "🔄" },
              { name: "ticketCommentsEnabled", label: "New comments on my tickets", icon: "💬" },
            ].map((pref) => (
              <label key={pref.name} style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.85rem 1rem", borderRadius: "14px", background: "rgba(224,238,249,0.5)", border: "1px solid rgba(53,102,141,0.08)", cursor: "pointer" }}>
                <input type="checkbox" name={pref.name} checked={preferences[pref.name]} onChange={handlePreferenceChange} style={{ width: "auto", margin: 0 }} />
                <span style={{ fontSize: "1.1rem" }}>{pref.icon}</span>
                <span style={{ fontWeight: 600, color: "#244866" }}>{pref.label}</span>
              </label>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button type="submit" disabled={preferencesSaving} style={{ borderRadius: "12px", padding: "0.7rem 1.4rem" }}>
              {preferencesSaving ? "Saving…" : "Save Preferences"}
            </button>
            {preferencesMessage ? <span style={{ color: "#2e8b57", fontWeight: 600, fontSize: "0.88rem" }}>✓ {preferencesMessage}</span> : null}
          </div>
        </form>
      ) : null}

      {/* Notification List */}
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {filteredNotifications.length === 0 && !error ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: "var(--card)", borderRadius: "20px", border: "1px dashed rgba(53,102,141,0.16)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔕</div>
            <p style={{ margin: 0, color: "var(--muted)", fontWeight: 600 }}>No notifications for this filter.</p>
          </div>
        ) : null}

        {filteredNotifications.map((notification) => {
          const cfg = getTypeConfig(notification.type);
          return (
            <article key={notification.id} style={{
              background: notification.read ? "rgba(248,252,255,0.7)" : "var(--card)",
              borderRadius: "18px",
              border: notification.read ? "1px solid rgba(53,102,141,0.08)" : `1px solid ${cfg.color}33`,
              padding: "1.1rem 1.3rem",
              display: "grid", gap: "0.6rem",
              boxShadow: notification.read ? "none" : `0 8px 24px ${cfg.color}18`,
              opacity: notification.read ? 0.75 : 1,
              transition: "all 0.18s ease"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ width: "38px", height: "38px", borderRadius: "12px", background: cfg.bg, display: "grid", placeItems: "center", fontSize: "1.1rem", flexShrink: 0 }}>{cfg.icon}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cfg.color, background: cfg.bg, padding: "0.2rem 0.55rem", borderRadius: "999px" }}>{cfg.label}</span>
                      {!notification.read ? <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: cfg.color, display: "inline-block" }} /> : null}
                    </div>
                    <h4 style={{ margin: "0.2rem 0 0", fontSize: "0.95rem", color: "#173f61", fontWeight: 700 }}>{notification.title}</h4>
                  </div>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", whiteSpace: "nowrap", flexShrink: 0 }}>{formatNotificationTimestamp(notification.createdAt)}</span>
              </div>

              <p style={{ margin: "0 0 0 3.25rem", color: "#38556d", fontSize: "0.88rem", lineHeight: 1.6 }}>{notification.message}</p>

              <div style={{ display: "flex", gap: "0.6rem", marginLeft: "3.25rem", flexWrap: "wrap" }}>
                {notification.targetUrl ? (
                  <button type="button" onClick={() => openNotificationTarget(notification)}
                    style={{ padding: "0.4rem 0.9rem", borderRadius: "10px", fontSize: "0.82rem", background: `linear-gradient(135deg, ${cfg.color}dd, ${cfg.color})`, color: "#fff", border: "none", boxShadow: `0 4px 12px ${cfg.color}44` }}>
                    View →
                  </button>
                ) : null}
                {!notification.read ? (
                  <button type="button" onClick={() => markOneRead(notification.id)}
                    style={{ padding: "0.4rem 0.9rem", borderRadius: "10px", fontSize: "0.82rem", background: "rgba(224,238,249,0.8)", color: "#244866", border: "none", boxShadow: "none" }}>
                    Mark read
                  </button>
                ) : null}
                <button type="button" onClick={() => deleteOne(notification.id)}
                  style={{ padding: "0.4rem 0.9rem", borderRadius: "10px", fontSize: "0.82rem", background: "rgba(217,95,75,0.08)", color: "#d95f4b", border: "none", boxShadow: "none" }}>
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatNotificationTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now - date;
  const min = 60000, hour = 3600000, day = 86400000;
  if (diffMs < min) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / min)}m ago`;
  if (diffMs < day && date.toDateString() === now.toDateString()) return `Today ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  if (diffMs < 7 * day) return date.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function matchesFilter(notification, filter) {
  if (filter === "all") return true;
  if (filter === "booking") return ["BOOKING_APPROVED", "BOOKING_REJECTED", "BOOKING_CREATED", "BOOKING_CANCELLED"].includes(notification.type);
  if (filter === "tickets") return ["TICKET_STATUS_CHANGED", "TICKET_CREATED"].includes(notification.type);
  if (filter === "comments") return notification.type === "TICKET_COMMENT_ADDED";
  return true;
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="M19 12a7 7 0 0 0-.08-1l2.02-1.57-1.9-3.29-2.47.67a7.7 7.7 0 0 0-1.73-1L14.5 3h-5l-.34 2.81a7.7 7.7 0 0 0-1.73 1l-2.47-.67-1.9 3.29L5.08 11A7 7 0 0 0 5 12c0 .34.03.68.08 1l-2.02 1.57 1.9 3.29 2.47-.67c.53.41 1.11.75 1.73 1L9.5 21h5l.34-2.81c.62-.25 1.2-.59 1.73-1l2.47.67 1.9-3.29L18.92 13c.05-.32.08-.66.08-1Z" />
    </svg>
  );
}
