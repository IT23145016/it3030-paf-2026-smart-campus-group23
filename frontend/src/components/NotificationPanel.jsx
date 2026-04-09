import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const POLL_INTERVAL_MS = 15000;
const REFRESH_EVENT_NAME = "scoh:refresh-notifications";

export default function NotificationPanel() {
  const { user } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const panelRef = useRef(null);
  const unreadIdsRef = useRef(new Set());
  const hasLoadedRef = useRef(false);

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

  return (
    <section className="panel" id="notifications" ref={panelRef}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Live Inbox</p>
          <h2>{count} unread</h2>
        </div>
        <div className="notification-toolbar">
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

      <div className="notification-list">
        {notifications.map((notification) => (
          <article className={`notification-card ${notification.read ? "read" : ""}`} key={notification.id}>
            <span className="badge">{notification.type.replaceAll("_", " ")}</span>
            <h3>{notification.title}</h3>
            <p>{notification.message}</p>
            <div className="booking-actions">
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
        {!notifications.length && !error ? <p className="muted">No notifications yet.</p> : null}
      </div>
    </section>
  );
}
