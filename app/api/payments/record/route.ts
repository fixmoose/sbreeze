import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getServiceClient, SB_LEASES_TABLE, SB_PAYMENTS_TABLE } from "@/lib/supabase";

export const runtime = "nodejs";

// Landlord records a manual rent payment (check / ACH / other) on the ledger.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const leaseId = String(body.lease_id || "");
  const amount = Number(body.amount);
  const method = ["check", "ach", "other", "paypal"].includes(body.method) ? body.method : "check";

  if (!leaseId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Lease and a positive amount are required." }, { status: 400 });
  }

  const svc = getServiceClient();
  const { data: lease } = await svc
    .from(SB_LEASES_TABLE)
    .select("id, tenant_id")
    .eq("id", leaseId)
    .maybeSingle();
  if (!lease) return NextResponse.json({ error: "Lease not found." }, { status: 404 });

  const { error } = await svc.from(SB_PAYMENTS_TABLE).insert({
    lease_id: lease.id,
    tenant_id: lease.tenant_id,
    amount,
    method,
    status: "completed",
    paid_for_month: body.paid_for_month || null,
    note: String(body.note || "").slice(0, 500) || null,
    recorded_by: "admin",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
