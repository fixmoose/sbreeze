import { NextResponse } from "next/server";
import { contact } from "@/data/property";

export const runtime = "nodejs";

// Returns the phone number only when explicitly requested (on click), so the
// number never appears in the page's HTML source for scrapers to harvest.
export async function GET() {
  return NextResponse.json(
    { phone: contact.phone },
    { headers: { "Cache-Control": "no-store" } }
  );
}
