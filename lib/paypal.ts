// PayPal REST helpers for recurring rent subscriptions + webhook verification.
// Docs: https://developer.paypal.com/docs/api/subscriptions/v1/

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);
}

function apiBase(): string {
  return (process.env.PAYPAL_ENV || "sandbox") === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!id || !secret) throw new Error("PayPal is not configured (PAYPAL_CLIENT_ID / PAYPAL_SECRET).");

  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status}): ${await res.text()}`);
  const json = await res.json();
  return json.access_token as string;
}

/**
 * Creates a recurring subscription on the configured billing plan and returns
 * the subscription id + the URL where the tenant approves it.
 */
export async function createSubscription(opts: {
  leaseId: string;
  email: string;
  fullName?: string | null;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approveUrl: string }> {
  const planId = process.env.PAYPAL_PLAN_ID;
  if (!planId) throw new Error("PAYPAL_PLAN_ID is not set (create a $2,450/mo billing plan in PayPal).");

  const token = await getAccessToken();
  const [firstName, ...rest] = (opts.fullName || "").split(" ");

  const res = await fetch(`${apiBase()}/v1/billing/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: opts.leaseId, // so the webhook can match payments to the lease
      subscriber: {
        email_address: opts.email,
        name: { given_name: firstName || "Tenant", surname: rest.join(" ") || "Resident" },
      },
      application_context: {
        brand_name: "Sunset Breeze Rental",
        user_action: "SUBSCRIBE_NOW",
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal subscription failed (${res.status}): ${await res.text()}`);
  const json = await res.json();
  const approve = (json.links || []).find((l: { rel: string; href: string }) => l.rel === "approve");
  if (!approve) throw new Error("PayPal did not return an approval link.");
  return { id: json.id as string, approveUrl: approve.href as string };
}

/**
 * Verifies a webhook came from PayPal (so nobody can fake a "payment received").
 * Returns true only when PayPal confirms the signature.
 */
export async function verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.warn("[paypal] PAYPAL_WEBHOOK_ID not set — cannot verify webhook signature.");
    return false;
  }
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  if (!res.ok) return false;
  const json = await res.json();
  return json.verification_status === "SUCCESS";
}
