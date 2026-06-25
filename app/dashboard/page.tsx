import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { getServiceClient, SB_LEASES_TABLE, SB_PAYMENTS_TABLE, SB_UTILITY_BILLS_TABLE } from "@/lib/supabase";
import { money } from "@/data/property";
import AutoPayButton from "@/components/AutoPayButton";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function TenantDashboard({
  searchParams,
}: {
  searchParams: { paypal?: string };
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  const svc = getServiceClient();
  const { data: lease } = await svc
    .from(SB_LEASES_TABLE)
    .select("*")
    .eq("tenant_id", profile.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: payments } = await svc
    .from(SB_PAYMENTS_TABLE)
    .select("*")
    .eq("tenant_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: utilityBills } = await svc
    .from(SB_UTILITY_BILLS_TABLE)
    .select("*")
    .eq("tenant_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(24);

  const autopayOn = Boolean(lease?.paypal_subscription_id);

  return (
    <>
      <header className="hero" style={{ padding: "26px 0" }}>
        <div className="container">
          <div className="nav">
            <Link className="brand" href="/">☀️ Sunset Breeze</Link>
            <SignOutButton />
          </div>
          <h1 style={{ fontSize: 28, marginTop: 8 }}>Welcome{profile.full_name ? `, ${profile.full_name}` : ""}</h1>
          <p className="addr">Your tenant dashboard</p>
        </div>
      </header>

      <main>
        {searchParams.paypal === "success" && (
          <div className="container" style={{ paddingTop: 18 }}>
            <div className="callout law">✅ PayPal approved. Automatic monthly payments will appear here once the first charge clears.</div>
          </div>
        )}
        {searchParams.paypal === "cancel" && (
          <div className="container" style={{ paddingTop: 18 }}>
            <div className="callout">PayPal setup was canceled. You can try again or pay by check / ACH.</div>
          </div>
        )}

        <section>
          <div className="container">
            <h2>Your lease</h2>
            {!lease ? (
              <div className="callout">
                Your landlord hasn’t linked your lease to this account yet. Once they do, your rent
                amount and payment options will appear here. (Make sure you signed up with the same
                email you gave the landlord.)
              </div>
            ) : (
              <dl className="kv">
                <dt>Property</dt><dd>{lease.property_address}</dd>
                <dt>Monthly rent</dt><dd>{money(Number(lease.rent))}</dd>
                <dt>Security deposit</dt><dd>{lease.deposit ? money(Number(lease.deposit)) : "—"}</dd>
                <dt>Term</dt><dd>{lease.start_date || "—"} → {lease.end_date || "—"}</dd>
              </dl>
            )}
          </div>
        </section>

        {lease && (
          <section>
            <div className="container">
              <h2>Pay rent</h2>
              <div className="cols2">
                <div className="card">
                  <h3>① Automatic (PayPal)</h3>
                  {autopayOn ? (
                    <p className="muted">✅ Automatic monthly payments are set up. You’re all set — rent is charged each month.</p>
                  ) : (
                    <>
                      <p className="muted">Turn on automatic monthly rent so you never miss a due date.</p>
                      <AutoPayButton />
                    </>
                  )}
                </div>
                <div className="card">
                  <h3>② Check or ACH</h3>
                  <p className="muted">
                    Prefer to pay manually? Send a check or ACH transfer for {money(Number(lease.rent))} by the
                    1st of each month. Your landlord records it here, and it shows in your history below.
                    Contact the landlord for the mailing address / bank details.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {utilityBills && utilityBills.length > 0 && (
          <section>
            <div className="container">
              <h2>Electricity (NV Energy) — forwarded bills</h2>
              <p className="muted">
                The electricity account is in the owner’s name due to solar net metering, so each
                NV Energy bill is forwarded to you to pay.
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid var(--line)" }}>
                    <th style={{ padding: 8 }}>Month</th>
                    <th style={{ padding: 8 }}>Provider</th>
                    <th style={{ padding: 8 }}>Amount</th>
                    <th style={{ padding: 8 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {utilityBills.map((b) => (
                    <tr key={b.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: 8 }}>{b.period || "—"}</td>
                      <td style={{ padding: 8 }}>{b.provider}</td>
                      <td style={{ padding: 8 }}>{money(Number(b.amount))}</td>
                      <td style={{ padding: 8 }}>{b.status === "paid" ? "✅ paid" : "due"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section style={{ borderBottom: "none" }}>
          <div className="container">
            <h2>Payment history</h2>
            {(!payments || payments.length === 0) ? (
              <p className="muted">No payments recorded yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid var(--line)" }}>
                    <th style={{ padding: 8 }}>Date</th>
                    <th style={{ padding: 8 }}>For month</th>
                    <th style={{ padding: 8 }}>Method</th>
                    <th style={{ padding: 8 }}>Amount</th>
                    <th style={{ padding: 8 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: 8 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: 8 }}>{p.paid_for_month || "—"}</td>
                      <td style={{ padding: 8, textTransform: "uppercase" }}>{p.method}</td>
                      <td style={{ padding: 8 }}>{money(Number(p.amount))}</td>
                      <td style={{ padding: 8 }}>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
