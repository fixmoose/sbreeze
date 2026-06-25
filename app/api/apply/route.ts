import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, SB_APPLICATIONS_TABLE } from "@/lib/supabase";
import { sendEmail } from "@/lib/unione";
import { fullAddress, property } from "@/data/property";

export const runtime = "nodejs";

// Fields we accept from the form. Anything else is ignored.
const FIELDS = [
  "full_name", "dob_year", "email", "phone",
  "desired_move_in", "lease_term_ok", "total_occupants", "adults", "occupant_names",
  "employment_status", "monthly_income", "employer",
  "pets", "vehicles", "vehicles_registered", "smoker",
  "current_address", "landlord_contact", "reason_moving", "ever_evicted", "bankruptcy", "notes",
  "consent_screening", "certify_true",
] as const;

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim().slice(0, 2000) : v == null ? "" : String(v).slice(0, 2000);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const record: Record<string, string> = {};
  for (const f of FIELDS) record[f] = clean(body[f]);

  // Minimal server-side validation.
  if (!record.full_name || !record.email || !record.phone) {
    return NextResponse.json({ error: "Name, email, and phone are required." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(record.email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (record.consent_screening !== "yes" || record.certify_true !== "yes") {
    return NextResponse.json({ error: "Both consent boxes are required." }, { status: 400 });
  }

  // 1) Save to Supabase.
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from(SB_APPLICATIONS_TABLE).insert({
      ...record,
      status: "new",
      property_address: fullAddress(),
    });
    if (error) throw error;
  } catch (err) {
    console.error("[apply] Supabase insert failed:", err);
    return NextResponse.json(
      { error: "We couldn't save your application. Please try again in a moment." },
      { status: 500 }
    );
  }

  // 2) Email notifications (best-effort — never fail the request if email is down).
  const notifyTo = process.env.APPLICATION_NOTIFY_EMAIL || "adriaticbuilders@gmail.com";
  const rows = Object.entries(record)
    .filter(([k]) => !["consent_screening", "certify_true"].includes(k))
    .map(([k, v]) => `<tr><td style="padding:4px 10px;font-weight:600">${k}</td><td style="padding:4px 10px">${escapeHtml(v) || "—"}</td></tr>`)
    .join("");

  try {
    await sendEmail({
      to: notifyTo,
      replyTo: record.email,
      subject: `New rental application — ${record.full_name} (${property.addressLine})`,
      text: `New application for ${fullAddress()} from ${record.full_name}, ${record.email}, ${record.phone}.`,
      html: `<h2>New rental application</h2>
        <p><strong>${escapeHtml(record.full_name)}</strong> applied for ${escapeHtml(fullAddress())}.</p>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${rows}</table>`,
    });
  } catch (err) {
    console.error("[apply] Landlord notification email failed:", err);
  }

  try {
    await sendEmail({
      to: record.email,
      subject: `We received your application — ${property.addressLine}`,
      text: `Hi ${record.full_name}, thanks for applying for ${fullAddress()}. We'll review your application and follow up soon.`,
      html: `<p>Hi ${escapeHtml(record.full_name)},</p>
        <p>Thanks for applying for <strong>${escapeHtml(fullAddress())}</strong>. We review every application against the same written criteria and will follow up, usually within 1–2 business days. If your application qualifies, we'll email you a secure link to complete the credit &amp; background screening.</p>
        <p>— Sunset Breeze Rental</p>`,
    });
  } catch (err) {
    console.error("[apply] Applicant confirmation email failed:", err);
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
