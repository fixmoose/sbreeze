"use client";

import { useState } from "react";

export default function AutoPayButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/paypal/create-subscription", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Could not start setup.");
      window.location.href = json.approveUrl; // off to PayPal to approve
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button className="btn" onClick={start} disabled={busy}>
        {busy ? "Redirecting to PayPal…" : "Set up automatic monthly payment"}
      </button>
    </div>
  );
}
