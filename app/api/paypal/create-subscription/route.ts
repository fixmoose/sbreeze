import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";
import { createSubscription, paypalConfigured } from "@/lib/paypal";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  if (!paypalConfigured()) {
    return NextResponse.json(
      { error: "Automatic payments aren't set up yet. Please pay by check or ACH for now." },
      { status: 503 }
    );
  }

  const svc = getServiceClient();
  const { data: lease } = await svc
    .from("SB_leases")
    .select("*")
    .eq("tenant_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lease) {
    return NextResponse.json(
      { error: "No active lease found on your account yet. Contact the landlord." },
      { status: 400 }
    );
  }

  const origin = new URL(req.url).origin;
  try {
    const sub = await createSubscription({
      leaseId: lease.id,
      email: user.email!,
      fullName: (user.user_metadata?.full_name as string) || null,
      returnUrl: `${origin}/dashboard?paypal=success`,
      cancelUrl: `${origin}/dashboard?paypal=cancel`,
    });
    await svc.from("SB_leases").update({ paypal_subscription_id: sub.id }).eq("id", lease.id);
    return NextResponse.json({ approveUrl: sub.approveUrl });
  } catch (err) {
    console.error("[paypal] create-subscription:", err);
    return NextResponse.json({ error: "Could not start PayPal setup. Try again later." }, { status: 500 });
  }
}
