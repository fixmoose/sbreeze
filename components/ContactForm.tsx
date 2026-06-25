"use client";

import { useState } from "react";

export default function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    // Honeypot: real users leave this empty; bots fill everything.
    if (fd.get("company")) {
      setDone(true);
      return;
    }
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not send. Please try again.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
      setBusy(false);
    }
  }

  if (done) {
    return <div className="callout law">✅ Thanks — your message was sent. We’ll get back to you soon.</div>;
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {error && <div className="error">{error}</div>}
      <div className="row2">
        <div className="field">
          <label htmlFor="c_name">Your name <span className="req">*</span></label>
          <input id="c_name" name="name" type="text" required />
        </div>
        <div className="field">
          <label htmlFor="c_email">Your email <span className="req">*</span></label>
          <input id="c_email" name="email" type="email" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="c_phone">Your phone</label>
        <input id="c_phone" name="phone" type="tel" />
      </div>
      <div className="field">
        <label htmlFor="c_message">Message <span className="req">*</span></label>
        <textarea id="c_message" name="message" required placeholder="Ask a question or request a showing time."></textarea>
      </div>
      {/* honeypot — hidden from humans */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off"
             style={{ position: "absolute", left: "-9999px" }} aria-hidden="true" />
      <button className="btn" type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
    </form>
  );
}
