import type { ContactInput } from "./schema";

export type SendContactResult = { ok: true } | { ok: false; reason?: "not-configured" };

/**
 * Sends a contact message via Resend (plain fetch, no SDK).
 * Unconfigured: dev/test hooks log a PII-free notice and succeed; production fails closed.
 * Never logs name, email, or message content.
 */
export async function sendContactMessage(
  data: Pick<ContactInput, "name" | "email" | "message">,
): Promise<SendContactResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    if (process.env.CONTACT_TEST_HOOKS === "1" || process.env.NODE_ENV !== "production") {
      console.info(`[contact] delivery not configured; message length: ${data.message.length}`);
      return { ok: true };
    }
    return { ok: false, reason: "not-configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? "Portfolio <onboarding@resend.dev>",
        to,
        reply_to: data.email,
        subject: `Portfolio contact: ${data.name.replace(/[\r\n]+/g, " ").slice(0, 80)}`,
        text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
      }),
    });
    return res.ok ? { ok: true } : { ok: false };
  } catch {
    return { ok: false };
  }
}
