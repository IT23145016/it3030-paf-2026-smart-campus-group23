import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import SupportAssistant from "../components/SupportAssistant";
import landingBanner from "../assets/landing banner.jpg";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <SiteHeader />

      <main className="landing-hero">
        <section
          className="landing-copy"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(24, 18, 14, 0.24), rgba(24, 18, 14, 0.56)), url(${landingBanner})`
          }}
        >
          <p className="eyebrow">Smart Campus Operations</p>
          <h1>One place for facilities, requests, and updates.</h1>
          <p className="hero-text">Browse campus resources, manage operations, and keep everyone informed with less effort.</p>
          <div className="landing-actions">
            <Link className="solid-link" to="/signin">
              Google Access
            </Link>
            <a className="ghost-link" href="#highlights">
              View Features
            </a>
          </div>
          <div className="landing-highlights">
            <span>Facilities catalogue</span>
            <span>Booking workflows</span>
            <span>Maintenance tracking</span>
          </div>
        </section>
      </main>

      <section className="landing-banner">
        <div className="landing-banner-copy">
          <p className="eyebrow">Campus Banner</p>
          <h2>Built for daily university operations.</h2>
          <p>Clear facilities, smoother requests, and better visibility for staff and students.</p>
        </div>
        <div className="landing-banner-metrics">
          <article>
            <strong>Facilities</strong>
            <span>Rooms, labs, and shared equipment in one catalogue.</span>
          </article>
          <article>
            <strong>Requests</strong>
            <span>Organised booking and maintenance workflows.</span>
          </article>
          <article>
            <strong>Visibility</strong>
            <span>Status, access, and updates available in one place.</span>
          </article>
        </div>
      </section>

      <section className="feature-strip" id="highlights">
        <article className="feature-card">
          <p className="eyebrow">Facilities</p>
          <h2>Find the right space fast.</h2>
          <p>Search rooms, labs, and equipment by type, location, and status.</p>
        </article>
        <article className="feature-card">
          <p className="eyebrow">Bookings</p>
          <h2>Keep requests organised.</h2>
          <p>Support a simple booking flow for shared spaces and assets.</p>
        </article>
        <article className="feature-card">
          <p className="eyebrow">Maintenance</p>
          <h2>Track operational issues clearly.</h2>
          <p>Monitor status changes, updates, and service actions in one workflow.</p>
        </article>
        <article className="feature-card">
          <p className="eyebrow">Access</p>
          <h2>Give the right people the right view.</h2>
          <p>Use role-based access for admins, technicians, and regular users.</p>
        </article>
      </section>

      <SiteFooter />
      <SupportAssistant />
    </div>
  );
}
