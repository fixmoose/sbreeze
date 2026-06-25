// Minimal UniOne (Unisender Go) transactional email client.
// Docs: https://docs.unione.io/en/web-api-ref#email-send

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Sends one transactional email via UniOne.
 * If UniOne env vars are not set, it logs and returns gracefully (so a missing
 * email config never blocks an application from being saved).
 */
export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailArgs): Promise<void> {
  const apiKey = process.env.UNIONE_API_KEY;
  const fromEmail = process.env.UNIONE_FROM_EMAIL;
  const fromName = process.env.UNIONE_FROM_NAME || "Sunset Breeze Rental";
  const base =
    process.env.UNIONE_API_URL || "https://eu1.unione.io/en/transactional/api/v1";

  if (!apiKey || !fromEmail) {
    console.warn("[unione] Not configured (UNIONE_API_KEY / UNIONE_FROM_EMAIL missing) — skipping email to", to);
    return;
  }

  const message: Record<string, unknown> = {
    recipients: [{ email: to }],
    subject,
    from_email: fromEmail,
    from_name: fromName,
    body: { html, plaintext: text },
    track_links: 0,
    track_read: 0,
  };
  if (replyTo) message.reply_to = replyTo;

  const res = await fetch(`${base}/email/send.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ api_key: apiKey, message }),
    // never let a slow mail provider hang the request indefinitely
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`UniOne send failed (${res.status}): ${detail}`);
  }
}
