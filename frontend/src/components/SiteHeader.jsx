import { Link } from "react-router-dom";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-mark" to="/">
        <span className="brand-icon">SC</span>
        <span>
          <strong>Smart Campus Operations Hub</strong>
          <small>Facilities, maintenance, and governance in one workspace</small>
        </span>
      </Link>

      <nav className="site-nav">
        <Link to="/">Home</Link>
        <Link to="/resources">Facilities</Link>
        <Link to="/signin">Sign In</Link>
      </nav>

      <Link className="solid-link header-cta" to="/resources">
        Explore Catalogue
      </Link>
    </header>
  );
}
