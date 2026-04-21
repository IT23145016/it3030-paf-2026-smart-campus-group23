import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export default function ContactUsPage() {
  return (
    <div className="landing-page">
      <SiteHeader />

      <main className="public-page-layout">
        <section className="public-page-hero">
          <p className="eyebrow">Contact Us</p>
          <h1>Reach the campus operations team easily.</h1>
          <p className="hero-text">
            For platform guidance, resource updates, or operational support, use the contact details below.
          </p>
        </section>

        <section className="public-page-grid">
          <article className="feature-card">
            <p className="eyebrow">Office</p>
            <h2>Campus Operations Office</h2>
            <p>Main Administration Building, Level 2</p>
          </article>
          <article className="feature-card">
            <p className="eyebrow">Email</p>
            <h2>operations@smartcampus.edu</h2>
            <p>For general support, access questions, and catalogue update requests.</p>
          </article>
          <article className="feature-card">
            <p className="eyebrow">Phone</p>
            <h2>+94 11 245 7788</h2>
            <p>Available Monday to Friday, 8.30 AM to 5.00 PM.</p>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
