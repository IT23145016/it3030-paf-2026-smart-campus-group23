import { useState } from "react";
import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export default function SignUpPage() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="landing-page">
      <SiteHeader />
      <div className="signup-page-shell">
        <section className="signup-auth-card">
          <div className="signup-auth-copy">
            <h2>Let&apos;s Get Started</h2>
            <p>Create your Smart Uni Hub account and continue with the platform.</p>
          </div>

          <div className="signup-auth-actions">
            <button
              type="button"
              className="signup-method-button signup-method-primary"
              onClick={() => setShowEmailForm((current) => !current)}
            >
              <span className="signup-method-icon" aria-hidden="true">
                @
              </span>
              <span>{showEmailForm ? "Hide Email Form" : "Sign Up with Email"}</span>
            </button>

            {showEmailForm ? (
              <form className="signup-inline-form" onSubmit={(event) => event.preventDefault()}>
                <label className="signup-inline-field">
                  <span>Email</span>
                  <input type="email" placeholder="Enter your email" />
                </label>

                <label className="signup-inline-field">
                  <span>Password</span>
                  <div className="signup-password-wrap">
                    <input type={showPassword ? "text" : "password"} placeholder="Create your password" />
                    <button
                      type="button"
                      className="signup-password-toggle"
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
                </label>

                <button type="submit" className="signup-inline-submit">
                  Create Account
                </button>
              </form>
            ) : null}

            <button type="button" className="signup-method-button signup-method-outline google">
              <span className="signup-method-icon" aria-hidden="true">
                G
              </span>
              <span>Sign up with Google</span>
            </button>
          </div>

          <p className="signup-terms">
            By continuing you agree to our
            <br />
            Terms &amp; Conditions and Privacy Policy
          </p>

          <p className="signup-login-link">
            Already have an account? <Link to="/signin">Log in</Link>
          </p>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
