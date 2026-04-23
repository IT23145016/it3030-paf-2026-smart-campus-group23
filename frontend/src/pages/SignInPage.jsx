import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { api } from "../services/api";

export default function SignInPage() {
  const { setUser, authMessage } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.message || "";

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await api.login({ email: form.email, password: form.password });
      setUser(user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Sign in failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-page">
      <SiteHeader />
      <div className="signin-page signin-theme-page">
        <section className="signin-panel signin-action-card signin-theme-card">
          <div className="signin-card-copy">
            <h2>Welcome back</h2>
            <p>Sign in to continue with your campus workspace and active requests.</p>
          </div>

          {successMessage ? <p className="success">{successMessage}</p> : null}

          <form className="signin-form" onSubmit={handleSubmit}>
            <label className="signin-field-row">
              <span className="signin-field-label">Email</span>
              <div className="signin-input-wrap">
                <input
                  type="email"
                  name="email"
                  placeholder="your email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </label>

            <label className="signin-field-row">
              <span className="signin-field-label">Password</span>
              <div className="signin-input-wrap">
                <div className="signin-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="signin-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </button>
                </div>
              </div>
            </label>

            {error ? <p className="error">{error}</p> : null}
            {authMessage ? <p className="error">{authMessage}</p> : null}

            <button type="submit" className="signin-submit-button" disabled={loading}>
              {loading ? "Logging In…" : "Log In"}
            </button>

            <p className="signup-meta">
              Need a new account? <Link to="/signup">Create one here</Link>
            </p>
          </form>

          <div className="signin-provider-list">
            <a className="signin-provider-button google" href={`${apiBaseUrl}/oauth2/authorization/google`}>
              <span className="signin-provider-icon" aria-hidden="true">G</span>
              <span>Continue with Google</span>
            </a>
          </div>

          <Link className="back-link" to="/">
            Back to home page
          </Link>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
