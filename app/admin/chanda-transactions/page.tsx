"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import Card from "@/components/ui/Card";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import { db } from "@/lib/firebase";
import { recordAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth-context";

type TimestampLike = { toDate?: () => Date } | string | null;
type Transaction = { id: string; residentName?: string; phone?: string; amount?: number; transactionId?: string | null; message?: string | null; paymentMethod?: string; screenshotUrl?: string | null; status?: "pending" | "approved" | "rejected"; createdAt?: TimestampLike; verifiedAt?: TimestampLike; verifiedBy?: string };
type Filter = "all" | "approved" | "pending" | "rejected";

const dateOf = (value: TimestampLike | undefined) => value && typeof value !== "string" ? value.toDate?.() : value ? new Date(value) : null;
const displayDate = (value: TimestampLike | undefined) => dateOf(value)?.toLocaleString() || "Not available";
const statusLabel = (status: Transaction["status"]) => status === "approved" ? "Successful" : status === "rejected" ? "Failed" : "Pending";

export default function ChandaTransactionsPage() {
  const { uid, name } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => onSnapshot(collection(db, "online_donations"), snapshot => setTransactions(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Transaction))), () => setError("Unable to load Chanda transactions.")), []);

  const filtered = useMemo(() => transactions.filter(transaction => {
    if (filter !== "all" && transaction.status !== filter) return false;
    const date = dateOf(transaction.createdAt);
    if (from && (!date || date < new Date(`${from}T00:00:00`))) return false;
    if (to && (!date || date > new Date(`${to}T23:59:59`))) return false;
    return true;
  }), [transactions, filter, from, to]);
  const approved = transactions.filter(item => item.status === "approved");
  const summary = [[`₹${approved.reduce((total, item) => total + Number(item.amount || 0), 0).toLocaleString()}`, "Total Chanda Collected"], [String(transactions.length), "Transactions"], [String(approved.length), "Successful Payments"], [String(transactions.filter(item => item.status === "pending").length), "Pending Payments"], [String(transactions.filter(item => item.status === "rejected").length), "Failed Payments"]];

  const review = async (transaction: Transaction, status: "approved" | "rejected") => {
    if (!uid || !name) return;
    setUpdatingId(transaction.id); setError("");
    try {
      await updateDoc(doc(db, "online_donations", transaction.id), { status, verifiedBy: uid, verifiedByName: name, verifiedAt: new Date().toISOString() });
      await recordAudit({ actorId: uid, actorName: name, action: status === "approved" ? "Approved Chanda transaction" : "Rejected Chanda transaction", module: "Chanda Transactions", targetId: transaction.id, previousValue: { status: transaction.status || "pending" }, newValue: { status }, approvalStatus: status });
    } catch { setError("Could not update the transaction. Please try again."); }
    finally { setUpdatingId(""); }
  };

  return <div className="space-y-7"><WelcomeBanner title="Chanda Transactions" text="Only verified transactions are counted as collected. A UPI app launch is not payment confirmation." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{summary.map(([value, label]) => <Card className="bg-white p-5" key={label}><p className="text-2xl font-black text-orange-600">{value}</p><p className="mt-2 text-sm text-slate-600">{label}</p></Card>)}</div>
    <Card className="p-5"><div className="flex flex-wrap gap-3"><select value={filter} onChange={event => setFilter(event.target.value as Filter)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="all">All</option><option value="approved">Successful</option><option value="pending">Pending</option><option value="rejected">Failed</option></select><label className="text-sm text-slate-600">From <input type="date" value={from} onChange={event => setFrom(event.target.value)} className="ml-1 rounded-lg border border-slate-300 px-2 py-2" /></label><label className="text-sm text-slate-600">To <input type="date" value={to} onChange={event => setTo(event.target.value)} className="ml-1 rounded-lg border border-slate-300 px-2 py-2" /></label></div></Card>
    {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
    <Card className="overflow-x-auto"><table className="min-w-[1100px] w-full text-left text-sm"><thead className="border-b border-orange-100 bg-orange-50 text-slate-700"><tr>{["Screenshot", "Donor", "Amount", "UPI reference", "Date & time", "Method", "Status", "Details", "Review"].map(label => <th className="px-4 py-3 font-bold" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-orange-100">{filtered.map(item => <tr key={item.id} className="align-top"><td className="px-4 py-4">{item.screenshotUrl ? <button onClick={() => setLightbox(item.screenshotUrl!)} className="group relative overflow-hidden rounded-lg border border-orange-200 bg-orange-50 hover:border-orange-400 transition"><img src={item.screenshotUrl} alt="Payment proof" className="h-12 w-16 object-cover"/><span className="absolute inset-0 hidden items-center justify-center bg-slate-900/40 text-xs font-bold text-white group-hover:flex">View</span></button> : <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">No screenshot</span>}</td><td className="px-4 py-4 font-semibold text-slate-900">{item.residentName || "Unknown donor"}<br/><span className="font-normal text-slate-500">{item.phone || "No phone"}</span></td><td className="px-4 py-4 font-bold text-orange-700">₹{Number(item.amount || 0).toLocaleString()}</td><td className="px-4 py-4 text-slate-600">{item.transactionId || "Not provided"}</td><td className="px-4 py-4 text-slate-600">{displayDate(item.createdAt)}</td><td className="px-4 py-4 text-slate-600">{item.paymentMethod?.toUpperCase() || "UPI"}</td><td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "approved" ? "bg-emerald-50 text-emerald-700" : item.status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{statusLabel(item.status)}</span><p className="mt-1 text-xs text-slate-500">{item.verifiedAt ? `Reviewed ${displayDate(item.verifiedAt)}` : "Awaiting verification"}</p></td><td className="max-w-48 px-4 py-4 text-slate-600">{item.message || "—"}</td><td className="px-4 py-4">{item.status === "pending" ? <div className="flex gap-2"><button disabled={updatingId === item.id} onClick={() => void review(item, "approved")} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Verify</button><button disabled={updatingId === item.id} onClick={() => void review(item, "rejected")} className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-600 disabled:opacity-50">Reject</button></div> : <span className="text-xs text-slate-500">{item.verifiedBy || "Reviewed"}</span>}</td></tr>)}{filtered.length === 0 && <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={9}>No transactions match these filters.</td></tr>}</tbody></table></Card>
    {lightbox && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-4" onClick={() => setLightbox(null)}><button onClick={() => setLightbox(null)} className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 font-bold hover:bg-orange-50">✕</button><img src={lightbox} alt="Payment screenshot" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" onClick={e => e.stopPropagation()}/></div>}
  </div>;
}
