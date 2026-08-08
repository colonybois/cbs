"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { uploadImageToStorage } from "@/lib/storage";

export default function DonateSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [message, setMessage] = useState("");
  const [showPublicName, setShowPublicName] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const enteredAmount = Number(amount);
  const hasValidAmount = Number.isFinite(enteredAmount) && enteredAmount > 0;
  const upiPaymentLink = `upi://pay?${new URLSearchParams({
    pa: COLONY_BOIS_CONTACT.upiId,
    pn: "Colony Bois Rampuram",
    cu: "INR",
    tn: "Chanda contribution",
    ...(hasValidAmount ? { am: enteredAmount.toFixed(2) } : {}),
  }).toString()}`;

  const payChanda = () => {
    if (!hasValidAmount) {
      setError("Enter a Chanda amount before opening your UPI app.");
      return;
    }
    setError("");
    window.location.assign(upiPaymentLink);
  };

  const handleScreenshotChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setScreenshot(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setScreenshotPreview(url);
    } else {
      setScreenshotPreview(null);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name.trim().length === 0) { setError("Please enter your name."); return; }
    if (phone.length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
    if (Number(amount) <= 0) { setError("Enter a valid amount."); return; }

    setLoading(true);
    setError("");
    try {
      let screenshotUrl: string | null = null;
      if (screenshot) {
        screenshotUrl = await uploadImageToStorage(screenshot, "payment-proofs");
      }
      await addDoc(collection(db, "online_donations"), {
        residentName: name.trim(),
        phone,
        amount: Number(amount),
        transactionId: transactionId.trim() || null,
        message: message.trim() || null,
        paymentMethod: "upi",
        screenshotUrl,
        showPublicName,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setName(""); setPhone(""); setAmount(""); setTransactionId(""); setMessage("");
      setScreenshot(null); setScreenshotPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (reason) {
      setError(reason instanceof Error ? `Submission failed: ${reason.message}` : "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setSuccess(false); setError(""); };

  if (success) {
    return (
      <div className="rounded-2xl border-2 border-orange-400 bg-orange-50 p-10 text-center">
        <span className="text-5xl">🚩</span>
        <h3 className="mt-3 text-xl font-bold text-slate-900">Jai Dev Ganesha!</h3>
        <p className="mt-2 text-slate-700">Your contribution has been logged for verification. Thank you!</p>
        <button onClick={reset} className="mt-6 rounded-lg bg-orange-500 px-6 py-2.5 font-bold text-white hover:bg-orange-600">
          Submit Another Contribution
        </button>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mx-auto max-w-3xl">

        {/* Heading */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">
            🚩 Online <span className="text-orange-600">Chanda / Contribution</span>
          </h2>
          <p className="mt-2 text-slate-500">Scan the QR, pay, then fill in your details below.</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="rounded-2xl border border-orange-100 bg-orange-50/40 p-6 shadow-sm md:p-8 space-y-5">
          <p className="text-sm font-semibold text-slate-600">After paying, fill in your details:</p>

          {/* Name + Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Your Name *
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Mobile Number *
              <input
                required
                maxLength={10}
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit number"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </label>
          </div>

          {/* Amount */}
          <label className="block text-sm font-semibold text-slate-700">
            Amount Paid (₹) *
            <input
              required
              type="number"
              min="1"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(""); }}
              placeholder="e.g. 501"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </label>

          <div className="rounded-xl border border-orange-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-900">Pay directly with UPI</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Enter your amount above, then open Google Pay, PhonePe, Paytm, BHIM, or another available UPI app to complete the payment.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => { setShowQrCode(false); payChanda(); }} className="w-full rounded-lg bg-orange-500 py-3 font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600">Pay Chanda via UPI →</button>
              <button type="button" onClick={() => { if (!hasValidAmount) { setError("Enter a Chanda amount before showing the payment QR code."); return; } setError(""); setShowQrCode(true); }} className="w-full rounded-lg border-2 border-orange-300 bg-orange-50 py-3 font-bold text-orange-700 transition hover:bg-orange-100">Pay using QR Code</button>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">You will be redirected to your UPI app. After payment, return here and submit your contribution details below for verification. Payment is not marked successful until it is verified.</p>
            {showQrCode && (
              <div className="mt-5 border-t border-orange-100 pt-5 text-center">
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-orange-600">Scan &amp; Pay via any UPI app</p>
                <div className="inline-block rounded-xl bg-white p-3 shadow-inner ring-1 ring-orange-100"><QRCodeSVG value={upiPaymentLink} size={200} bgColor="#ffffff" fgColor="#1e1b4b" level="H" includeMargin={false} /></div>
                <p className="mt-4 text-xs text-slate-500">UPI ID: <span className="font-bold text-slate-800 select-all">{COLONY_BOIS_CONTACT.upiId}</span></p>
                <p className="mt-1 text-xs text-slate-400">Works with PhonePe, GPay, Paytm, BHIM &amp; all UPI apps</p>
              </div>
            )}
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            UPI Reference / Transaction Number <span className="font-normal text-slate-400">(if available)</span>
            <input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Enter the UPI reference after payment" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Message or payment details <span className="font-normal text-slate-400">(optional)</span>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Any details you would like us to know" className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </label>


          {/* Screenshot upload */}
          <div>
            <p className="text-sm font-semibold text-slate-700">Payment Screenshot <span className="font-normal text-slate-400">(optional but recommended)</span></p>
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
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-300 bg-white py-5 text-sm font-semibold text-orange-600 hover:border-orange-400 hover:bg-orange-50 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4 4 4"/>
                </svg>
                Upload payment screenshot
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 py-3 font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 transition"
          >
            {loading ? "Submitting…" : "Submit Contribution Details"}
          </button>
        </form>

      </div>
    </div>
  );
}
