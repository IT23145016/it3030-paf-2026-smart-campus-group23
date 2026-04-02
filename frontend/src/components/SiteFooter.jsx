import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SiteFooter({ compact = false }) {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN");

  return (
    <footer className={`site-footer ${compact ? "compact" : ""}`}>
      <div className="footer-columns">
        <section>
          <p className="footer-heading">Platform</p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/resources">Facilities Catalogue</Link>
            {isAdmin ? <Link to="/dashboard">Dashboard</Link> : null}
            {isAdmin ? <Link to="/admin/roles">Role Management</Link> : null}
          </div>
        </section>

        <section id="footer-contact">
          <p className="footer-heading">Contact Us</p>
          <div className="footer-links">
            <span>Campus Operations Office</span>
            <span>operations@smartcampus.edu</span>
            <span>+94 11 245 7788</span>
            <span>Mon - Fri, 8.30 AM - 5.00 PM</span>
          </div>
        </section>

        <section id="footer-help">
          <p className="footer-heading">Help & Support</p>
          <div className="footer-links">
            <span>How to request a facility</span>
            <span>How to update resource records</span>
            <span>Support for administrators</span>
            <span>Access and account guidance</span>
          </div>
        </section>
      </div>

      <div className="footer-bottom">
        <div className="footer-copyright">
          <span>&copy; 2026 Smart Campus Operations Hub. All rights reserved. Designed for clear, auditable campus operations.</span>
        </div>
        <div className="social-links">
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">
            <InstagramIcon />
          </a>
          <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">
            <FacebookIcon />
          </a>
          <a href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter">
            <TwitterIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M13.5 21v-7h2.5l.4-3h-2.9V9.1c0-.9.3-1.6 1.6-1.6H16.5V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.3v7h3.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M18.9 4H21l-4.7 5.4L22 20h-4.5l-3.6-5.5L9.1 20H7l5-5.8L2 4h4.6l3.2 5 4.1-5Z"
        fill="currentColor"
      />
    </svg>
  );
}
