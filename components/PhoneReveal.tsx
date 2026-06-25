"use client";

import { useState } from "react";

// The real number is NOT in the page source. It's fetched from /api/contact-phone
// only when the user clicks, so scrapers/auto-dialers can't harvest it.
export default function PhoneReveal() {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reveal() {
    setLoading(true);
    try {
      const res = await fetch("/api/contact-phone");
      const json = await res.json();
      setPhone(json.phone || null);
    } catch {
      setPhone(null);
    } finally {
      setLoading(false);
    }
  }

  if (phone) {
    return <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} style={{ fontWeight: 700 }}>{phone}</a>;
  }

  return (
    <button
      type="button"
      onClick={reveal}
      disabled={loading}
      aria-label="Click to reveal phone number"
      title="Click to show"
      style={{
        filter: loading ? "none" : "blur(5px)",
        cursor: "pointer",
        background: "none",
        border: "none",
        font: "inherit",
        fontWeight: 700,
        color: "var(--brand-deep)",
        padding: 0,
        userSelect: "none",
      }}
    >
      {loading ? "…" : "(775) 000-0000"}
    </button>
  );
}
