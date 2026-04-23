import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { api } from "../services/api";

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

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

  // Forgot password state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [fpStep, setFpStep] = useState("email"); // email | otp | password
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpPassword, setFpPassword] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpShowPassword, setFpShowPassword] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpLoading, setFpLoading] = useState(false);

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

  function openForgot() {
    setForgotOpen(true);
    setFpStep("email");
    setFpEmail("");
    setFpOtp("");
    setFpPassword("");
    setFpConfirm("");
    setFpError("");
  }

  function closeForgot() {
    setForgotOpen(false);
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setFpError("");
    setFpLoading(true);
    try {
      await api.forgotPassword(fpEmail);
      setFpStep("otp");
    } catch (err) {
      setFpError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setFpLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setFpError("");
    if (fpPassword !== fpConfirm) {
      setFpError("Passwords do not match.");
      return;
    }
    if (fpPassword.length < 8) {
      setFpError("Password must be at least 8 characters.");
      return;
    }
    setFpLoading(true);
    try {
      await api.resetPassword({ email: fpEmail, otp: fpOtp, newPassword: fpPassword });
      setForgotOpen(false);
      navigate("/signin", { state: { message: "Password reset successfully. Please sign in." } });
    } catch (err) {
      setFpError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setFpLoading(false);
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

          {successMessage ? <p style={{ color: "#214c71", fontWeight: 600, textAlign: "center", margin: 0 }}>{successMessage}</p> : null}

          <form className="signin-form" onSubmit={handleSubmit} noValidate>
            <label className="signin-field-row">
              <span className="signin-field-label">Email</span>
              <div className="signin-input-wrap">
                <input type="email" name="email" placeholder="your email address" value={form.email} onChange={handleChange} required />
              </div>
            </label>

            <label className="signin-field-row">
              <span className="signin-field-label">Password</span>
              <div className="signin-input-wrap">
                <div className="signin-password-wrap">
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="your password" value={form.password} onChange={handleChange} required />
                  <button type="button" className="signin-password-toggle" onClick={() => setShowPassword((c) => !c)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    <EyeIcon />
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

          <button type="button" className="signin-forgot-link" onClick={openForgot}>
            Forgot your password?
          </button>

          <div className="signin-provider-list">
            <a className="signin-provider-button google" href={`${apiBaseUrl}/oauth2/authorization/google`}>
              <span className="signin-provider-icon" aria-hidden="true">G</span>
              <span>Continue with Google</span>
            </a>
          </div>

          <Link className="back-link" to="/">Back to home page</Link>
        </section>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,33,29,0.45)", zIndex: 50, display: "grid", placeItems: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px", padding: "2rem", maxWidth: "420px", width: "90%", boxShadow: "0 24px 60px rgba(33,76,113,0.18)", display: "grid", gap: "1.2rem" }}>

            {fpStep === "email" ? (
              <>
                <div>
                  <h3 style={{ margin: "0 0 0.4rem", color: "#173f61" }}>Forgot Password</h3>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>Enter your email and we'll send you a 6-digit OTP.</p>
                </div>
                <form onSubmit={handleSendOtp} style={{ display: "grid", gap: "1rem" }} noValidate>
                  <label className="signup-inline-field">
                    <span>Email</span>
                    <input type="email" placeholder="your email address" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} required />
                  </label>
                  {fpError ? <p className="error" style={{ margin: 0 }}>{fpError}</p> : null}
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button type="submit" disabled={fpLoading} style={{ flex: 1 }}>{fpLoading ? "Sending…" : "Send OTP"}</button>
                    <button type="button" className="secondary-button" onClick={closeForgot} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              </>
            ) : null}

            {fpStep === "otp" ? (
              <>
                <div>
                  <h3 style={{ margin: "0 0 0.4rem", color: "#173f61" }}>Enter OTP</h3>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>A 6-digit code was sent to <strong>{fpEmail}</strong>. Enter it below along with your new password.</p>
                </div>
                <form onSubmit={handleResetPassword} style={{ display: "grid", gap: "1rem" }} noValidate>
                  <label className="signup-inline-field">
                    <span>OTP Code</span>
                    <input type="text" placeholder="6-digit code" maxLength={6} value={fpOtp} onChange={(e) => setFpOtp(e.target.value)} required />
                  </label>
                  <label className="signup-inline-field">
                    <span>New Password</span>
                    <div className="signup-password-wrap">
                      <input type={fpShowPassword ? "text" : "password"} placeholder="min 8 characters" value={fpPassword} onChange={(e) => setFpPassword(e.target.value)} required />
                      <button type="button" className="signup-password-toggle" onClick={() => setFpShowPassword((c) => !c)} aria-label="Toggle password">
                        <EyeIcon />
                      </button>
                    </div>
                  </label>
                  <label className="signup-inline-field">
                    <span>Confirm Password</span>
                    <input type="password" placeholder="repeat new password" value={fpConfirm} onChange={(e) => setFpConfirm(e.target.value)} required />
                  </label>
                  {fpError ? <p className="error" style={{ margin: 0 }}>{fpError}</p> : null}
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button type="submit" disabled={fpLoading} style={{ flex: 1 }}>{fpLoading ? "Resetting…" : "Reset Password"}</button>
                    <button type="button" className="secondary-button" onClick={() => setFpStep("email")} style={{ flex: 1 }}>Back</button>
                  </div>
                </form>
              </>
            ) : null}

          </div>
        </div>
      ) : null}

      <SiteFooter />
    </div>
  );
}
