import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export default function SignInPage() {
  const { authMessage } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="landing-page">
      <SiteHeader />
      <div className="signin-page signin-theme-page">
        <section className="signin-panel signin-action-card signin-theme-card">
          <div className="signin-card-copy">
            <h2>Welcome back</h2>
            <p>Sign in to continue with your campus workspace and active requests.</p>
          </div>

          <form className="signin-form" onSubmit={(event) => event.preventDefault()}>
            <label className="signin-field-row">
              <span className="signin-field-label">Email</span>
              <div className="signin-input-wrap">
                <input type="email" placeholder="your email address" />
              </div>
            </label>

            <label className="signin-field-row">
              <span className="signin-field-label">Password</span>
              <div className="signin-input-wrap">
                <div className="signin-password-wrap">
                  <input type={showPassword ? "text" : "password"} placeholder="your password" />
                  <button
                    type="button"
                    className="signin-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </label>

            <button type="submit" className="signin-submit-button">
              Sign In with Email
            </button>
          </form>

          <button type="button" className="signin-forgot-link">
            Forgot your password?
          </button>

          {authMessage ? <p className="error">{authMessage}</p> : null}

          <div className="signin-provider-list">
            <a className="signin-provider-button google" href={`${apiBaseUrl}/oauth2/authorization/google`}>
              <span className="signin-provider-icon" aria-hidden="true">
                G
              </span>
              <span>Sign in with Google</span>
            </a>
          </div>

          <p className="signup-meta">
            Need a new account? <Link to="/signup">Create one here</Link>
          </p>

          <Link className="back-link" to="/">
            Back to home page
          </Link>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
