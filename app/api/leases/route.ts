import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getServiceClient, SB_LEASES_TABLE, SB_PROFILES_TABLE } from "@/lib/supabase";

export const runtime = "nodejs";

// Landlord links a (already signed-up) tenant to a lease by their email.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const email = String(body.tenant_email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Tenant email is required." }, { status: 400 });

  const svc = getServiceClient();
  const { data: profile } = await svc
    .from(SB_PROFILES_TABLE)
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: "No tenant account found with that email. Ask them to sign up first at /signup." },
      { status: 404 }
    );
  }

  const { error } = await svc.from(SB_LEASES_TABLE).insert({
    tenant_id: profile.id,
    rent: Number(body.rent) || 2450,
    deposit: Number(body.deposit) || 2450,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    status: "active",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
