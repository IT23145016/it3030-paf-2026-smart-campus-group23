import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { api } from "../services/api";

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export default function SignUpPage() {
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.register({ email: form.email, password: form.password, fullName: form.fullName });
      navigate("/signin", { state: { message: "Account created! Please sign in." } });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-page">
      <SiteHeader />
      <div className="signup-page-shell">
        <section className="signup-auth-card">
          <div className="signup-auth-copy">
            <h2>Create Account</h2>
            <p>Join Smart Uni Hub and manage your campus services.</p>
          </div>

          <form className="signup-inline-form" onSubmit={handleSubmit} noValidate>
            <label className="signup-inline-field">
              <span>Full Name</span>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </label>

            <label className="signup-inline-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="signup-inline-field">
              <span>Password</span>
              <div className="signup-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create your password (min 8 chars)"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="signup-password-toggle" onClick={() => setShowPassword((c) => !c)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  <EyeIcon />
                </button>
              </div>
            </label>

            <label className="signup-inline-field">
              <span>Confirm Password</span>
              <div className="signup-password-wrap">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="signup-password-toggle" onClick={() => setShowConfirm((c) => !c)} aria-label={showConfirm ? "Hide password" : "Show password"}>
                  <EyeIcon />
                </button>
              </div>
            </label>

            {error ? <p className="error">{error}</p> : null}

            <button type="submit" className="signup-inline-submit" disabled={loading}>
              {loading ? "Creating Account…" : "Create Account"}
            </button>
          </form>

          <a className="signup-method-button signup-method-outline google" href={`${apiBaseUrl}/oauth2/authorization/google`}>
            <span className="signup-method-icon" aria-hidden="true">G</span>
            <span>Sign up with Google</span>
          </a>

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
