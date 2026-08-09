import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { thankYouEmail, receiptEmail, greetingEmail, type EmailType } from "@/lib/email-templates";

// RESEND_API_KEY is a server-side env var — never exposed to the browser
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Colony Bois <notifications@colonybois.in>";

export type SendEmailRequest = {
  type: EmailType;
  to: string;
  donorName: string;
  amount?: number;
  paymentMethod?: string;
  date?: string;
  referenceId?: string;
  collectorName?: string;
  verificationStatus?: string;
  // passed back so the caller can store in Firestore
  targetCollection: "online_donations" | "donations";
  targetId: string;
};

export type SendEmailResponse =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export async function POST(req: NextRequest): Promise<NextResponse<SendEmailResponse>> {
  // Guard: must have API key configured
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "Email service not configured." }, { status: 503 });
  }

  let body: SendEmailRequest;
  try {
    body = (await req.json()) as SendEmailRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const { type, to, donorName, amount = 0, paymentMethod = "UPI", date = "", referenceId = "" } = body;

  // Basic email validation
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
  }

  let subject: string;
  let html: string;

  if (type === "thank_you") {
    ({ subject, html } = thankYouEmail({ donorName, amount, paymentMethod, date, referenceId }));
  } else if (type === "receipt") {
    ({ subject, html } = receiptEmail({
      donorName, amount, paymentMethod, date, referenceId,
      collectorName: body.collectorName,
      verificationStatus: body.verificationStatus ?? "Verified ✅",
    }));
  } else if (type === "greeting") {
    ({ subject, html } = greetingEmail(donorName));
  } else {
    return NextResponse.json({ ok: false, error: "Unknown email type." }, { status: 400 });
  }

  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html });
    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error.message }, { status: 502 });
    }
    return NextResponse.json({ ok: true, messageId: result.data?.id ?? "" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Resend error.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
