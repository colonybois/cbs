"use client";
// Client-side helper — calls the /api/email/send route (never touches RESEND_API_KEY)

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SendEmailRequest } from "@/app/api/email/send/route";
import type { EmailType } from "@/lib/email-templates";

export type EmailStatus = "not_sent" | "queued" | "sent" | "failed";

export interface SendEmailOptions {
  type: EmailType;
  to: string;
  donorName: string;
  amount?: number;
  paymentMethod?: string;
  date?: string;
  referenceId?: string;
  collectorName?: string;
  verificationStatus?: string;
  targetCollection: "online_donations" | "donations";
  targetId: string;
  /** UID of the admin/system triggering the send */
  triggeredBy?: string;
  triggeredByName?: string;
}

/**
 * Calls the server-side API route, then logs the result to Firestore email_logs.
 * Never throws — returns success/failure so callers can show status without breaking the donation flow.
 */
export async function sendDonationEmail(opts: SendEmailOptions): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const payload: SendEmailRequest = {
    type: opts.type,
    to: opts.to,
    donorName: opts.donorName,
    amount: opts.amount,
    paymentMethod: opts.paymentMethod,
    date: opts.date,
    referenceId: opts.referenceId,
    collectorName: opts.collectorName,
    verificationStatus: opts.verificationStatus,
    targetCollection: opts.targetCollection,
    targetId: opts.targetId,
  };

  let ok = false;
  let messageId: string | undefined;
  let error: string | undefined;

  try {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json() as { ok: boolean; messageId?: string; error?: string };
    ok = data.ok;
    messageId = data.messageId;
    error = data.error;
  } catch (err) {
    ok = false;
    error = err instanceof Error ? err.message : "Network error";
  }

  // Log to Firestore email_logs — fire-and-forget, never block the caller
  try {
    await addDoc(collection(db, "email_logs"), {
      targetCollection: opts.targetCollection,
      targetId: opts.targetId,
      type: opts.type,
      recipientEmail: opts.to,
      recipientName: opts.donorName,
      status: ok ? "sent" : "failed",
      messageId: messageId ?? null,
      error: error ?? null,
      triggeredBy: opts.triggeredBy ?? "system",
      triggeredByName: opts.triggeredByName ?? "System",
      sentAt: serverTimestamp(),
    });
  } catch {
    // Log failure must never affect the donation flow
  }

  return { ok, messageId, error };
}

/** Formats a date for email display */
export function emailDate(v?: string | { toDate?: () => Date } | null): string {
  if (!v) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const d = typeof v === "string" ? new Date(v) : v?.toDate?.();
  return d?.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) ?? "";
}
