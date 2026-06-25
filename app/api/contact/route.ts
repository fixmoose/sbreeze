import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/unione";

export const runtime = "nodejs";

function esc(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 200);
  const email = String(body.email || "").trim().slice(0, 200);
  const phone = String(body.phone || "").trim().slice(0, 50);
  const message = String(body.message || "").trim().slice(0, 4000);

  // honeypot
  if (body.company) return NextResponse.json({ ok: true });

  if (!name || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Please provide your name, a valid email, and a message." }, { status: 400 });
  }

  const to = process.env.APPLICATION_NOTIFY_EMAIL || "dejan@haywilson.com";
  try {
    await sendEmail({
      to,
      replyTo: email,
      subject: `Sunset Breeze inquiry — ${name}`,
      text: `From ${name} <${email}> ${phone}\n\n${message}`,
      html: `<h2>New website inquiry</h2>
        <p><strong>${esc(name)}</strong> &lt;${esc(email)}&gt; ${esc(phone)}</p>
        <p style="white-space:pre-wrap">${esc(message)}</p>`,
    });
  } catch (err) {
    console.error("[contact] send failed:", err);
    return NextResponse.json({ error: "Message could not be sent right now. Please try the phone number." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
