"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { uploadImageToStorage } from "@/lib/storage";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function DonateSection() {
  const isOnline = useNetworkStatus();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showPublicName, setShowPublicName] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [copiedUpiId, setCopiedUpiId] = useState(false);

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const screenshotUploadRef = useRef<HTMLButtonElement>(null);

  const enteredAmount = Number(amount);
  const hasValidAmount = Number.isFinite(enteredAmount) && enteredAmount > 0;
  const upiPaymentLink = `upi://pay?${new URLSearchParams({
    pa: COLONY_BOIS_CONTACT.upiId,
    pn: "Colony Bois Rampuram",
    cu: "INR",
    tn: "Chanda contribution",
    ...(hasValidAmount ? { am: enteredAmount.toFixed(2) } : {}),
  }).toString()}`;

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(COLONY_BOIS_CONTACT.upiId);
      setCopiedUpiId(true);
      window.setTimeout(() => setCopiedUpiId(false), 1800);
    } catch {
      setError("Unable to copy the UPI ID. Please select and copy it manually.");
    }
  };

  const handleScreenshotChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setScreenshot(file);
    setScreenshotPreview(file ? URL.createObjectURL(file) : null);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isOnline) {
      setError("Offline — reconnect to submit your contribution.");
      return;
    }
    const warnAndFocus = (message: string, input: HTMLElement | null) => {
      setError(message);
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => input?.focus(), 250);
    };
    if (name.trim().length === 0) {
      warnAndFocus("Please enter your name before submitting your Chanda.", nameInputRef.current);
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      warnAndFocus(
        "Please enter a valid email address before submitting your Chanda.",
        emailInputRef.current,
      );
      return;
    }
    if (phone.length !== 10) {
      warnAndFocus(
        "Please enter your valid 10-digit mobile number before submitting your Chanda.",
        phoneInputRef.current,
      );
      return;
    }
    if (Number(amount) <= 0) {
      warnAndFocus("Please enter the Chanda amount before submitting.", amountInputRef.current);
      return;
    }
    if (!screenshot) {
      warnAndFocus(
        "Please upload your payment screenshot before submitting your Chanda.",
        screenshotUploadRef.current,
      );
      return;
    }
    if (!showPublicName) {
      setError("Please confirm that your name may be displayed in the Supporters section.");
      return;
    }
    if (
      !window.confirm(
        `Submit your Chanda contribution of ₹${Number(amount).toLocaleString("en-IN")} for admin verification?`,
      )
    )
      return;

    setLoading(true);
    setError("");
    try {
      const screenshotUrl = await uploadImageToStorage(screenshot, "payment-proofs");

      await addDoc(collection(db, "online_donations"), {
        residentName: name.trim(),
        donorName: name.trim(),
        collectionSource: "direct_self",
        donorEmail: email.trim() || null,
        phone,
        amount: Number(amount),
        message: message.trim() || null,
        paymentMethod: "upi",
        screenshotUrl,
        showPublicName,
        emailStatus: "not_sent",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setAmount("");
      setMessage("");
      setShowPublicName(false);
      setScreenshot(null);
      setScreenshotPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (reason) {
      setError(
        reason instanceof Error
          ? `Submission failed: ${reason.message}`
          : "Submission failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSuccess(false);
    setError("");
  };

  if (success) {
    return (
      <div className="rounded-2xl border-2 border-orange-400 bg-orange-50 p-10 text-center">
        <span className="font-yatra text-5xl text-orange-700">Ganpati Bappa Morya</span>
        <h3 className="mt-3 font-display text-xl font-semibold text-slate-900">Jai Dev Ganesha!</h3>
        <p className="mt-2 text-slate-700">
          Your contribution has been logged for verification. Thank you!
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Your official receipt will be sent to your email after admin approval.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 font-bold text-white shadow-temple hover:from-orange-600 hover:to-amber-600"
        >
          Submit Another Contribution
        </button>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="font-yatra text-xl text-orange-700">Mangal May Utsav</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-slate-900">
            Online <span className="text-orange-600">Chanda / Contribution</span>
          </h2>
          <p className="mt-2 text-slate-500">Scan the QR, pay, then fill in your details below.</p>
        </div>

        <form
          noValidate
          onSubmit={submit}
          className="rounded-2xl border border-amber-200 bg-white/80 p-6 shadow-gold md:p-8 space-y-5"
        >
          <p className="text-sm font-semibold text-slate-600">
            After paying, fill in your details:
          </p>

          {/* Name + Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Your Name *
              <input
                ref={nameInputRef}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Full name"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Mobile Number *
              <input
                ref={phoneInputRef}
                maxLength={10}
                inputMode="numeric"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="10-digit number"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </label>
          </div>

          {/* Email */}
          <label className="block text-sm font-semibold text-slate-700">
            Email Address *{" "}
            <span className="font-normal text-slate-400">(for receipt after approval)</span>
            <input
              required
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="yourname@example.com"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </label>

          {/* Amount */}
          <label className="block text-sm font-semibold text-slate-700">
            Amount Paid (₹) *
            <input
              ref={amountInputRef}
              type="number"
              min="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              placeholder="e.g. 501"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </label>

          <div className="rounded-xl border border-orange-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-900">Pay directly with UPI</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Pay from any UPI app using the ID below, then submit your payment details for
              verification.
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-orange-600">UPI ID</p>
                <p className="mt-1 select-all font-mono font-bold text-slate-900">
                  {COLONY_BOIS_CONTACT.upiId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void copyUpiId()}
                aria-label="Copy UPI ID"
                className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copiedUpiId ? "Copied" : "Copy"}
              </button>
            </div>
            <button
              disabled={!isOnline}
              type="button"
              onClick={() => {
                if (!hasValidAmount) {
                  setError("Enter a Chanda amount before showing the payment QR code.");
                  return;
                }
                setError("");
                setShowQrCode(true);
              }}
              className="mt-3 w-full rounded-lg border-2 border-orange-300 bg-orange-50 py-3 font-bold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pay using QR Code
            </button>
            {showQrCode && (
              <div className="mt-5 border-t border-orange-100 pt-5 text-center">
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-orange-600">
                  Scan &amp; Pay via any UPI app
                </p>
                <div className="inline-block rounded-xl bg-white p-3 shadow-inner ring-1 ring-orange-100">
                  <QRCodeSVG
                    value={upiPaymentLink}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#1e1b4b"
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  UPI ID:{" "}
                  <span className="font-bold text-slate-800 select-all">
                    {COLONY_BOIS_CONTACT.upiId}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Works with PhonePe, GPay, Paytm, BHIM &amp; all UPI apps
                </p>
              </div>
            )}
          </div>

          {!isOnline && (
            <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
              Offline — Reconnect to submit
            </p>
          )}

          <label className="block text-sm font-semibold text-slate-700">
            Message or payment details{" "}
            <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Any details you would like us to know"
              className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </label>

          {/* Screenshot upload */}
          <div>
            <p className="text-sm font-semibold text-slate-700">Payment Screenshot *</p>
            {screenshotPreview ? (
              <div className="mt-2 relative inline-block">
                <img
                  src={screenshotPreview}
                  alt="Payment screenshot preview"
                  className="h-48 rounded-xl border border-orange-200 object-contain bg-white"
                />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  aria-label="Remove screenshot"
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold hover:bg-rose-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                ref={screenshotUploadRef}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-300 bg-white py-5 text-sm font-semibold text-orange-600 hover:border-orange-400 hover:bg-orange-50 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4 4 4"
                  />
                </svg>
                Upload payment screenshot *
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleScreenshotChange}
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          {/* Public name consent */}
          <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-orange-200 bg-white p-4">
            <input
              required
              type="checkbox"
              checked={showPublicName}
              onChange={(e) => {
                setShowPublicName(e.target.checked);
                setError("");
              }}
              className="mt-0.5 h-4 w-4 flex-none accent-orange-500"
            />
            <span className="text-sm text-slate-700">
              <span className="font-semibold">Display my name on the Colony Bois website *</span>
              <span className="block mt-0.5 text-slate-500 font-normal">
                After admin approval, your name will appear in the public Supporters section. Your
                phone number and payment details will never be shown.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !isOnline}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-3 font-bold text-white shadow-temple hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition"
          >
            {loading ? "Submitting…" : "Submit Contribution Details"}
          </button>
        </form>
      </div>
    </div>
  );
}
