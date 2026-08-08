"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import LogDonationForm from "@/components/member/LogDonationForm";

type TsLike = { toDate?: () => Date } | string | null;
type Donation = {
  id: string; receiptNo?: string; residentName?: string; houseNo?: string;
  amount?: number; paymentMode?: "cash" | "upi"; note?: string | null;
  status?: string; createdAt?: TsLike;
  approvedByName?: string; approvedAt?: TsLike;
};

const dateFmt = (v: TsLike | undefined) => {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v?.toDate?.();
  return d?.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) ?? "—";
};

const STATUS_STYLE: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};
const STATUS_LABEL: Record<string, string> = {
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
};

export default function MemberDashboard() {
  const { uid, name, loading: authLoading } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Donation | null>(null);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      query(collection(db, "donations"), where("collectorId", "==", uid), orderBy("createdAt", "desc")),
      snap => { setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation))); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, [uid]);

  if (authLoading) return <p className="text-slate-600">Loading…</p>;
  if (!uid) return <p className="text-slate-600">Please sign in to access your dashboard.</p>;

  const approved = donations.filter(d => d.status === "approved");
  const pending = donations.filter(d => d.status === "pending_approval");
  const rejected = donations.filter(d => d.status === "rejected");
  const approvedCash = approved.filter(d => d.paymentMode === "cash").reduce((s, d) => s + Number(d.amount || 0), 0);
  const approvedUpi = approved.filter(d => d.paymentMode === "upi").reduce((s, d) => s + Number(d.amount || 0), 0);
  const approvedTotal = approved.reduce((s, d) => s + Number(d.amount || 0), 0);
  const pendingTotal = pending.reduce((s, d) => s + Number(d.amount || 0), 0);
  const rejectedTotal = rejected.reduce((s, d) => s + Number(d.amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-orange-600">My Collection Portal</p>
        <h1 className="mt-1 text-3xl font-black text-slate-900">Hello, {name || "Volunteer"} 👋</h1>
        <p className="mt-1 text-slate-500">Log door-to-door collections and track their approval status.</p>
      </div>

      {/* Summary cards */}
      {!loading && donations.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Approved Total", value: `₹${approvedTotal.toLocaleString()}`, color: "text-emerald-600" },
            { label: "Pending Approval", value: `₹${pendingTotal.toLocaleString()}`, color: "text-amber-600" },
            { label: "Approved Cash", value: `₹${approvedCash.toLocaleString()}`, color: "text-orange-600" },
            { label: "Approved UPI", value: `₹${approvedUpi.toLocaleString()}`, color: "text-emerald-600" },
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
        <div>
          <LogDonationForm collectorId={uid} collectorName={name || "Volunteer"} />
        </div>

        {/* My collection history */}
        <div>
          <h2 className="mb-4 text-lg font-black text-slate-900">My Collections</h2>
          {loading && <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-orange-50" />)}</div>}
          {!loading && donations.length === 0 && (
            <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-8 text-center">
              <p className="text-2xl">📋</p>
              <p className="mt-2 font-bold text-slate-900">No collections yet</p>
              <p className="mt-1 text-sm text-slate-500">Your logged collections will appear here.</p>
            </div>
          )}
          {!loading && donations.length > 0 && (
            <div className="space-y-2">
              {donations.map(d => (
                <div key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-white p-3 shadow-sm hover:border-orange-300 transition cursor-pointer"
                  onClick={() => setReceipt(d)}>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{d.residentName || "Donor"}</p>
                    <p className="text-xs text-slate-400">{dateFmt(d.createdAt)}</p>
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
                  ₹{rejectedTotal.toLocaleString()} was rejected. Please contact your admin.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Receipt modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4" onClick={() => setReceipt(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black uppercase tracking-widest text-orange-600">Collection Receipt</p>
              <button onClick={() => setReceipt(null)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between"><span className="font-semibold">Donor</span><span>{receipt.residentName}</span></div>
              {receipt.houseNo && <div className="flex justify-between"><span className="font-semibold">House</span><span>{receipt.houseNo}</span></div>}
              <div className="flex justify-between"><span className="font-semibold">Amount</span><strong className="text-orange-600">₹{Number(receipt.amount || 0).toLocaleString()}</strong></div>
              <div className="flex justify-between"><span className="font-semibold">Method</span><span>{(receipt.paymentMode ?? "").toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="font-semibold">Collected by</span><span>{name}</span></div>
              <div className="flex justify-between"><span className="font-semibold">Date</span><span>{dateFmt(receipt.createdAt)}</span></div>
              <div className="flex justify-between"><span className="font-semibold">Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[receipt.status ?? "pending_approval"] ?? ""}`}>
                  {STATUS_LABEL[receipt.status ?? "pending_approval"] ?? receipt.status}
                </span>
              </div>
              {receipt.approvedByName && <div className="flex justify-between"><span className="font-semibold">Approved by</span><span>{receipt.approvedByName}</span></div>}
              {receipt.note && <div className="flex justify-between"><span className="font-semibold">Note</span><span className="text-right max-w-[180px]">{receipt.note}</span></div>}
              <div className="flex justify-between border-t border-orange-100 pt-2"><span className="font-semibold">Reference</span><span className="font-mono text-xs">{receipt.receiptNo ?? receipt.id.slice(0, 10)}</span></div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">Colony Bois · Ganesh Chaturthi Chanda</p>
          </div>
        </div>
      )}
    </div>
  );
}
