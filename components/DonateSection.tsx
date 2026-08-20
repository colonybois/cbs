"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import SectionHeading from "@/components/SectionHeading";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { uploadImageToStorage } from "@/lib/storage";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

type DonationMethod = "upi" | "qr";

function buildUpiLink(amount: number) {
  return `upi://pay?${new URLSearchParams({
    pa: COLONY_BOIS_CONTACT.upiId,
    pn: "Colony Bois Rampuram",
    cu: "INR",
    tn: "Chanda contribution",
    am: amount.toFixed(2),
  }).toString()}`;
}

export default function DonateSection() {
  const isOnline = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<DonationMethod>("upi");
  const [copiedUpiId, setCopiedUpiId] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState<DonationMethod | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [upiAmount, setUpiAmount] = useState("");
  const [upiName, setUpiName] = useState("");
  const [upiEmail, setUpiEmail] = useState("");
  const [upiScreenshot, setUpiScreenshot] = useState<File | null>(null);
  const [upiScreenshotPreview, setUpiScreenshotPreview] = useState<string | null>(null);

  const [qrAmount, setQrAmount] = useState("");
  const [qrName, setQrName] = useState("");
  const [qrEmail, setQrEmail] = useState("");
  const [qrScreenshot, setQrScreenshot] = useState<File | null>(null);
  const [qrScreenshotPreview, setQrScreenshotPreview] = useState<string | null>(null);
  const [showPublicName, setShowPublicName] = useState(false);

  const upiFileRef = useRef<HTMLInputElement>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);
  const upiNameRef = useRef<HTMLInputElement>(null);
  const upiEmailRef = useRef<HTMLInputElement>(null);
  const upiAmountRef = useRef<HTMLInputElement>(null);
  const upiProofRef = useRef<HTMLButtonElement>(null);
  const qrNameRef = useRef<HTMLInputElement>(null);
  const qrEmailRef = useRef<HTMLInputElement>(null);
  const qrAmountRef = useRef<HTMLInputElement>(null);
  const qrProofRef = useRef<HTMLButtonElement>(null);

  const upiEnteredAmount = Number(upiAmount);
  const upiHasValidAmount = Number.isFinite(upiEnteredAmount) && upiEnteredAmount > 0;
  const qrEnteredAmount = Number(qrAmount);
  const qrHasValidAmount = Number.isFinite(qrEnteredAmount) && qrEnteredAmount > 0;

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-ink placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(COLONY_BOIS_CONTACT.upiId);
      setCopiedUpiId(true);
      window.setTimeout(() => setCopiedUpiId(false), 1800);
    } catch {
      setError("Unable to copy the UPI ID. Please select and copy it manually.");
    }
  };

  const handleScreenshotChange =
    (method: DonationMethod) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      setError("");
      if (method === "upi") {
        setUpiScreenshot(file);
        setUpiScreenshotPreview(file ? URL.createObjectURL(file) : null);
      } else {
        setQrScreenshot(file);
        setQrScreenshotPreview(file ? URL.createObjectURL(file) : null);
      }
    };

  const removeScreenshot = (method: DonationMethod) => {
    if (method === "upi") {
      setUpiScreenshot(null);
      setUpiScreenshotPreview(null);
      if (upiFileRef.current) upiFileRef.current.value = "";
    } else {
      setQrScreenshot(null);
      setQrScreenshotPreview(null);
      if (qrFileRef.current) qrFileRef.current.value = "";
    }
  };

  const warnAndFocus = (message: string, input: HTMLElement | null) => {
    setError(message);
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input?.focus(), 250);
  };

  const validateCommon = (
    method: DonationMethod,
    name: string,
    email: string,
    amount: string,
    screenshot: File | null,
    refs: {
      name: HTMLInputElement | null;
      email: HTMLInputElement | null;
      amount: HTMLInputElement | null;
      proof: HTMLButtonElement | null;
    },
  ) => {
    if (name.trim().length === 0) {
      warnAndFocus("Please enter your name before submitting your Chanda.", refs.name);
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      warnAndFocus(
        "Please enter a valid email address before submitting your Chanda.",
        refs.email,
      );
      return false;
    }
    if (Number(amount) <= 0) {
      warnAndFocus("Please enter the Chanda amount before submitting.", refs.amount);
      return false;
    }
    if (!screenshot) {
      warnAndFocus(
        "Please upload your payment screenshot before submitting your Chanda.",
        refs.proof,
      );
      return false;
    }
    if (!showPublicName) {
      setError("Please confirm that your name may be displayed in the Supporters section.");
      return false;
    }
    return true;
  };

  const resetForm = (method: DonationMethod) => {
    if (method === "upi") {
      setUpiAmount("");
      setUpiName("");
      setUpiEmail("");
      setUpiScreenshot(null);
      setUpiScreenshotPreview(null);
      if (upiFileRef.current) upiFileRef.current.value = "";
    } else {
      setQrAmount("");
      setQrName("");
      setQrEmail("");
      setQrScreenshot(null);
      setQrScreenshotPreview(null);
      setShowPublicName(false);
      if (qrFileRef.current) qrFileRef.current.value = "";
    }
  };

  const submit =
    (method: DonationMethod) => async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isOnline) {
        setError("Offline — reconnect to submit your contribution.");
        return;
      }

      const isUpi = method === "upi";
      const name = isUpi ? upiName : qrName;
      const email = isUpi ? upiEmail : qrEmail;
      const amount = isUpi ? upiAmount : qrAmount;
      const screenshot = isUpi ? upiScreenshot : qrScreenshot;
      const refs = isUpi
        ? {
            name: upiNameRef.current,
            email: upiEmailRef.current,
            amount: upiAmountRef.current,
            proof: upiProofRef.current,
          }
        : {
            name: qrNameRef.current,
            email: qrEmailRef.current,
            amount: qrAmountRef.current,
            proof: qrProofRef.current,
          };

      if (!validateCommon(method, name, email, amount, screenshot, refs)) return;

      if (
        !window.confirm(
          `Submit your Chanda contribution of ₹${Number(amount).toLocaleString("en-IN")} for admin verification?`,
        )
      ) {
        return;
      }

      setLoadingMethod(method);
      setError("");
      try {
        const screenshotUrl = await uploadImageToStorage(screenshot!, "payment-proofs");

        const payload = {
          residentName: name.trim(),
          donorName: name.trim(),
          collectionSource: "direct_self",
          donorEmail: email.trim(),
          phone: "",
          amount: Number(amount),
          paymentMethod: method,
          screenshotUrl: screenshotUrl.slice(0, 60) + "…",
          showPublicName,
          emailStatus: "not_sent",
          status: "pending",
          createdAt: "serverTimestamp()",
        };
        console.log("[Donate] Payload being sent:", JSON.stringify(payload, null, 2));

        await addDoc(collection(db, "online_donations"), {
          residentName: name.trim(),
          donorName: name.trim(),
          collectionSource: "direct_self",
          donorEmail: email.trim(),
          phone: "",
          amount: Number(amount),
          paymentMethod: method,
          screenshotUrl,
          showPublicName,
          emailStatus: "not_sent",
          status: "pending",
          createdAt: serverTimestamp(),
        });

        console.log("[Donate] Success!");
        resetForm(method);
        setSuccess(true);
      } catch (reason: unknown) {
        console.error("[Donate] FULL ERROR:", reason);
        const err = reason as { code?: string; message?: string };
        const code = err?.code || "";
        const msg = err?.message || String(reason);
        setError(
          `[${code || "UNKNOWN"}] ${msg}`,
        );
      } finally {
        setLoadingMethod(null);
      }
    };

  const reset = () => {
    setSuccess(false);
    setError("");
  };

  if (success) {
    return (
      <div className="mx-auto max-w-xl py-8 text-center">
        <p className="font-yatra text-3xl text-primary">गणपति बप्पा मोरया</p>
        <h3 className="mt-3 font-display text-2xl font-semibold text-ink">Thank you</h3>
        <p className="mt-2 text-[var(--text-muted)]">
          Your contribution is logged for verification. A receipt will be emailed after approval.
        </p>
        <button onClick={reset} className="btn-festive mt-6 px-6 py-2.5">
          Submit another
        </button>
      </div>
    );
  }

  const proofField = (
    method: DonationMethod,
    preview: string | null,
    proofRef: { current: HTMLButtonElement | null },
    fileRef: { current: HTMLInputElement | null },
  ) => (
    <div className="mt-4">
      <p className="text-sm font-medium text-ink">Payment screenshot *</p>
      {preview ? (
        <div className="relative mt-2 inline-block">
          <img
            src={preview}
            alt="Payment screenshot preview"
            className="h-32 rounded-xl object-contain ring-1 ring-navy/10"
          />
          <button
            type="button"
            onClick={() => removeScreenshot(method)}
            aria-label="Remove screenshot"
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-xs text-on-primary"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          ref={proofRef}
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-2 w-full rounded-xl border border-dashed border-[#d8cbb8] bg-white py-3.5 text-sm font-medium text-ink"
        >
          Upload screenshot
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleScreenshotChange(method)}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <SectionHeading
        align="center"
        kicker="Chanda"
        title="Online contribution"
        symbol="ॐ"
        tone="primary"
        lede="Choose UPI or QR, pay, then share your details for verification."
      />

      {!isOnline && (
        <p className="mt-6 text-center text-sm font-medium text-primary">
          Offline — reconnect to submit
        </p>
      )}
      {error && <p className="mt-4 text-center text-sm text-rose-600">{error}</p>}

      <div className="mx-auto mt-8 max-w-xl">
        <div className="flex overflow-hidden rounded-full border border-navy/10 bg-[var(--background-warm)] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("upi")}
            className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${
              activeTab === "upi"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-ink hover:bg-white"
            }`}
          >
            UPI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("qr")}
            className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${
              activeTab === "qr"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-ink hover:bg-white"
            }`}
          >
            QR Code
          </button>
        </div>

        {activeTab === "upi" && (
        <form
          noValidate
          onSubmit={submit("upi")}
          className="mt-6 flex flex-col rounded-2xl border border-navy/10 bg-white p-5 shadow-temple sm:p-6"
        >

          <label className="mt-4 block text-sm font-medium text-ink">
            Amount (₹) *
            <input
              ref={upiAmountRef}
              type="number"
              min="1"
              value={upiAmount}
              onChange={(e) => {
                setUpiAmount(e.target.value);
                setError("");
              }}
              placeholder="501"
              className={fieldClass}
            />
          </label>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[var(--background-warm)] px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                UPI ID
              </p>
              <p className="mt-1 select-all truncate font-mono text-sm text-ink">
                {COLONY_BOIS_CONTACT.upiId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyUpiId()}
              aria-label="Copy UPI ID"
              className="flex-none rounded-full px-3 py-1.5 text-sm font-semibold text-primary ring-1 ring-primary/20"
            >
              {copiedUpiId ? "Copied" : "Copy"}
            </button>
          </div>

          <label className="mt-4 block text-sm font-medium text-ink">
            Name *
            <input
              ref={upiNameRef}
              value={upiName}
              onChange={(e) => {
                setUpiName(e.target.value);
                setError("");
              }}
              placeholder="Full name"
              className={fieldClass}
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-ink">
            Email *
            <span className="font-normal text-[var(--text-light)]"> · for receipt</span>
            <input
              ref={upiEmailRef}
              type="email"
              value={upiEmail}
              onChange={(e) => {
                setUpiEmail(e.target.value);
                setError("");
              }}
              placeholder="yourname@example.com"
              className={fieldClass}
            />
          </label>

          {proofField("upi", upiScreenshotPreview, upiProofRef, upiFileRef)}

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={showPublicName}
              onChange={(e) => {
                setShowPublicName(e.target.checked);
                setError("");
              }}
              className="mt-1 h-4 w-4 flex-none accent-[var(--primary)]"
            />
            <span className="text-sm leading-6 text-[var(--text-light)]">
              <span className="font-medium text-ink">Show my name with supporters. *</span> Payment
              details stay private.
            </span>
          </label>

          <button
            type="submit"
            disabled={loadingMethod !== null || !isOnline}
            className="btn-festive mt-5 w-full py-3 disabled:opacity-50"
          >
            {loadingMethod === "upi" ? "Submitting…" : "Submit contribution"}
          </button>
        </form>
        )}

        {activeTab === "qr" && (
        <form
          noValidate
          onSubmit={submit("qr")}
          className="mt-6 flex flex-col rounded-2xl border border-navy/10 bg-white p-5 shadow-temple sm:p-6"
        >

          <label className="mt-4 block text-sm font-medium text-ink">
            Amount (₹) *
            <input
              ref={qrAmountRef}
              type="number"
              min="1"
              value={qrAmount}
              onChange={(e) => {
                setQrAmount(e.target.value);
                setError("");
              }}
              placeholder="501"
              className={fieldClass}
            />
          </label>

          <div className="mt-4 text-center">
            <div className="inline-block rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#d8cbb8]">
              <QRCodeSVG
                value={qrHasValidAmount ? buildUpiLink(qrEnteredAmount) : COLONY_BOIS_CONTACT.upiId}
                size={160}
                bgColor="#ffffff"
                fgColor="#2c1810"
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="section-note mt-2">
              {qrHasValidAmount
                ? `Scan to pay ₹${qrEnteredAmount.toLocaleString("en-IN")}`
                : "Enter an amount, then scan with any UPI app"}
            </p>
          </div>

          <label className="mt-4 block text-sm font-medium text-ink">
            Name *
            <input
              ref={qrNameRef}
              value={qrName}
              onChange={(e) => {
                setQrName(e.target.value);
                setError("");
              }}
              placeholder="Full name"
              className={fieldClass}
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-ink">
            Email *
            <span className="font-normal text-[var(--text-light)]"> · for receipt</span>
            <input
              ref={qrEmailRef}
              type="email"
              value={qrEmail}
              onChange={(e) => {
                setQrEmail(e.target.value);
                setError("");
              }}
              placeholder="yourname@example.com"
              className={fieldClass}
            />
          </label>

          {proofField("qr", qrScreenshotPreview, qrProofRef, qrFileRef)}

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={showPublicName}
              onChange={(e) => {
                setShowPublicName(e.target.checked);
                setError("");
              }}
              className="mt-1 h-4 w-4 flex-none accent-[var(--primary)]"
            />
            <span className="text-sm leading-6 text-[var(--text-light)]">
              <span className="font-medium text-ink">Show my name with supporters. *</span> Payment
              details stay private.
            </span>
          </label>

          <button
            type="submit"
            disabled={loadingMethod !== null || !isOnline}
            className="btn-festive mt-5 w-full py-3 disabled:opacity-50"
          >
            {loadingMethod === "qr" ? "Submitting…" : "Submit contribution"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
