import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getServiceClient, SB_EXPENSES_TABLE, SB_RECEIPTS_BUCKET } from "@/lib/supabase";
import { SCHEDULE_E_CATEGORIES } from "@/data/tax";

export const runtime = "nodejs";

// Landlord adds a deductible expense, optionally with a receipt image/PDF.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const expense_date = String(form.get("expense_date") || "");
  const amount = Number(form.get("amount"));
  const category = String(form.get("category") || "");
  const vendor = String(form.get("vendor") || "").slice(0, 200);
  const description = String(form.get("description") || "").slice(0, 500);
  const vendor_is_individual = form.get("vendor_is_individual") === "yes";
  const file = form.get("receipt") as File | null;

  if (!expense_date || !amount || amount <= 0) {
    return NextResponse.json({ error: "Date and a positive amount are required." }, { status: 400 });
  }
  if (!SCHEDULE_E_CATEGORIES.includes(category as never)) {
    return NextResponse.json({ error: "Pick a valid category." }, { status: 400 });
  }

  const svc = getServiceClient();
  let receipt_path: string | null = null;

  if (file && file.size > 0) {
    const year = expense_date.slice(0, 4) || "misc";
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path = `${year}/${Date.now()}-${safe}`;
    const { error: upErr } = await svc.storage
      .from(SB_RECEIPTS_BUCKET)
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (upErr) return NextResponse.json({ error: `Receipt upload failed: ${upErr.message}` }, { status: 500 });
    receipt_path = path;
  }

  const { error } = await svc.from(SB_EXPENSES_TABLE).insert({
    expense_date,
    amount,
    category,
    vendor: vendor || null,
    vendor_is_individual,
    description: description || null,
    receipt_path,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
