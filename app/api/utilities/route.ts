import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getServiceClient,
  SB_EXPENSES_TABLE,
  SB_LEASES_TABLE,
  SB_UTILITY_BILLS_TABLE,
  SB_RECEIPTS_BUCKET,
} from "@/lib/supabase";

export const runtime = "nodejs";

// Add / import a utility bill (default: NV Energy). One call →
//   1) a deductible "Utilities" expense (auto-added to the property), and
//   2) a charge forwarded to the tenant (shows on their dashboard).
//
// Auth: either the logged-in landlord, OR a request carrying the shared
// header  x-import-token: <UTILITY_IMPORT_TOKEN>  (for automated importers,
// e.g. an email-forwarding parser — NV Energy has no public API).
export async function POST(req: Request) {
  const token = req.headers.get("x-import-token");
  const validToken = process.env.UTILITY_IMPORT_TOKEN && token === process.env.UTILITY_IMPORT_TOKEN;
  const admin = validToken ? true : Boolean(await requireAdmin());
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Accept multipart (with a PDF) or plain JSON (for automation).
  let amount = 0,
    period = "",
    provider = "NV Energy",
    leaseId = "",
    pdf: File | null = null;

  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    amount = Number(form.get("amount"));
    period = String(form.get("period") || "");
    provider = String(form.get("provider") || "NV Energy");
    leaseId = String(form.get("lease_id") || "");
    pdf = form.get("pdf") as File | null;
  } else {
    const body = await req.json().catch(() => ({}));
    amount = Number(body.amount);
    period = String(body.period || "");
    provider = String(body.provider || "NV Energy");
    leaseId = String(body.lease_id || "");
  }

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "A positive bill amount is required." }, { status: 400 });
  }
  const expenseDate = /^\d{4}-\d{2}-\d{2}$/.test(period) ? period : new Date().toISOString().slice(0, 10);

  const svc = getServiceClient();

  // Resolve the lease: use the given one, else the single active lease.
  let lease: { id: string; tenant_id: string | null } | null = null;
  if (leaseId) {
    const { data } = await svc.from(SB_LEASES_TABLE).select("id, tenant_id").eq("id", leaseId).maybeSingle();
    lease = data;
  } else {
    const { data } = await svc
      .from(SB_LEASES_TABLE)
      .select("id, tenant_id")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lease = data;
  }

  // Optional bill PDF → SB_receipts.
  let pdfPath: string | null = null;
  if (pdf && pdf.size > 0) {
    const safe = pdf.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path = `${expenseDate.slice(0, 4)}/utility-${Date.now()}-${safe}`;
    const { error: upErr } = await svc.storage
      .from(SB_RECEIPTS_BUCKET)
      .upload(path, await pdf.arrayBuffer(), { contentType: pdf.type || "application/pdf" });
    if (!upErr) pdfPath = path;
  }

  // 1) Deductible expense on the property (Schedule E → Utilities).
  const { data: expense, error: expErr } = await svc
    .from(SB_EXPENSES_TABLE)
    .insert({
      expense_date: expenseDate,
      amount,
      category: "Utilities",
      vendor: provider,
      vendor_is_individual: false,
      description: `${provider} bill for ${period || expenseDate} (forwarded to tenant)`,
      receipt_path: pdfPath,
    })
    .select("id")
    .single();
  if (expErr) return NextResponse.json({ error: expErr.message }, { status: 500 });

  // 2) Forwarded charge for the tenant.
  const { error: billErr } = await svc.from(SB_UTILITY_BILLS_TABLE).insert({
    lease_id: lease?.id ?? null,
    tenant_id: lease?.tenant_id ?? null,
    provider,
    period: /^\d{4}-\d{2}-\d{2}$/.test(period) ? period : expenseDate,
    amount,
    status: "forwarded",
    pdf_path: pdfPath,
    expense_id: expense.id,
    source: validToken ? "import" : "manual",
  });
  if (billErr) return NextResponse.json({ error: billErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
