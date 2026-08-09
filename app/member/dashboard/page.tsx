"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import LogDonationForm from "@/components/member/LogDonationForm";

type TsLike = { toDate?: () => Date } | string | null;
type Donation = {
  id: string; receiptNo?: string; residentName?: string; phone?: string;
  amount?: number; paymentMode?: "cash" | "upi"; note?: string | null;
  paymentVerificationStatus?: "verified" | "pending" | "failed" | "not_applicable";
  paymentTransactionId?: string;
  status?: "pending_approval" | "approved" | "rejected" | "flagged"; createdAt?: TsLike;
  approvedByName?: string; approvedAt?: TsLike;
};

const dateFmt = (v: TsLike | undefined) => {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v?.toDate?.();
  return d?.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) ?? "—";
};
const dateOf = (v: TsLike | undefined) => {
  if (!v) return null;
  return typeof v === "string" ? new Date(v) : v.toDate?.() ?? null;
};

const STATUS_STYLE: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-700",
  approved:         "bg-emerald-100 text-emerald-700",
  rejected:         "bg-rose-100 text-rose-700",
  flagged:          "bg-violet-100 text-violet-700",
};
const STATUS_LABEL: Record<string, string> = {
  pending_approval: "Pending Approval",
  approved:         "Approved ✅",
  rejected:         "Rejected ❌",
  flagged:          "Flagged ⚠️",
};

function ReceiptModal({ d, name, onClose }: { d: Donation; name: string; onClose: () => void }) {
  const receiptText = [
    `🚩 Colony Bois — Ganesh Chaturthi Chanda Receipt`,
    `Donor: ${d.residentName ?? "—"}`,
    `Amount: ₹${Number(d.amount || 0).toLocaleString()}`,
    `Method: ${(d.paymentMode ?? "").toUpperCase()}`,
    d.paymentMode === "upi" ? `Payment: ${d.paymentVerificationStatus === "verified" ? "Verified" : "Verification pending"}` : null,
    d.paymentTransactionId ? `Payment ID: ${d.paymentTransactionId}` : null,
    `Collected by: ${name}`,
    `Status: ${d.status === "approved" ? "✅ Verified" : "⏳ Pending"}`,
    d.approvedByName ? `Approved by: ${d.approvedByName}` : null,
    `Reference: ${d.receiptNo ?? d.id.slice(0, 10)}`,
    `Date: ${dateFmt(d.createdAt)}`,
  ].filter(Boolean).join("\n");

  const waUrl = `https://wa.me/?text=${encodeURIComponent(receiptText)}`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black uppercase tracking-widest text-orange-600">Collection Receipt</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg leading-none">✕</button>
        </div>
        <div className="space-y-2 text-sm text-slate-700">
          {[
            ["Donor", d.residentName],
            d.phone ? ["Phone", d.phone] : null,
            ["Amount", `₹${Number(d.amount || 0).toLocaleString()}`],
            ["Method", (d.paymentMode ?? "").toUpperCase()],
            d.paymentMode === "upi" ? ["Payment", d.paymentVerificationStatus === "verified" ? "Verified ✅" : "Verification Pending"] : null,
            d.paymentTransactionId ? ["Payment ID", d.paymentTransactionId] : null,
            ["Collected by", name],
            ["Date", dateFmt(d.createdAt)],
            ["Status", d.status === "approved" ? "✅ Verified" : d.status === "rejected" ? "❌ Rejected" : "⏳ Pending Approval"],
            d.approvedByName ? ["Approved by", d.approvedByName] : null,
            d.note ? ["Note", d.note] : null,
            ["Reference", d.receiptNo ?? d.id.slice(0, 10)],
          ].filter((r): r is [string, string] => r !== null).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <span className="font-semibold flex-none">{k}</span>
              <span className="text-right">{v}</span>
            </div>
          ))}
        </div>
        <a href={waUrl} target="_blank" rel="noreferrer"
          className="mt-5 flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white hover:bg-emerald-600">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Share via WhatsApp
        </a>
        <p className="mt-3 text-center text-xs text-slate-400">Colony Bois · Ganesh Chaturthi Chanda</p>
      </div>
    </div>
  );
}

