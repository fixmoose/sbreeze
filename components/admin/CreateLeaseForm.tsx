"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateLeaseForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed.");
      setMsg({ ok: true, text: "Lease created and linked to the tenant." });
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
      <div className="field">
        <label htmlFor="tenant_email">Tenant email <span className="hint">(they must have signed up first)</span></label>
        <input id="tenant_email" name="tenant_email" type="email" required />
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="rent">Monthly rent</label>
          <input id="rent" name="rent" type="number" step="0.01" defaultValue={2395} />
        </div>
        <div className="field">
          <label htmlFor="deposit">Deposit</label>
          <input id="deposit" name="deposit" type="number" step="0.01" defaultValue={2395} />
        </div>
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="start_date">Lease start</label>
          <input id="start_date" name="start_date" type="date" />
        </div>
        <div className="field">
          <label htmlFor="end_date">Lease end</label>
          <input id="end_date" name="end_date" type="date" />
        </div>
      </div>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Saving…" : "Create lease"}</button>
    </form>
  );
}
