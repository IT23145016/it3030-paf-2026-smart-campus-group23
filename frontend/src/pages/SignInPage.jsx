import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export default function SignInPage() {
  const { authMessage } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  return (
    <div className="landing-page">
      <SiteHeader />
      <div className="signin-page">
        <section className="signin-panel">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>Sign in to your campus operations workspace.</h1>
            <p className="hero-text">
              Use your Google account to access notifications, role management, and the wider campus workflow.
            </p>
          </div>

          <div className="signin-checklist">
            <span>Google OAuth authentication</span>
            <span>Role-based dashboard access</span>
            <span>MongoDB-backed notifications</span>
          </div>

          {authMessage ? <p className="error">{authMessage}</p> : null}

          <a className="signin-button" href={`${apiBaseUrl}/oauth2/authorization/google`}>
            Continue with Google
          </a>

          <Link className="back-link" to="/">
            Back to welcome page
          </Link>
        </section>

        <section className="signin-sidecard">
          <p className="eyebrow">Inside the platform</p>
          <h2>See approvals, incidents, and admin controls in one place.</h2>
          <div className="signin-metrics">
            <article>
              <strong>Role aware</strong>
              <span>Users, admins, and technicians see the right actions.</span>
            </article>
            <article>
              <strong>Actionable alerts</strong>
              <span>Every booking and maintenance update can trigger a visible notification.</span>
            </article>
            <article>
              <strong>Built for teamwork</strong>
              <span>Your module is ready for the rest of the group to integrate with.</span>
            </article>
          </div>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
