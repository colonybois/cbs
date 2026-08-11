"use client";

import { useRef, useState, type FormEvent, type RefObject } from "react";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { db } from "@/lib/firebase";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

type Props = { collectorId: string; collectorName: string };
type Receipt = {
  receiptNo: string;
  residentName: string;
  phone: string;
  amount: number;
  paymentMode: "cash" | "upi";
};

const genRef = () => `COL-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

export default function LogDonationForm({ collectorId, collectorName }: Props) {
  const isOnline = useNetworkStatus();
  const [residentName, setResidentName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi">("cash");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const upiValue = `upi://pay?pa=${COLONY_BOIS_CONTACT.upiId}&pn=${encodeURIComponent("Colony Bois Rampuram")}&am=${amount || "0"}&cu=INR&tn=${encodeURIComponent(`Chanda from ${residentName || "Donor"} | ref:${collectorId.slice(-6)}`)}`;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isOnline) {
      setError("Offline — reconnect to submit this collection.");
      return;
    }
    const warnAndFocus = (message: string, input: RefObject<HTMLInputElement | null>) => {
      setError(message);
      input.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => input.current?.focus(), 250);
    };
    if (!residentName.trim()) {
      warnAndFocus("Please enter the donor or resident name before submitting.", nameInputRef);
      return;
    }
    if (phone.length !== 10) {
      warnAndFocus(
        "Please enter a valid 10-digit donor phone number before submitting.",
        phoneInputRef,
      );
      return;
    }
    if (!amount || Number(amount) <= 0) {
      warnAndFocus("Please enter the Chanda amount before submitting.", amountInputRef);
      return;
    }
    if (
      !window.confirm(
        `Submit this ${paymentMode.toUpperCase()} collection of ₹${Number(amount).toLocaleString("en-IN")}?`,
      )
    )
      return;
    setLoading(true);
    setError("");
    try {
      const value = Number(amount);
      const receiptNo = genRef();
      const isUpi = paymentMode === "upi";
      const donationRef = doc(collection(db, "donations"));
      const batch = writeBatch(db);
      batch.set(donationRef, {
        receiptNo,
        residentName: residentName.trim(),
        donorName: residentName.trim(),
        collectionSource: "volunteer_assisted",
        phone,
        paymentMode,
        amount: value,
        note: note.trim() || null,
        collectorId,
        collectorName,
        // UPI collections are accepted immediately; cash stays in the admin
        // queue until the physical handover is reviewed.
        status: isUpi ? "approved" : "pending_approval",
        paymentVerificationStatus: isUpi ? "verified" : "not_applicable",
        ...(isUpi ? { approvedByName: "System (UPI)", approvedAt: serverTimestamp() } : {}),
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      setLastReceipt({
        receiptNo,
        residentName: residentName.trim(),
        phone,
        amount: value,
        paymentMode,
      });
      setResidentName("");
      setPhone("");
      setAmount("");
      setNote("");
    } catch (err) {
      setError(
        err instanceof Error ? `Failed: ${err.message}` : "Failed to log collection. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (lastReceipt) {
    return (
      <div className="rounded-2xl border-2 border-orange-400 bg-orange-50 p-6 text-center space-y-3">
        <span className="text-4xl">✅</span>
        <h3 className="text-lg font-black text-slate-900">Collection Submitted!</h3>
        <p
          className={`text-sm font-semibold ${lastReceipt.paymentMode === "upi" ? "text-emerald-700" : "text-orange-700"}`}
        >
          {lastReceipt.paymentMode === "upi"
            ? "UPI Collection Approved"
            : "Waiting for Admin Approval"}
        </p>
        <div className="mx-auto mt-3 max-w-xs rounded-xl border border-orange-200 bg-white p-4 text-left text-sm">
          <p className="text-xs font-black uppercase tracking-widest text-orange-600 mb-2">
            Collection Receipt
          </p>
          <div className="space-y-1 text-slate-700">
            <p>
              <span className="font-semibold">Donor:</span> {lastReceipt.residentName}
            </p>
            <p>
              <span className="font-semibold">Phone:</span> {lastReceipt.phone}
            </p>
            <p>
              <span className="font-semibold">Amount:</span>{" "}
              <strong className="text-orange-600">₹{lastReceipt.amount.toLocaleString()}</strong>
            </p>
            <p>
              <span className="font-semibold">Method:</span> {lastReceipt.paymentMode.toUpperCase()}
            </p>
            <p>
              <span className="font-semibold">Collected by:</span> {collectorName}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              <span
                className={`font-bold ${lastReceipt.paymentMode === "upi" ? "text-emerald-600" : "text-amber-600"}`}
              >
                {lastReceipt.paymentMode === "upi" ? "Approved" : "Pending Approval"}
              </span>
            </p>
            <p>
              <span className="font-semibold">Reference:</span>{" "}
              <span className="font-mono text-xs">{lastReceipt.receiptNo}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setLastReceipt(null)}
          className="mt-2 w-full rounded-xl bg-orange-500 py-3 font-bold text-white hover:bg-orange-600 text-sm"
        >
          Log Another Collection
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-black text-slate-900">📋 Record Chanda Collection</h2>
      <form noValidate onSubmit={submit} className="space-y-4">
        {/* Donor name */}
        <label className="block text-sm font-semibold text-slate-700">
          Donor / Resident Name *
          <input
            ref={nameInputRef}
            value={residentName}
            onChange={(e) => {
              setResidentName(e.target.value);
              setError("");
            }}
            placeholder="e.g. Ramesh Kumar"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </label>

        {/* Phone */}
        <label className="block text-sm font-semibold text-slate-700">
          Donor / Resident Phone Number *
          <input
            ref={phoneInputRef}
            required
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            placeholder="10-digit mobile number"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Amount (₹) *
          <input
            ref={amountInputRef}
            min="1"
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            placeholder="e.g. 501"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </label>

        {/* Payment method */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Payment Method *</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMode("cash")}
              className={`rounded-xl border-2 py-3 text-base font-bold transition ${paymentMode === "cash" ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}
            >
              💵 Cash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode("upi")}
              className={`rounded-xl border-2 py-3 text-base font-bold transition ${paymentMode === "upi" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}
            >
              📲 UPI / QR
            </button>
          </div>
        </div>

        {/* UPI QR panel */}
        {paymentMode === "upi" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Scan QR / pay via UPI
            </p>
            {Number(amount) > 0 ? (
              <>
                <div className="flex flex-col items-center">
                  {isOnline ? (
                    <div className="inline-block rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
                      <QRCodeSVG
                        value={upiValue}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#1e1b4b"
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  ) : (
                    <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                      Offline — Reconnect to generate the UPI QR
                    </p>
                  )}
                  <p className="mt-2 text-xl font-black text-slate-900">
                    ₹{Number(amount).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">For {residentName || "Donor"}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    UPI: <span className="font-semibold">{COLONY_BOIS_CONTACT.upiId}</span>
                  </p>
                </div>
                {isOnline ? (
                  <a
                    href={upiValue}
                    className="block w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    Open UPI App →
                  </a>
                ) : (
                  <span className="block w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-bold text-white opacity-50">
                    Open UPI App →
                  </span>
                )}
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left text-sm text-amber-800">
                  <p className="font-bold">🟡 Waiting for payment</p>
                  <p className="mt-1">
                    After payment, submit the collection. UPI collections are approved immediately.
                  </p>
                </div>
              </>
            ) : (
              <p className="py-4 text-sm font-medium text-emerald-700">
                ⚠ Enter amount above to show QR
              </p>
            )}
          </div>
        )}

        {/* Note (cash only) */}
        {paymentMode === "cash" && (
          <label className="block text-sm font-semibold text-slate-700">
            Receipt / Collection Note <span className="font-normal text-slate-400">(optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any receipt reference or note"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </label>
        )}

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}
        {!isOnline && (
          <p className="rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-800">
            Offline — Reconnect to submit
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !isOnline}
          className={`w-full rounded-xl py-4 text-base font-black text-white shadow-md disabled:opacity-50 transition ${paymentMode === "cash" ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
        >
          {loading
            ? "Submitting…"
            : paymentMode === "cash"
              ? "Submit Collection →"
              : "Submit UPI Payment for Verification →"}
        </button>
        <p className="text-center text-xs text-slate-400">
          {paymentMode === "cash"
            ? "Cash collection will be sent for admin approval."
            : "UPI collections are approved immediately."}
          No email is sent for member-recorded collections.
        </p>
      </form>
    </div>
  );
}
