"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddUtilityBillForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/utilities", { method: "POST", body: new FormData(e.currentTarget) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed.");
      setMsg({ ok: true, text: "Bill logged as a Utilities expense and forwarded to the tenant." });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {msg && <div className={msg.ok ? "callout law" : "error"}>{msg.text}</div>}
      <div className="row2">
        <div className="field">
          <label htmlFor="u_provider">Provider</label>
          <input id="u_provider" name="provider" type="text" defaultValue="NV Energy" />
        </div>
        <div className="field">
          <label htmlFor="u_amount">Bill amount</label>
          <input id="u_amount" name="amount" type="number" step="0.01" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="u_period">Billing month</label>
        <input id="u_period" name="period" type="date" />
      </div>
      <div className="field">
        <label htmlFor="u_pdf">Bill PDF <span className="hint">optional — stored as the receipt</span></label>
        <input id="u_pdf" name="pdf" type="file" accept="application/pdf,image/*" />
      </div>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Saving…" : "Log & forward bill"}</button>
    </form>
  );
}
