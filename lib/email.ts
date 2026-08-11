"use client";
// Email notifications via EmailJS — runs entirely client-side, no server required.
// Uses the existing Colony Bois service + template already configured in EmailJS.

import emailjs from "@emailjs/browser";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── EmailJS config (public credentials — safe in client code) ─────────────────
const EMAILJS_SERVICE_ID = "service_2h9hlku";
const EMAILJS_TEMPLATE_ID = "template_m8w6xcf";
const EMAILJS_PUBLIC_KEY = "Os5Fnn5CND6oBTr5y";

// ── Types ─────────────────────────────────────────────────────────────────────
export type EmailType = "thank_you" | "receipt" | "greeting";
export type EmailStatus = "not_sent" | "sending" | "sent" | "failed";

export interface SendEmailOptions {
  type: EmailType;
  /** Donor's email address — always sent TO the donor, never to admin */
  to: string;
  donorName: string;
  amount?: number;
  paymentMethod?: string;
  date?: string;
  referenceId?: string;
  collectorName?: string;
  targetCollection: "online_donations" | "donations";
  targetId: string;
  triggeredBy?: string;
  triggeredByName?: string;
}

/**
 * Send a donation email via EmailJS using the existing Colony Bois template.
 * Template variables: donor_name, amount, payment_method, date, reference_id
 *
 * Never throws — returns ok/error so callers can show status without
 * breaking the donation/collection flow on failure.
 */
export async function sendDonationEmail(
  opts: SendEmailOptions,
): Promise<{ ok: boolean; error?: string }> {
  if (!opts.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(opts.to)) {
    return { ok: false, error: "Invalid email address." };
  }

  // Map to the template variables in the existing EmailJS template
  const templateParams = {
    // EmailJS only uses the variable configured in the template's “To Email”
    // field. Keep the common aliases while existing templates are migrated.
    to_email: opts.to,
    to: opts.to,
    email: opts.to,
    recipient_email: opts.to,
    recipient: opts.to,
    donor_name: opts.donorName || "Donor",
    amount: opts.amount != null ? `₹${Number(opts.amount).toLocaleString("en-IN")}` : "—",
    payment_method: opts.paymentMethod || "UPI",
    date: opts.date || emailDate(),
    reference_id: opts.referenceId || opts.targetId.slice(0, 10).toUpperCase(),
    // Extra context fields — kept in case the template uses them
    collector_name: opts.collectorName || "",
  };

  let ok = false;
  let error: string | undefined;

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    ok = true;
  } catch (err) {
    ok = false;
    error =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "text" in err
          ? String((err as { text: unknown }).text)
          : "EmailJS send failed";
    console.error("[sendDonationEmail] EmailJS error:", err);
  }

  // Log to Firestore — fire-and-forget, never blocks the caller
  try {
    await addDoc(collection(db, "email_logs"), {
      targetCollection: opts.targetCollection,
      targetId: opts.targetId,
      type: opts.type,
      recipientEmail: opts.to,
      recipientName: opts.donorName,
      status: ok ? "sent" : "failed",
      error: error ?? null,
      triggeredBy: opts.triggeredBy ?? "system",
      triggeredByName: opts.triggeredByName ?? "System",
      sentAt: serverTimestamp(),
    });
  } catch {
    // Log failure must never affect the donation flow
  }

  return { ok, error };
}

/** Format a timestamp for inclusion in email template */
export function emailDate(v?: string | { toDate?: () => Date } | null): string {
  if (!v) {
    return new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const d = typeof v === "string" ? new Date(v) : v?.toDate?.();
  return (
    d?.toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) ?? emailDate()
  );
}
