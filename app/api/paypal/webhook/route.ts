import { NextResponse } from "next/server";
import { getServiceClient, SB_PAYMENTS_TABLE, SB_LEASES_TABLE } from "@/lib/supabase";
import { verifyWebhook } from "@/lib/paypal";

export const runtime = "nodejs";

// PayPal calls this URL on subscription events. We verify the signature, then
// log each completed recurring payment to the SB_payments ledger.
export async function POST(req: Request) {
  const raw = await req.text();

  const ok = await verifyWebhook(req.headers, raw);
  if (!ok) {
    console.warn("[paypal webhook] signature verification failed — ignoring event.");
    return NextResponse.json({ ignored: true }, { status: 200 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const svc = getServiceClient();
  const type = event.event_type as string;

  try {
    if (type === "PAYMENT.SALE.COMPLETED") {
      const r = event.resource || {};
      const subscriptionId: string | undefined = r.billing_agreement_id;
      const amount = parseFloat(r.amount?.total ?? "0");
      const externalId: string | undefined = r.id;

      // Match the payment to a lease via the stored subscription id.
      let lease = null;
      if (subscriptionId) {
        const { data } = await svc
          .from(SB_LEASES_TABLE)
          .select("id, tenant_id")
          .eq("paypal_subscription_id", subscriptionId)
          .maybeSingle();
        lease = data;
      }

      const firstOfMonth = new Date();
      firstOfMonth.setUTCDate(1);

      await svc.from(SB_PAYMENTS_TABLE).upsert(
        {
          lease_id: lease?.id ?? null,
          tenant_id: lease?.tenant_id ?? null,
          amount,
          method: "paypal",
          status: "completed",
          external_id: externalId ?? null,
          paid_for_month: firstOfMonth.toISOString().slice(0, 10),
          recorded_by: "webhook",
          note: subscriptionId ? `PayPal subscription ${subscriptionId}` : "PayPal payment",
        },
        { onConflict: "external_id", ignoreDuplicates: true }
      );
    } else if (
      type === "BILLING.SUBSCRIPTION.CANCELLED" ||
      type === "BILLING.SUBSCRIPTION.SUSPENDED"
    ) {
      const subId = event.resource?.id;
      if (subId) {
        await svc.from(SB_LEASES_TABLE).update({ paypal_subscription_id: null }).eq("paypal_subscription_id", subId);
      }
    }
  } catch (err) {
    console.error("[paypal webhook] processing error:", err);
    // Still return 200 so PayPal doesn't hammer retries on a transient error.
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