export default function MemberDashboard() {
  const { uid, name, loading: authLoading } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [receipt, setReceipt] = useState<Donation | null>(null);
  // Real-time approval notification
  const [justApproved, setJustApproved] = useState<Donation | null>(null);
  const prevStatusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!uid) { setDonations([]); setLoading(false); return; }
    setLoading(true); setLoadError("");
    const unsub = onSnapshot(
      query(collection(db, "donations"), where("collectorId", "==", uid)),
      snap => {
        const next = snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)).sort((a, b) => {
          const at = dateOf(a.createdAt); const bt = dateOf(b.createdAt);
          return (bt?.getTime() ?? 0) - (at?.getTime() ?? 0);
        });

        // Detect any donation that just flipped to 'approved'
        next.forEach(d => {
          const prev = prevStatusRef.current[d.id];
          if (prev === "pending_approval" && d.status === "approved") {
            setJustApproved(d);
          }
        });
        // Update tracked statuses
        prevStatusRef.current = Object.fromEntries(next.map(d => [d.id, d.status ?? ""]));

        setDonations(next);
        setLoading(false);
      },
      () => { setLoadError("Unable to load your collection records. Please try again."); setLoading(false); }
    );
    return unsub;
  }, [uid, reloadKey]);

  if (authLoading) return <p className="text-slate-600">Loading…</p>;
  if (!uid) return <p className="text-slate-600">Please sign in to access your dashboard.</p>;

  const approved  = donations.filter(d => d.status === "approved");
  const pending   = donations.filter(d => d.status === "pending_approval");
  const rejected  = donations.filter(d => d.status === "rejected");
  const approvedCash  = approved.filter(d => d.paymentMode === "cash").reduce((s, d) => s + Number(d.amount || 0), 0);
  const approvedUpi   = approved.filter(d => d.paymentMode === "upi").reduce((s, d) => s + Number(d.amount || 0), 0);
  const approvedTotal = approved.reduce((s, d) => s + Number(d.amount || 0), 0);
  const pendingTotal  = pending.reduce((s, d) => s + Number(d.amount || 0), 0);
  const rejectedTotal = rejected.reduce((s, d) => s + Number(d.amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Real-time approval success banner */}
      {justApproved && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/70 p-4">
          <div className="w-full max-w-sm rounded-3xl border-2 border-emerald-400 bg-white p-8 text-center shadow-2xl">
            <p className="text-5xl">🚩</p>
            <h2 className="mt-4 text-2xl font-black text-slate-900">Payment Approved!</h2>
            <p className="mt-2 text-slate-600">Your collection has been verified by the admin.</p>
            <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-left text-sm space-y-1">
              <p><span className="font-semibold">Donor:</span> {justApproved.residentName}</p>
              <p><span className="font-semibold">Amount:</span> <strong className="text-emerald-700">₹{Number(justApproved.amount || 0).toLocaleString()}</strong></p>
              <p><span className="font-semibold">Reference:</span> <span className="font-mono text-xs">{justApproved.receiptNo ?? justApproved.id.slice(0, 10)}</span></p>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🚩 Colony Bois Chanda Approved!\nDonor: ${justApproved.residentName}\nAmount: ₹${Number(justApproved.amount || 0).toLocaleString()}\nVerified ✅\nRef: ${justApproved.receiptNo ?? justApproved.id.slice(0, 10)}`)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Share Receipt via WhatsApp
              </a>
              <button onClick={() => setJustApproved(null)}
                className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-orange-600">My Collection Portal</p>
        <h1 className="mt-1 text-3xl font-black text-slate-900">Hello, {name || "Volunteer"} 👋</h1>
        <p className="mt-1 text-slate-500">Log door-to-door collections and track their approval status.</p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Approved Total",    value: `₹${approvedTotal.toLocaleString()}`, color: "text-emerald-600" },
            { label: "Pending Approval",  value: `₹${pendingTotal.toLocaleString()}`,  color: "text-amber-600"  },
            { label: "Approved Cash",     value: `₹${approvedCash.toLocaleString()}`,  color: "text-orange-600" },
            { label: "Approved UPI",      value: `₹${approvedUpi.toLocaleString()}`,   color: "text-emerald-600"},
          ].map(c => (
            <div key={c.label} className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
              <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
              <p className="mt-1 text-sm text-slate-500">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        {/* Log new collection */}
        <div><LogDonationForm collectorId={uid} collectorName={name || "Volunteer"} /></div>

        {/* Collection history */}
        <div>
          <h2 className="mb-4 text-lg font-black text-slate-900">My Collections</h2>
          {loading && (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-orange-50" />)}</div>
          )}
          {!loading && loadError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
              <p className="font-bold text-rose-700">{loadError}</p>
              <button onClick={() => setReloadKey(value => value + 1)} className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white">Reload records</button>
            </div>
          )}
          {!loading && !loadError && donations.length === 0 && (
            <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-8 text-center">
              <p className="text-2xl">📋</p>
              <p className="mt-2 font-bold text-slate-900">No collection records yet</p>
              <p className="mt-1 text-sm text-slate-500">Your logged collections will appear here.</p>
            </div>
          )}
          {!loading && !loadError && donations.length > 0 && (
            <div className="space-y-2">
              {donations.map(d => (
                <div key={d.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-orange-100 bg-white p-3 shadow-sm hover:border-orange-300 transition"
                  onClick={() => setReceipt(d)}>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{d.residentName || "Donor"}</p>
                    <p className="text-xs text-slate-400">{dateFmt(d.createdAt)}</p>
                    <p className="text-xs font-semibold text-slate-500">{(d.paymentMode ?? "cash").toUpperCase()} · Ref: {d.paymentTransactionId ?? d.receiptNo ?? d.id.slice(0, 10)}</p>
                    {d.paymentMode === "upi" && <p className={`text-xs font-semibold ${d.paymentVerificationStatus === "verified" ? "text-emerald-700" : "text-amber-700"}`}>{d.paymentVerificationStatus === "verified" ? "UPI · Payment Verified" : "UPI · Payment Verification Pending"}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-none">
                    <p className="font-black text-orange-600">₹{Number(d.amount || 0).toLocaleString()}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[d.status ?? "pending_approval"] ?? "bg-slate-100 text-slate-500"}`}>
                      {STATUS_LABEL[d.status ?? "pending_approval"] ?? d.status}
                    </span>
                  </div>
                </div>
              ))}
              {rejectedTotal > 0 && (
                <p className="mt-2 rounded-xl bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">
                  ₹{rejectedTotal.toLocaleString()} was rejected — please contact your admin.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Receipt modal */}
      {receipt && <ReceiptModal d={receipt} name={name || "Volunteer"} onClose={() => setReceipt(null)} />}
    </div>
  );
}
