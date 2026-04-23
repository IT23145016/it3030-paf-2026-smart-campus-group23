import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export default function HelpPage() {
  return (
    <div className="landing-page">
      <SiteHeader />

      <main className="public-page-layout">
        <section className="public-page-hero">
          <p className="eyebrow">Help Centre</p>
          <h1>Find quick guidance for using Smart Uni Hub.</h1>
          <p className="hero-text">
            Get simple support for facilities browsing, sign-in, notifications, and role-based access across
            the platform.
          </p>
        </section>

        <section className="public-page-grid">
          <article className="feature-card">
            <p className="eyebrow">Facilities</p>
            <h2>How do I browse available resources?</h2>
            <p>Open the facilities catalogue to search by type, location, capacity, and current operational status.</p>
          </article>
          <article className="feature-card">
            <p className="eyebrow">Accounts</p>
            <h2>How do I access more features?</h2>
            <p>Use the login button with your Google account to unlock bookings, notifications, and personal access.</p>
          </article>
          <article className="feature-card">
            <p className="eyebrow">Support</p>
            <h2>Who can help if something looks wrong?</h2>
            <p>Administrators manage catalogue records and roles, while technicians handle operational fault workflows.</p>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
