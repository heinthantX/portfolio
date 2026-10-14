"use server";

import { headers } from "next/headers";
import { profile } from "@/content/profile";
import { rateLimiter } from "./rate-limit";
import { contactSchema } from "./schema";
import { sendContactMessage } from "./send";

export type ContactFormState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      fieldErrors?: Record<string, string[]>;
      message: string;
    }
  | {
      status: "rate-limited";
      retryAfterSec: number;
    };

/**
 * Server Action for contact form submission.
 * Validates with contactSchema, enforces per-IP rate limiting,
 * silently passes honeypot submissions, and sends the message summary.
 */
export async function submitContact(
  _prevState: ContactFormState,
  payload: FormData,
): Promise<ContactFormState> {
  const rawData = payload;

  let raw: {
    name?: unknown;
    email?: unknown;
    message?: unknown;
    company?: unknown;
  } = {};

  if (rawData instanceof FormData) {
    raw = {
      name: rawData.get("name") ?? undefined,
      email: rawData.get("email") ?? undefined,
      message: rawData.get("message") ?? undefined,
      company: rawData.get("company") ?? undefined,
    };
  } else if (typeof rawData === "object" && rawData !== null) {
    raw = rawData as Record<string, unknown>;
  }

  // Honeypot check: if filled, silently return success without sending
  if (typeof raw.company === "string" && raw.company.trim().length > 0) {
    return { status: "success" };
  }

  // Validate fields against contactSchema
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      fieldErrors,
      message: "Please correct the highlighted fields.",
    };
  }

  // E2E test hook (only when CONTACT_TEST_HOOKS=1): 'ratelimit@example.com' is treated as
  // rate-limited immediately for deterministic end-to-end testing.
  if (process.env.CONTACT_TEST_HOOKS === "1" && parsed.data.email === "ratelimit@example.com") {
    return { status: "rate-limited", retryAfterSec: 60 };
  }

  // Rate limiting keyed by x-real-ip, else the LAST x-forwarded-for hop (added by our proxy;
  // earlier entries are client-controlled and spoofable).
  const headerList = await headers();
  const ip =
    headerList.get("x-real-ip")?.trim() ||
    headerList.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
    "anon";

  const rateResult = rateLimiter.check(ip);
  if (!rateResult.allowed) {
    return {
      status: "rate-limited",
      retryAfterSec: rateResult.retryAfterSec ?? 600,
    };
  }

  const sent = await sendContactMessage(parsed.data);
  if (!sent.ok) {
    return {
      status: "error",
      message: `Your message could not be sent. Please email me directly at ${profile.contact.email}.`,
    };
  }

  return { status: "success" };
}
