import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getServiceClient, SB_APPLICATIONS_TABLE } from "@/lib/supabase";

export const runtime = "nodejs";

const STATUSES = ["new", "screening", "approved", "declined"];

// Landlord updates an application's status and/or private notes.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const update: Record<string, string> = {};
  if (typeof body.admin_notes === "string") update.admin_notes = body.admin_notes.slice(0, 4000);
  if (STATUSES.includes(body.status)) update.status = body.status;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const svc = getServiceClient();
  const { error } = await svc.from(SB_APPLICATIONS_TABLE).update(update).eq("id", id);
  if (error) {
    // Most likely cause: the admin_notes column hasn't been added yet.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
