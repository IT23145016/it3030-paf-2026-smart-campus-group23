import NotificationPanel from "../components/NotificationPanel";
import Shell from "../components/Shell";

export default function NotificationsPage() {
  return (
    <Shell title="Notifications">
      <section className="hero-card accent-card">
        <p className="eyebrow">Inbox</p>
        <h2>See every alert in one dedicated place.</h2>
        <p>Track booking decisions, ticket status changes, and ticket comments without mixing them into other pages.</p>
      </section>

      <NotificationPanel />
    </Shell>
  );
}
