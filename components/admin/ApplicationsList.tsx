"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/data/property";

type App = Record<string, any>;

const STATUSES = ["new", "screening", "approved", "declined"] as const;

// [field key, friendly label] — shown in the expanded view.
const FIELDS: [string, string][] = [
  ["email", "Email"],
  ["phone", "Phone"],
  ["desired_move_in", "Desired move-in"],
  ["lease_term_ok", "OK with 12-month lease"],
  ["total_occupants", "Total occupants"],
  ["adults", "Adults (18+)"],
  ["occupant_names", "Names & ages"],
  ["employment_status", "Employment"],
  ["monthly_income", "Monthly income"],
  ["employer", "Employer / source"],
  ["pets", "Pets"],
  ["vehicles", "Vehicles"],
  ["vehicles_registered", "Vehicles reg. & insured"],
  ["smoker", "Smoker"],
  ["current_address", "Current address"],
  ["landlord_contact", "Current landlord"],
  ["reason_moving", "Reason for moving"],
  ["ever_evicted", "Ever evicted"],
  ["bankruptcy", "Bankruptcy (5y)"],
  ["dob_year", "Birth year"],
  ["notes", "Applicant notes"],
];

function fmt(key: string, val: any): string {
  if (val == null || val === "") return "—";
  if (key === "monthly_income") {
    const n = Number(val);
    return isFinite(n) && n > 0 ? money(n) : String(val);
  }
  return String(val);
}

export default function ApplicationsList({ applications }: { applications: App[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);

  if (!applications.length) return <p className="muted">No applications yet.</p>;

  return (
    <div>
      <p className="small muted" style={{ marginBottom: 12 }}>
        {applications.length} application(s). Click one to expand, set status, and add private notes.
      </p>
      {applications.map((a) => (
        <Row
          key={a.id}
          app={a}
          open={openId === a.id}
          onToggle={() => setOpenId(openId === a.id ? null : a.id)}
          onSaved={() => router.refresh()}
        />
      ))}
    </div>
  );
}

function Row({
  app,
  open,
  onToggle,
  onSaved,
}: {
  app: App;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<string>(app.status || "new");
  const [notes, setNotes] = useState<string>(app.admin_notes || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/applications/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, status, admin_notes: notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Save failed.");
      setMsg({ ok: true, text: "Saved ✓" });
      onSaved();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-item">
      <div className="app-head" onClick={onToggle}>
        <div>
          <div className="app-title">{app.full_name || "—"}</div>
          <div className="app-meta">
            {new Date(app.created_at).toLocaleDateString()} · {app.email} · {app.phone}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="app-meta">{fmt("monthly_income", app.monthly_income)}/mo</span>
          <span className={`app-badge st-${app.status || "new"}`}>{app.status || "new"}</span>
          <span className="app-chev">{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div className="app-body">
          <dl className="app-grid">
            {FIELDS.map(([k, label]) => (
              <div key={k}>
                <dt>{label}</dt>
                <dd>{fmt(k, app[k])}</dd>
              </div>
            ))}
          </dl>

          <div className="field" style={{ maxWidth: 260 }}>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Private notes <span className="hint">(only the landlord sees these)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Your review comments…" />
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            {msg && (
              <span className="small" style={{ color: msg.ok ? "var(--good)" : "var(--bad)" }}>{msg.text}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
