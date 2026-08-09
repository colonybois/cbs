"use client";

import { useState, type FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { db } from "@/lib/firebase";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";

type Props = { collectorId: string; collectorName: string };
type Receipt = { receiptNo: string; residentName: string; amount: number; paymentMode: "cash" | "upi"; houseNo: string; paymentVerified?: boolean };

const genRef = () => `COL-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

export default function LogDonationForm({ collectorId, collectorName }: Props) {
  const [residentName, setResidentName] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi">("cash");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const [showQr, setShowQr] = useState(false);

  const upiValue = `upi://pay?pa=${COLONY_BOIS_CONTACT.upiId}&pn=${encodeURIComponent("Colony Bois Rampuram")}&am=${amount || "0"}&cu=INR&tn=${encodeURIComponent(`Chanda from ${residentName || "Donor"} | ref:${collectorId.slice(-6)}`)}`;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!residentName.trim()) { setError("Enter donor name."); return; }
    if (!amount || Number(amount) <= 0) { setError("Enter a valid amount."); return; }
    setLoading(true); setError("");
    try {
      const value = Number(amount);
      const receiptNo = genRef();
      await addDoc(collection(db, "donations"), {
        receiptNo,
        residentName: residentName.trim(),
        houseNo: houseNo.trim(),
        paymentMode,
        amount: value,
        note: note.trim() || null,
        collectorId,
        collectorName,
        status: "pending_approval",
        paymentVerificationStatus: paymentMode === "cash" ? "not_applicable" : "pending",
        createdAt: serverTimestamp(),
      });
      setLastReceipt({ receiptNo, residentName: residentName.trim(), amount: value, paymentMode, houseNo: houseNo.trim() });
      setResidentName(""); setHouseNo(""); setAmount(""); setNote(""); setShowQr(false);
    } catch (err) {
      setError(err instanceof Error ? `Failed: ${err.message}` : "Failed to log collection. Try again.");
    } finally { setLoading(false); }
  };

  if (lastReceipt) {
    return (
      <div className="rounded-2xl border-2 border-orange-400 bg-orange-50 p-6 text-center space-y-3">
        <span className="text-4xl">✅</span>
        <h3 className="text-lg font-black text-slate-900">Collection Submitted!</h3>
        <p className="text-sm text-orange-700 font-semibold">Waiting for Admin Approval</p>

        {/* Digital receipt */}
        <div className="mx-auto mt-3 max-w-xs rounded-xl border border-orange-200 bg-white p-4 text-left text-sm">
          <p className="text-xs font-black uppercase tracking-widest text-orange-600 mb-2">Collection Receipt</p>
          <div className="space-y-1 text-slate-700">
            <p><span className="font-semibold">Donor:</span> {lastReceipt.residentName}</p>
            {lastReceipt.houseNo && <p><span className="font-semibold">House:</span> {lastReceipt.houseNo}</p>}
            <p><span className="font-semibold">Amount:</span> <strong className="text-orange-600">₹{lastReceipt.amount.toLocaleString()}</strong></p>
            <p><span className="font-semibold">Method:</span> {lastReceipt.paymentMode.toUpperCase()}</p>
            <p><span className="font-semibold">Collected by:</span> {collectorName}</p>
            <p><span className="font-semibold">Status:</span> <span className="text-amber-600 font-bold">Pending Approval</span></p>
            <p><span className="font-semibold">Reference:</span> <span className="font-mono text-xs">{lastReceipt.receiptNo}</span></p>
          </div>
        </div>

        <button onClick={() => setLastReceipt(null)}
          className="mt-2 w-full rounded-xl bg-orange-500 py-3 font-bold text-white hover:bg-orange-600 text-sm">
          Log Another Collection
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-black text-slate-900">📋 Record Chanda Collection</h2>

      <form onSubmit={submit} className="space-y-4">
        {/* Donor name */}
        <label className="block text-sm font-semibold text-slate-700">
          Donor / Resident Name *
          <input required value={residentName} onChange={e => setResidentName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </label>

        {/* House + Amount */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-slate-700">
            House / Flat No.
            <input value={houseNo} onChange={e => setHouseNo(e.target.value)} placeholder="H.No 4-12"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Amount (₹) *
            <input required min="1" type="number" value={amount}
              onChange={e => { setAmount(e.target.value); setShowQr(false); }}
              placeholder="e.g. 501"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </label>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Payment Method *</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setPaymentMode("cash"); setShowQr(false); }}
              className={`rounded-xl border-2 py-3 text-base font-bold transition ${paymentMode === "cash" ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
              💵 Cash
            </button>
            <button type="button" onClick={() => setPaymentMode("upi")}
              className={`rounded-xl border-2 py-3 text-base font-bold transition ${paymentMode === "upi" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
              📲 UPI / QR
            </button>
          </div>
        </div>

        {/* A QR code alone cannot prove payment. UPI submissions are kept
            pending until an administrator verifies the payment. */}
        {paymentMode === "upi" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Scan QR / pay via UPI</p>
            {Number(amount) > 0 ? (
              <>
                <div className="flex flex-col items-center">
                  <div className="inline-block rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
                    <QRCodeSVG value={upiValue} size={180} bgColor="#ffffff" fgColor="#1e1b4b" level="H" includeMargin={false} />
                  </div>
                  <p className="mt-2 text-xl font-black text-slate-900">₹{Number(amount).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">For {residentName || "Donor"}</p>
                  <p className="mt-1 text-xs text-slate-400">UPI: <span className="font-semibold">{COLONY_BOIS_CONTACT.upiId}</span></p>
                </div>
                <a href={upiValue}
                  className="block w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700">
                  Open UPI App →
                </a>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left text-sm text-amber-800">
                  <p className="font-bold">🟡 Waiting for payment</p>
                  <p className="mt-1">After payment, submit the collection for administrator verification. A submitted record is not treated as a successful payment.</p>
                </div>
              </>
            ) : (
              <p className="py-4 text-sm font-medium text-emerald-700">⚠ Enter amount above to show QR</p>
            )}
          </div>
        )}

        {paymentMode === "cash" && (
          <label className="block text-sm font-semibold text-slate-700">
            Receipt / Collection Note <span className="font-normal text-slate-400">(optional)</span>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Any receipt reference or note"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </label>
        )}

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

        <>
          <button type="submit" disabled={loading}
            className={`w-full rounded-xl py-4 text-base font-black text-white shadow-md disabled:opacity-50 transition ${paymentMode === "cash" ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-600 hover:bg-emerald-700"}`}>
            {loading ? "Submitting…" : paymentMode === "cash" ? "Submit Collection →" : "Submit UPI Payment for Verification →"}
          </button>
          <p className="text-center text-xs text-slate-400">{paymentMode === "cash" ? "Cash collection will be sent for admin approval." : "UPI payment will remain pending until an administrator verifies it."}</p>
        </>
      </form>
    </div>
  );
}
