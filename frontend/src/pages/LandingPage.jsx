import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <SiteHeader />

      <main className="landing-hero">
        <section className="landing-copy">
          <p className="eyebrow">Operations with clarity</p>
          <h1>One calm workspace for campus bookings, maintenance, and decisions.</h1>
          <p className="hero-text">
            Smart Campus Operations Hub brings together approvals, incidents, technician updates, and
            role-based oversight so staff can act quickly without losing accountability.
          </p>
          <div className="landing-actions">
            <Link className="ghost-link" to="/resources">
              Explore Facilities
            </Link>
            <Link className="solid-link" to="/signin">
              Continue to Sign In
            </Link>
            <a className="ghost-link" href="#highlights">
              Explore Features
            </a>
          </div>
        </section>

        <section className="showcase-card">
          <div className="showcase-ribbon">Live campus snapshot</div>
          <div className="showcase-grid">
            <article>
              <span>Resources</span>
              <strong>214</strong>
              <small>rooms, labs, and equipment catalogued</small>
            </article>
            <article>
              <span>Open tickets</span>
              <strong>18</strong>
              <small>with technician workflows and comments</small>
            </article>
            <article>
              <span>Notifications</span>
              <strong>Real-time</strong>
              <small>booking, maintenance, and role-change updates</small>
            </article>
            <article>
              <span>Access</span>
              <strong>Secure</strong>
              <small>Google OAuth plus role-based visibility</small>
            </article>
          </div>
        </section>
      </main>

      <section className="feature-strip" id="highlights">
        <article className="feature-card">
          <p className="eyebrow">Facilities</p>
          <h2>Catalogue rooms, labs, and equipment clearly.</h2>
          <p>Search by type, location, capacity, and operational status before any booking request is made.</p>
        </article>
        <article className="feature-card">
          <p className="eyebrow">Bookings</p>
          <h2>Prevent clashes before they happen.</h2>
          <p>Support clear approval workflows for lecture halls, labs, meeting rooms, and assets.</p>
        </article>
        <article className="feature-card">
          <p className="eyebrow">Governance</p>
          <h2>Stay audit-ready without slowing people down.</h2>
          <p>Notify the right people, control roles centrally, and keep every status change visible.</p>
        </article>
      </section>

      <SiteFooter />
    </div>
  );
}
