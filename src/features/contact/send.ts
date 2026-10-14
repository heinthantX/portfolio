// provider [CONFIRM] (e.g. Resend)

import type { ContactInput } from "./schema";

export interface SendContactResult {
  ok: true;
}

/**
 * Sends a contact message.
 * In development and current MVP, this logs a sanitized one-line summary
 * (name, email domain, and message character count) without exposing the message body.
 */
export async function sendContactMessage(
  data: Pick<ContactInput, "name" | "email" | "message">,
): Promise<SendContactResult> {
  const emailDomain = data.email.includes("@")
    ? data.email.split("@")[1]?.toLowerCase()
    : "unknown";

  // ONLY log a one-line summary (name + email domain + message length, never the full body)
  console.info(
    `[contact] message received from ${data.name} (@${emailDomain}), length: ${data.message.length}`,
  );

  return { ok: true };
}
