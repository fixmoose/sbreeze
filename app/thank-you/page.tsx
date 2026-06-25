import Link from "next/link";
import type { Metadata } from "next";
import { property } from "@/data/property";

export const metadata: Metadata = { title: "Application received — thank you" };

export default function ThankYou() {
  return (
    <main>
      <section style={{ borderBottom: "none", minHeight: "70vh", display: "flex", alignItems: "center" }}>
        <div className="container center" style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 56 }}>✅</div>
          <h1>Thank you — your application was received.</h1>
          <p className="lead" style={{ margin: "12px auto 24px" }}>
            We review every application against the same written criteria. If your application
            qualifies, we’ll email you a secure link to complete the credit &amp; background screening.
            Most applicants hear back within 1–2 business days.
          </p>
          <p className="small muted">
            Questions? Use the contact form on our home page. The home is available for scheduled self-showings via lockbox.
          </p>
          <p style={{ marginTop: 28 }}>
            <Link className="btn" href="/">← Back to the {property.name} listing</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
