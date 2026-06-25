import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import {
  getServiceClient,
  SB_APPLICATIONS_TABLE,
  SB_LEASES_TABLE,
  SB_PAYMENTS_TABLE,
  SB_EXPENSES_TABLE,
  SB_PROFILES_TABLE,
  SB_RECEIPTS_BUCKET,
  SB_UTILITY_BILLS_TABLE,
} from "@/lib/supabase";
import { money } from "@/data/property";
import { FORM_1099_THRESHOLD, TAX_LANDLORD_NAME } from "@/data/tax";
import SignOutButton from "@/components/SignOutButton";
import CreateLeaseForm from "@/components/admin/CreateLeaseForm";
import RecordPaymentForm from "@/components/admin/RecordPaymentForm";
import AddExpenseForm from "@/components/admin/AddExpenseForm";
import AddUtilityBillForm from "@/components/admin/AddUtilityBillForm";
import UtilityBillToggle from "@/components/admin/UtilityBillRow";
import ApplicationsList from "@/components/admin/ApplicationsList";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }: { searchParams: { year?: string } }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  const year = /^\d{4}$/.test(searchParams.year || "") ? searchParams.year! : String(new Date().getUTCFullYear());
  const svc = getServiceClient();

  // Pull everything in parallel.
  const [appsRes, leasesRes, paymentsRes, expensesRes, profilesRes, utilitiesRes] = await Promise.all([
    svc.from(SB_APPLICATIONS_TABLE).select("*").order("created_at", { ascending: false }).limit(500),
    svc.from(SB_LEASES_TABLE).select("*").order("created_at", { ascending: false }),
    svc.from(SB_PAYMENTS_TABLE).select("*").order("created_at", { ascending: false }).limit(50),
    svc.from(SB_EXPENSES_TABLE).select("*").gte("expense_date", `${year}-01-01`).lte("expense_date", `${year}-12-31`).order("expense_date", { ascending: false }),
    svc.from(SB_PROFILES_TABLE).select("id, email, full_name"),
    svc.from(SB_UTILITY_BILLS_TABLE).select("*").order("created_at", { ascending: false }).limit(24),
  ]);

  const applications = appsRes.data || [];
  const leases = leasesRes.data || [];
  const payments = paymentsRes.data || [];
  const expenses = expensesRes.data || [];
  const profiles = profilesRes.data || [];
  const utilityBills = utilitiesRes.data || [];
  const emailById = new Map(profiles.map((p) => [p.id, p.email]));

  // Signed URLs for receipts (1h).
  const receiptUrls = new Map<string, string>();
  await Promise.all(
    expenses
      .filter((e) => e.receipt_path)
      .map(async (e) => {
        const { data } = await svc.storage.from(SB_RECEIPTS_BUCKET).createSignedUrl(e.receipt_path, 3600);
        if (data?.signedUrl) receiptUrls.set(e.id, data.signedUrl);
      })
  );

  const leaseOptions = leases.map((l) => ({
    id: l.id,
    label: `${emailById.get(l.tenant_id) || "unlinked"} — ${money(Number(l.rent))}/mo`,
  }));

  // ── Year-end tax summary ──────────────────────────────────────────────
  const paymentsThisYear = payments.filter((p) => (p.created_at || "").startsWith(year));
  const incomeTotal = paymentsThisYear.filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount || 0), 0);
  const byCategory = new Map<string, number>();
  const byVendor = new Map<string, { total: number; individual: boolean }>();
  let expenseTotal = 0;
  for (const e of expenses) {
    const amt = Number(e.amount || 0);
    expenseTotal += amt;
    byCategory.set(e.category, (byCategory.get(e.category) || 0) + amt);
    if (e.vendor) {
      const cur = byVendor.get(e.vendor) || { total: 0, individual: !!e.vendor_is_individual };
      cur.total += amt;
      cur.individual = cur.individual || !!e.vendor_is_individual;
      byVendor.set(e.vendor, cur);
    }
  }
  const flagged1099 = [...byVendor.entries()].filter(([, v]) => v.individual && v.total >= FORM_1099_THRESHOLD);
  const td = { padding: 8, borderBottom: "1px solid var(--line)" } as const;
  const th = { padding: 8, textAlign: "left" as const, borderBottom: "2px solid var(--line)" };

  return (
    <>
      <header className="hero" style={{ padding: "26px 0" }}>
        <div className="container">
          <div className="nav">
            <Link className="brand" href="/">☀️ Sunset Breeze — Landlord</Link>
            <SignOutButton />
          </div>
          <h1 style={{ fontSize: 28, marginTop: 8 }}>Landlord dashboard</h1>
          <p className="addr">{TAX_LANDLORD_NAME} · {applications.length} application(s) · {leases.length} lease(s)</p>
        </div>
      </header>

      <main>
        {/* APPLICATIONS */}
        <section>
          <div className="container">
            <h2>Applications</h2>
            <ApplicationsList applications={applications} />
          </div>
        </section>

        {/* LEASES */}
        <section>
          <div className="container">
            <h2>Tenants & leases</h2>
            <div className="cols2">
              <div>
                <h3>Current leases</h3>
                {leases.length === 0 ? <p className="muted">No leases yet.</p> : (
                  <ul className="clean">
                    {leases.map((l) => (
                      <li key={l.id}>
                        {emailById.get(l.tenant_id) || "⚠ unlinked tenant"} — {money(Number(l.rent))}/mo
                        {" · "}{l.paypal_subscription_id ? "auto-pay ON" : "manual"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3>Add a lease</h3>
                <CreateLeaseForm />
              </div>
            </div>
          </div>
        </section>

        {/* PAYMENTS */}
        <section>
          <div className="container">
            <h2>Payments</h2>
            <div className="cols2">
              <div>
                <h3>Recent payments</h3>
                {payments.length === 0 ? <p className="muted">No payments yet.</p> : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead><tr>
                        <th style={th}>Date</th><th style={th}>Tenant</th><th style={th}>Method</th><th style={th}>Amount</th>
                      </tr></thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td style={td}>{new Date(p.created_at).toLocaleDateString()}</td>
                            <td style={td}>{emailById.get(p.tenant_id) || "—"}</td>
                            <td style={td}>{p.method?.toUpperCase()}</td>
                            <td style={td}>{money(Number(p.amount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div>
                <h3>Record a check / ACH payment</h3>
                <RecordPaymentForm leases={leaseOptions} />
              </div>
            </div>
          </div>
        </section>

        {/* UTILITIES (NV ENERGY) */}
        <section>
          <div className="container">
            <h2>Utilities — NV Energy (forwarded to tenant)</h2>
            <p className="lead">
              The electricity account stays in your name (solar net metering). Log each NV Energy
              bill here: it’s auto-added as a deductible <em>Utilities</em> expense <strong>and</strong>{" "}
              forwarded to the tenant to pay.
            </p>
            <div className="cols2">
              <div>
                <h3>Recent bills</h3>
                {utilityBills.length === 0 ? <p className="muted">No utility bills logged yet.</p> : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead><tr>
                        <th style={th}>Month</th><th style={th}>Provider</th><th style={th}>Amount</th>
                        <th style={th}>Status</th><th style={th}></th>
                      </tr></thead>
                      <tbody>
                        {utilityBills.map((b) => (
                          <tr key={b.id}>
                            <td style={td}>{b.period || "—"}</td>
                            <td style={td}>{b.provider}</td>
                            <td style={td}>{money(Number(b.amount))}</td>
                            <td style={td}>{b.status === "paid" ? "✅ paid" : "forwarded"}</td>
                            <td style={td}><UtilityBillToggle id={b.id} status={b.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="small muted" style={{ marginTop: 10 }}>
                  Auto-import: a forwarder/script can POST bills to <code>/api/utilities</code> with the
                  <code> x-import-token</code> header (NV Energy has no public API — see README).
                </p>
              </div>
              <div>
                <h3>Log an NV Energy bill</h3>
                <AddUtilityBillForm />
              </div>
            </div>
          </div>
        </section>

        {/* EXPENSES + TAX */}
        <section style={{ borderBottom: "none" }}>
          <div className="container">
            <h2>Expenses & year-end taxes</h2>

            <div className="callout law">
              <strong>Year-end ({year}).</strong> Income: <strong>{money(incomeTotal)}</strong> ·
              Expenses: <strong>{money(expenseTotal)}</strong> ·
              Net: <strong>{money(incomeTotal - expenseTotal)}</strong>.{" "}
              <a href={`/api/tax-report?year=${year}`}>Download Schedule E CSV →</a>
              <div className="small" style={{ marginTop: 8 }}>
                Pick year:{" "}
                {[0, 1, 2].map((i) => {
                  const y = String(Number(year) - i);
                  return <Link key={y} href={`/admin?year=${y}`} style={{ marginRight: 10 }}>{y}</Link>;
                })}
                <span className="muted"> · Tenants get no year-end form (NV residential).</span>
              </div>
            </div>

            {flagged1099.length > 0 && (
              <div className="callout">
                <strong>⚠ Possible 1099-NEC for {year}:</strong> you paid these individuals ≥ ${FORM_1099_THRESHOLD}:
                <ul className="clean dash" style={{ marginTop: 6 }}>
                  {flagged1099.map(([v, info]) => <li key={v}>{v} — {money(info.total)}</li>)}
                </ul>
              </div>
            )}

            <div className="cols2" style={{ marginTop: 18 }}>
              <div>
                <h3>Expenses ({year})</h3>
                {expenses.length === 0 ? <p className="muted">No expenses logged for {year}.</p> : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead><tr>
                        <th style={th}>Date</th><th style={th}>Category</th><th style={th}>Vendor</th>
                        <th style={th}>Amount</th><th style={th}>Receipt</th>
                      </tr></thead>
                      <tbody>
                        {expenses.map((e) => (
                          <tr key={e.id}>
                            <td style={td}>{e.expense_date}</td>
                            <td style={td}>{e.category}</td>
                            <td style={td}>{e.vendor || "—"}</td>
                            <td style={td}>{money(Number(e.amount))}</td>
                            <td style={td}>{receiptUrls.get(e.id) ? <a href={receiptUrls.get(e.id)} target="_blank" rel="noreferrer">view</a> : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <h3 style={{ marginTop: 18 }}>By category</h3>
                <ul className="clean">
                  {[...byCategory.entries()].map(([c, amt]) => <li key={c}>{c}: {money(amt)}</li>)}
                  {byCategory.size === 0 && <li className="muted">—</li>}
                </ul>
              </div>
              <div>
                <h3>Add an expense</h3>
                <AddExpenseForm />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
