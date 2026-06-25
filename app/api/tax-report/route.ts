import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getServiceClient, SB_PAYMENTS_TABLE, SB_EXPENSES_TABLE } from "@/lib/supabase";
import { FORM_1099_THRESHOLD, TAX_LANDLORD_NAME } from "@/data/tax";

export const runtime = "nodejs";

// Year-end CSV for Schedule E: income total, expenses by category, and a
// section flagging individuals paid >= $600 (potential 1099-NEC).
export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const year = new URL(req.url).searchParams.get("year") || String(new Date().getUTCFullYear());
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const svc = getServiceClient();

  const { data: payments } = await svc
    .from(SB_PAYMENTS_TABLE)
    .select("amount, created_at, status")
    .gte("created_at", `${from}T00:00:00Z`)
    .lte("created_at", `${to}T23:59:59Z`);

  const { data: expenses } = await svc
    .from(SB_EXPENSES_TABLE)
    .select("amount, category, vendor, vendor_is_individual, expense_date")
    .gte("expense_date", from)
    .lte("expense_date", to);

  const incomeTotal = (payments || [])
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const byCategory = new Map<string, number>();
  const byVendor = new Map<string, { total: number; individual: boolean }>();
  let expenseTotal = 0;
  for (const e of expenses || []) {
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

  const lines: string[] = [];
  const row = (...cells: (string | number)[]) =>
    lines.push(cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));

  row(`Sunset Breeze — Schedule E summary for ${year}`);
  row(`Landlord`, TAX_LANDLORD_NAME);
  row("");
  row("INCOME");
  row("Rents received", incomeTotal.toFixed(2));
  row("");
  row("EXPENSES BY SCHEDULE E CATEGORY");
  row("Category", "Amount");
  for (const [cat, amt] of byCategory) row(cat, amt.toFixed(2));
  row("Total expenses", expenseTotal.toFixed(2));
  row("");
  row("NET (income - expenses, before depreciation adjustments)", (incomeTotal - expenseTotal).toFixed(2));
  row("");
  row(`POSSIBLE 1099-NEC (individuals/unincorporated vendors paid >= $${FORM_1099_THRESHOLD})`);
  row("Vendor", "Total paid", "Flag");
  let any1099 = false;
  for (const [vendor, info] of byVendor) {
    if (info.individual && info.total >= FORM_1099_THRESHOLD) {
      any1099 = true;
      row(vendor, info.total.toFixed(2), "ISSUE 1099-NEC");
    }
  }
  if (!any1099) row("(none flagged)", "", "");
  row("");
  row("Note", "Tenants receive no year-end tax form for a Nevada residential rental.");
  row("Note", "This summary is a bookkeeping aid, not tax advice. Confirm with your accountant.");

  const csv = lines.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sunset-breeze-schedule-E-${year}.csv"`,
    },
  });
}
