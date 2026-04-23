import NotificationPanel from "../components/NotificationPanel";
import Shell from "../components/Shell";

export default function NotificationsPage() {
  return (
    <Shell title="Notifications">
      <section className="hero-card accent-card" style={{ padding: "1.8rem" }}>
        <p className="eyebrow">Live Inbox</p>
        <h2 style={{ marginBottom: "0.4rem" }}>Your Notification Centre</h2>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Stay on top of booking decisions, ticket updates, and new activity across the platform.
        </p>
      </section>
      <NotificationPanel />
    </Shell>
  );
}
