import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getServiceClient, SB_UTILITY_BILLS_TABLE } from "@/lib/supabase";

export const runtime = "nodejs";

// Landlord marks a forwarded utility bill as paid by the tenant.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const status = body.status === "forwarded" ? "forwarded" : "paid";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const svc = getServiceClient();
  const { error } = await svc.from(SB_UTILITY_BILLS_TABLE).update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
