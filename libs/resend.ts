import config from "@/config";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;

let resendClient: Resend | null = null;

if (resendApiKey) {
  resendClient = new Resend(resendApiKey);
} else if (process.env.NODE_ENV === "development") {
  console.warn("[resend] RESEND_API_KEY is missing. Emails will not be sent.");
}

if (!resendFrom && process.env.NODE_ENV === "development") {
  console.warn("[resend] RESEND_FROM is missing. Emails will not be sent.");
}

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
};

function normalize(value?: string | string[]) {
  if (!value) return undefined;
  return Array.isArray(value) ? value : [value];
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  cc,
  bcc,
}: SendEmailParams): Promise<void> {
  if (!resendClient || !resendFrom) {
    throw new Error("Resend is not configured. Set RESEND_API_KEY and RESEND_FROM.");
  }

  console.log(`[resend] Sending email to: ${Array.isArray(to) ? to.join(', ') : to}, subject: "${subject}"`);

  try {
    const result = await resendClient.emails.send({
      from: resendFrom,
      to: normalize(to)!,
      subject,
      html,
      text,
      cc: normalize(cc),
      bcc: normalize(bcc),
      replyTo: replyTo ?? config.mailgun.supportEmail ?? undefined,
    });

    console.log(`[resend] Email sent successfully. ID: ${result.data?.id}`);
  } catch (error) {
    console.error("[resend] Failed to send email:", {
      to: Array.isArray(to) ? to : [to],
      subject,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
