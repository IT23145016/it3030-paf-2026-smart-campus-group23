import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const POLL_INTERVAL_MS = 15000;
const REFRESH_EVENT_NAME = "scoh:refresh-notifications";
const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "booking", label: "Booking" },
  { value: "tickets", label: "Tickets" },
  { value: "comments", label: "Comments" }
];

export default function NotificationPanel() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
  const filteredNotifications = notifications.filter((notification) => matchesFilter(notification, activeFilter));

  useEffect(() => {
    if (!user?.notificationPreferences) {
      return;
    }

    setPreferences(user.notificationPreferences);
  }, [user]);

  function syncUnreadState(items) {
    const unreadIds = new Set(items.filter((item) => !item.read).map((item) => item.id));
    unreadIdsRef.current = unreadIds;
    setCount(unreadIds.size);
  }

  async function loadNotifications(options = {}) {
    const { silent = false } = options;

    if (!user) {
      setNotifications([]);
      setCount(0);
      setError("");
      setAlertMessage("");
      unreadIdsRef.current = new Set();
      hasLoadedRef.current = false;
      return;
    }

    try {
      const [items, unread] = await Promise.all([api.getNotifications(), api.getUnreadCount()]);
      const newUnreadItems = items.filter((item) => !item.read && !unreadIdsRef.current.has(item.id));

      setNotifications(items);
      setCount(unread.count);
      setError("");

      unreadIdsRef.current = new Set(items.filter((item) => !item.read).map((item) => item.id));

      if (hasLoadedRef.current && !silent && newUnreadItems.length > 0) {
        setAlertMessage(
          newUnreadItems.length === 1
            ? `New alert: ${newUnreadItems[0].title}`
            : `${newUnreadItems.length} new notifications received.`
        );
      }

      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    loadNotifications();

    const intervalId = window.setInterval(() => {
      loadNotifications();
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotifications({ silent: true });
      }
    };

    const handleRefreshRequest = () => {
      loadNotifications();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(REFRESH_EVENT_NAME, handleRefreshRequest);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(REFRESH_EVENT_NAME, handleRefreshRequest);
    };
  }, [user]);

  useEffect(() => {
    if (!alertMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setAlertMessage("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [alertMessage]);

  useEffect(() => {
    if (location.hash !== "#notifications" || !panelRef.current) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash, notifications.length, error]);

  async function markOneRead(notificationId) {
    try {
      await api.markNotificationRead(notificationId);
      setNotifications((current) => {
        const next = current.map((item) => (item.id === notificationId ? { ...item, read: true } : item));
        syncUnreadState(next);
        return next;
      });
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function markAllRead() {
    try {
      await api.markAllNotificationsRead();
      setNotifications((current) => {
        const next = current.map((item) => ({ ...item, read: true }));
        syncUnreadState(next);
        return next;
      });
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteOne(notificationId) {
    try {
      await api.deleteNotification(notificationId);
      setNotifications((current) => {
        const next = current.filter((item) => item.id !== notificationId);
        syncUnreadState(next);
        return next;
      });
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function openNotificationTarget(notification) {
    if (!notification.read) {
      api.markNotificationRead(notification.id).catch(() => {});
      setNotifications((current) => {
        const next = current.map((item) => (item.id === notification.id ? { ...item, read: true } : item));
        syncUnreadState(next);
        return next;
      });
    }
    if (notification.targetUrl) {
      window.location.href = notification.targetUrl;
    }
  }

  function handlePreferenceChange(event) {
    const { name, checked } = event.target;
    setPreferences((current) => ({ ...current, [name]: checked }));
    setPreferencesMessage("");
    setError("");
  }

  async function savePreferences(event) {
    event.preventDefault();
    try {
      setPreferencesSaving(true);
      const updatedPreferences = await api.updateNotificationPreferences(preferences);
      setUser((current) => (current ? { ...current, notificationPreferences: updatedPreferences } : current));
      setPreferences(updatedPreferences);
      setPreferencesMessage("Notification preferences updated.");
      setError("");
    } catch (err) {
      if (user?.notificationPreferences) {
        setPreferences(user.notificationPreferences);
      }
      setError(err.message);
    } finally {
      setPreferencesSaving(false);
    }
  }

  return (
    <section className="panel" id="notifications" ref={panelRef}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Live Inbox</p>
          <h2>{count} unread</h2>
        </div>
        <div className="notification-toolbar">
          <button
            type="button"
            className="secondary-button notification-settings-button"
            onClick={() => setSettingsOpen((current) => !current)}
            aria-label="Notification settings"
            title="Notification settings"
          >
            <SettingsIcon />
          </button>
          <button type="button" className="secondary-button" onClick={() => loadNotifications({ silent: true })}>
            Refresh
          </button>
          <button type="button" onClick={markAllRead}>
            Mark all read
          </button>
        </div>
      </div>

      {alertMessage ? <p className="notification-alert">{alertMessage}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {settingsOpen ? (
        <form className="notification-preferences-card" onSubmit={savePreferences}>
          <div>
            <p className="eyebrow">Preferences</p>
            <h3>Choose which alerts reach your inbox.</h3>
          </div>
          <label className="notification-toggle">
            <input
              type="checkbox"
              name="bookingDecisionsEnabled"
              checked={preferences.bookingDecisionsEnabled}
              onChange={handlePreferenceChange}
            />
            <span>Booking approval and rejection</span>
          </label>
          <label className="notification-toggle">
            <input
              type="checkbox"
              name="ticketStatusChangesEnabled"
              checked={preferences.ticketStatusChangesEnabled}
              onChange={handlePreferenceChange}
            />
            <span>Ticket status changes</span>
          </label>
          <label className="notification-toggle">
            <input
              type="checkbox"
              name="ticketCommentsEnabled"
              checked={preferences.ticketCommentsEnabled}
              onChange={handlePreferenceChange}
            />
            <span>New comments on my tickets</span>
          </label>
          <div className="notification-preferences-actions">
            <button type="submit" disabled={preferencesSaving}>
              {preferencesSaving ? "Saving..." : "Save preferences"}
            </button>
            {preferencesMessage ? <p className="muted">{preferencesMessage}</p> : null}
          </div>
        </form>
      ) : null}

      <div className="notification-filter-bar" aria-label="Notification filters">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`secondary-button notification-filter-chip ${activeFilter === option.value ? "active" : ""}`}
            onClick={() => setActiveFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="notification-list">
        {filteredNotifications.map((notification) => (
          <article className={`notification-card ${notification.read ? "read" : ""}`} key={notification.id}>
            <span className="badge">{notification.type.replaceAll("_", " ")}</span>
            <h3>{notification.title}</h3>
            <p className="notification-time">{formatNotificationTimestamp(notification.createdAt)}</p>
            <p>{notification.message}</p>
            <div className="booking-actions">
              {notification.targetUrl ? (
                <button type="button" onClick={() => openNotificationTarget(notification)}>
                  View related item
                </button>
              ) : null}
              {!notification.read ? (
                <button type="button" className="secondary-button" onClick={() => markOneRead(notification.id)}>
                  Mark read
                </button>
              ) : null}
              <button type="button" className="secondary-button" onClick={() => deleteOne(notification.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
        {!filteredNotifications.length && !error ? <p className="muted">No notifications found for this filter.</p> : null}
      </div>
    </section>
  );
}

function formatNotificationTimestamp(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < minuteMs) {
    return "Just now";
  }

  if (diffMs < hourMs) {
    const minutes = Math.floor(diffMs / minuteMs);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (diffMs < dayMs && date.toDateString() === now.toDateString()) {
    return `Today ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  if (diffMs < 7 * dayMs) {
    return date.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function matchesFilter(notification, filter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "booking") {
    return notification.type === "BOOKING_APPROVED" || notification.type === "BOOKING_REJECTED" || notification.type === "BOOKING_CREATED";
  }

  if (filter === "tickets") {
    return notification.type === "TICKET_STATUS_CHANGED" || notification.type === "TICKET_CREATED";
  }

  if (filter === "comments") {
    return notification.type === "TICKET_COMMENT_ADDED";
  }

  return true;
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19 12a7 7 0 0 0-.08-1l2.02-1.57-1.9-3.29-2.47.67a7.7 7.7 0 0 0-1.73-1L14.5 3h-5l-.34 2.81a7.7 7.7 0 0 0-1.73 1l-2.47-.67-1.9 3.29L5.08 11A7 7 0 0 0 5 12c0 .34.03.68.08 1l-2.02 1.57 1.9 3.29 2.47-.67c.53.41 1.11.75 1.73 1L9.5 21h5l.34-2.81c.62-.25 1.2-.59 1.73-1l2.47.67 1.9-3.29L18.92 13c.05-.32.08-.66.08-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
