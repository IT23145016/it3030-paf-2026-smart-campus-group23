import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export default function AboutUsPage() {
  return (
    <div className="landing-page">
      <SiteHeader />

      <main className="public-page-layout">
        <section className="public-page-hero">
          <p className="eyebrow">About Us</p>
          <h1>A smarter way to manage daily campus operations.</h1>
          <p className="hero-text">
            Smart Uni Hub is designed to bring facilities, asset information, maintenance coordination, and
            role-based oversight into one clear university workspace.
          </p>
        </section>

        <section className="public-page-grid">
          <article className="feature-card">
            <p className="eyebrow">Purpose</p>
            <h2>Support reliable campus services.</h2>
            <p>We help staff and students see what is available, understand operational status, and act with confidence.</p>
          </article>
          <article className="feature-card">
            <p className="eyebrow">Platform</p>
            <h2>One system for connected operations.</h2>
            <p>The platform combines facilities visibility, notifications, administrative controls, and future-ready workflows.</p>
          </article>
          <article className="feature-card">
            <p className="eyebrow">Vision</p>
            <h2>Clear information for better decisions.</h2>
            <p>Every update is designed to be visible, accountable, and useful across the wider university environment.</p>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
