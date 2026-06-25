"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LeaseOption = { id: string; label: string };

export default function RecordPaymentForm({ leases }: { leases: LeaseOption[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/payments/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed.");
      setMsg({ ok: true, text: "Payment recorded." });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Failed." });
    } finally {
      setBusy(false);
    }
  }

  if (!leases.length) {
    return <p className="muted">Create a lease first, then you can record check/ACH payments here.</p>;
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {msg && <div className={msg.ok ? "callout law" : "error"}>{msg.text}</div>}
      <div className="field">
        <label htmlFor="lease_id">Tenant / lease</label>
        <select id="lease_id" name="lease_id" required defaultValue="">
          <option value="" disabled>Select…</option>
          {leases.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input id="amount" name="amount" type="number" step="0.01" defaultValue={2395} required />
        </div>
        <div className="field">
          <label htmlFor="method">Method</label>
          <select id="method" name="method" defaultValue="check">
            <option value="check">Check</option>
            <option value="ach">ACH</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="paid_for_month">For month</label>
          <input id="paid_for_month" name="paid_for_month" type="date" />
        </div>
        <div className="field">
          <label htmlFor="note">Note</label>
          <input id="note" name="note" type="text" placeholder="e.g. check #1042" />
        </div>
      </div>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Saving…" : "Record payment"}</button>
    </form>
  );
}
