"use client";

import { useState, type FormEvent } from "react";
import { addDoc, collection } from "firebase/firestore";
import { COLONY_BOIS_ASSETS } from "@/lib/assets";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/storage";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function PaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isOnline = useNetworkStatus();
  const [submitted, setSubmitted] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isOnline) {
      setError("Offline — reconnect to submit.");
      return;
    }
    if (!screenshot) {
      setError("Please choose a payment screenshot.");
      return;
    }
    if (!window.confirm("Submit this payment proof for admin verification?")) return;
    const form = new FormData(event.currentTarget);
    setUploading(true);
    setError("");
    try {
      const screenshotUrl = await uploadImage(screenshot, "payment-proofs");
      await addDoc(collection(db, "online_donations"), {
        residentName: String(form.get("residentName") || "").trim(),
        phone: String(form.get("phone") || "").trim(),
        amount: Number(form.get("amount")),
        transactionId: String(form.get("transactionId") || "").trim(),
        screenshotUrl,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not submit the payment proof. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-orange-500 bg-white p-6 shadow-2xl shadow-orange-200/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="payment-title" className="text-xl font-black text-orange-600">
              Scan QR & Pay Chanda via UPI
            </h2>
            <p className="mt-1 text-sm text-slate-600">Thank you for supporting Colony Bois.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close payment modal"
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-orange-50 hover:text-orange-600"
          >
            ✕
          </button>
        </div>
        <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <img
            src={COLONY_BOIS_ASSETS.paymentQr.src}
            alt={COLONY_BOIS_ASSETS.paymentQr.alt}
            className="mx-auto aspect-square w-full max-w-[260px] rounded-lg object-contain"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <p className="py-8 text-center text-sm text-orange-700">
            Place <b>payment-qr.jpg</b> in public/assets/images to show the PhonePe QR code.
          </p>
        </div>
        {submitted ? (
          <div className="mt-5 rounded-xl bg-orange-50 p-4 text-sm font-semibold text-orange-800">
            ✓ Your payment proof has been submitted for admin approval.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <input
              required
              name="residentName"
              placeholder="Resident name"
              className="w-full rounded-xl border border-orange-200 bg-white p-3"
            />
            <input
              required
              name="phone"
              type="tel"
              placeholder="Phone number"
              className="w-full rounded-xl border border-orange-200 bg-white p-3"
            />
            <input
              required
              name="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="Amount paid (₹)"
              className="w-full rounded-xl border border-orange-200 bg-white p-3"
            />
            <input
              required
              name="transactionId"
              placeholder="Transaction ID / UTR number"
              className="w-full rounded-xl border border-orange-200 bg-white p-3"
            />
            <label className="block rounded-xl border border-dashed border-orange-300 bg-orange-50 p-3 text-sm font-semibold text-slate-700">
              Upload payment screenshot
              <input
                required
                type="file"
                accept="image/*"
                onChange={(event) => setScreenshot(event.target.files?.[0] || null)}
                className="mt-2 block w-full text-xs"
              />
              {screenshot && (
                <span className="mt-2 block text-xs text-orange-700">{screenshot.name}</span>
              )}
            </label>
            {!isOnline && (
              <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                Offline — Reconnect to submit
              </p>
            )}
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              disabled={uploading || !isOnline}
              type="submit"
              className="w-full rounded-lg bg-orange-500 px-6 py-3 font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Submit for verification"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
