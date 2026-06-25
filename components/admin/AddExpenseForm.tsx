"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SCHEDULE_E_CATEGORIES } from "@/data/tax";

export default function AddExpenseForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      // Send as multipart so the receipt file rides along.
      const res = await fetch("/api/expenses", { method: "POST", body: new FormData(e.currentTarget) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed.");
      setMsg({ ok: true, text: "Expense saved." });
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
          <label htmlFor="expense_date">Date</label>
          <input id="expense_date" name="expense_date" type="date" required />
        </div>
        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input id="amount" name="amount" type="number" step="0.01" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="category">Schedule E category</label>
        <select id="category" name="category" required defaultValue="">
          <option value="" disabled>Select…</option>
          {SCHEDULE_E_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="vendor">Vendor / payee</label>
          <input id="vendor" name="vendor" type="text" placeholder="e.g. ABC Cleaning" />
        </div>
        <div className="field">
          <label htmlFor="vendor_is_individual">Paid an individual/sole proprietor?</label>
          <select id="vendor_is_individual" name="vendor_is_individual" defaultValue="no">
            <option value="no">No (company)</option>
            <option value="yes">Yes (may need 1099-NEC)</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <input id="description" name="description" type="text" />
      </div>
      <div className="field">
        <label htmlFor="receipt">Receipt (image or PDF) <span className="hint">optional</span></label>
        <input id="receipt" name="receipt" type="file" accept="image/*,application/pdf" />
      </div>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Saving…" : "Add expense"}</button>
    </form>
  );
}
