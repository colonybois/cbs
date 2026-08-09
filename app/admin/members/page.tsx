"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, runTransaction, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { recordAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth-context";
import Modal from "@/components/ui/Modal";
import TableExportButtons from "@/components/ui/TableExportButtons";

type TsLike = { toDate?: () => Date } | string | null;
interface Member { id: string; name: string; phone: string; upiTotal: number; cashTotal: number; pendingHandover: number; }
interface Donation {
  id: string; receiptNo?: string; residentName?: string; phone?: string;
  amount?: number; paymentMode?: "cash" | "upi"; note?: string | null;
  collectorId?: string;
  status?: "pending_approval" | "approved" | "rejected" | "flagged"; createdAt?: TsLike;
  paymentTransactionId?: string;
  approvedByName?: string;
}

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
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export default function MembersManagementPage() {
  const { uid, name: adminName } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Member | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [handingOver, setHandingOver] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending_approval" | "approved" | "rejected" | "flagged">("all");
  const [methodFilter, setMethodFilter] = useState<"all" | "cash" | "upi">("all");
  const [donationSearch, setDonationSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7d" | "30d" | "custom">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => onSnapshot(
    query(collection(db, "users"), where("role", "==", "member")),
    snap => {
      setMembers(snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, name: data.name || "Unknown", phone: data.phone || "", upiTotal: Number(data.upiTotal || 0), cashTotal: Number(data.cashTotal || 0), pendingHandover: Number(data.pendingHandover || 0) };
      }));
      setLoading(false);
    },
    () => { setMembers([]); setLoading(false); }
  ), []);

  // Keep the summary table accurate even for collections approved before the
  // per-member aggregate fields were introduced or repaired.
  useEffect(() => onSnapshot(
    collection(db, "donations"),
    snap => setAllDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation))),
    () => setAllDonations([]),
  ), []);

  const memberRows = members.map(member => {
    const approved = allDonations.filter(d => d.collectorId === member.id && d.status === "approved");
    const cashTotal = approved.filter(d => d.paymentMode === "cash").reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const upiTotal = approved.filter(d => d.paymentMode === "upi").reduce((sum, d) => sum + Number(d.amount || 0), 0);
    return { ...member, cashTotal, upiTotal };
  });

  useEffect(() => {
    if (!selected) { setDonations([]); setHistoryError(""); return; }
    setHistoryLoading(true); setHistoryError("");
    return onSnapshot(
      query(collection(db, "donations"), where("collectorId", "==", selected.id)),
      snap => { setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)).sort((a, b) => (dateOf(b.createdAt)?.getTime() ?? 0) - (dateOf(a.createdAt)?.getTime() ?? 0))); setHistoryLoading(false); },
      () => { setDonations([]); setHistoryError("Unable to load this member's transaction history."); setHistoryLoading(false); }
    );
  }, [selected]);

  const confirmHandover = async () => {
    if (!selected || selected.pendingHandover <= 0 || !uid || !adminName) return;
    setHandingOver(true);
    try {
      const userRef = doc(db, "users", selected.id);
      const handoverRef = doc(collection(db, "handovers"));
      const amount = selected.pendingHandover;
      await runTransaction(db, async tx => {
        const profile = await tx.get(userRef);
        const pending = Number(profile.data()?.pendingHandover || 0);
        if (pending <= 0) return;
        tx.update(userRef, { pendingHandover: 0 });
        tx.set(handoverRef, {
          collectorId: selected.id,
          collectorName: selected.name,
          amount: pending,
          confirmedBy: uid,
          confirmedByName: adminName,
          confirmedAt: new Date().toISOString(),
        });
      });
      await recordAudit({
        actorId: uid, actorName: adminName, action: "Cash handover confirmed",
        module: "Members", targetId: selected.id,
        newValue: { volunteer: selected.name, amount: `₹${amount}`, confirmedBy: adminName },
      });
      setSelected(cur => cur ? { ...cur, pendingHandover: 0 } : null);
    } finally { setHandingOver(false); }
  };

  const filteredDonations = donations.filter(d => {
    if (methodFilter !== "all" && d.paymentMode !== methodFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    const search = donationSearch.toLowerCase();
    if (search && !d.residentName?.toLowerCase().includes(search) && !d.receiptNo?.toLowerCase().includes(search) && !d.id.toLowerCase().includes(search)) return false;
    const date = dateOf(d.createdAt);
    const now = new Date();
    if (dateFilter === "today" && (!date || date < new Date(now.getFullYear(), now.getMonth(), now.getDate()))) return false;
    if (dateFilter === "7d" && (!date || date < new Date(now.getTime() - 7 * 86400000))) return false;
    if (dateFilter === "30d" && (!date || date < new Date(now.getTime() - 30 * 86400000))) return false;
    if (dateFilter === "custom" && ((fromDate && (!date || date < new Date(`${fromDate}T00:00:00`))) || (toDate && (!date || date > new Date(`${toDate}T23:59:59`))))) return false;
    return true;
  });

  // Ledger calculations for selected member
  const approvedD = donations.filter(d => d.status === "approved");
  const sum = (arr: Donation[]) => arr.reduce((s, d) => s + Number(d.amount || 0), 0);
  const approvedCash = approvedD.filter(d => d.paymentMode === "cash");
  const filteredApproved = filteredDonations.filter(d => d.status === "approved");
  const filteredPending = filteredDonations.filter(d => d.status === "pending_approval");
  const filteredRejected = filteredDonations.filter(d => d.status === "rejected");
  const outstanding = selected ? (selected.pendingHandover) : 0;

  const total = (m: Member) => m.upiTotal + m.cashTotal;
  const exportHeaders = ["Collector", "Phone", "UPI / QR", "Cash", "Total", "Pending Cash"];
  const exportRows = memberRows.map(m => [m.name, m.phone, `₹${m.upiTotal.toLocaleString()}`, `₹${m.cashTotal.toLocaleString()}`, `₹${total(m).toLocaleString()}`, `₹${m.pendingHandover.toLocaleString()}`]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Members Management</h1>
        <p className="mt-1 text-sm text-slate-500">Click a collector to view their ledger, transaction history, and manage cash handovers.</p>
        <TableExportButtons className="mt-3" title="Member Management" headers={exportHeaders} rows={exportRows} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-orange-100 bg-orange-50/50 text-xs font-bold uppercase tracking-wider text-slate-600">
              <tr>
                {["Collector", "UPI / QR", "Cash", "Total", "Pending Cash"].map(h => (
                  <th key={h} className="px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading…</td></tr>
              ) : memberRows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No registered collectors.</td></tr>
              ) : memberRows.map(m => (
                <tr key={m.id} onClick={() => setSelected(m)}
                  className="cursor-pointer hover:bg-orange-50/60 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">{m.name}<span className="block text-xs font-normal text-slate-500">{m.phone}</span></td>
                  <td className="px-6 py-4 font-semibold text-emerald-600">₹{m.upiTotal.toLocaleString()}</td>
                  <td className="px-6 py-4 font-semibold text-orange-600">₹{m.cashTotal.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black text-slate-900">₹{total(m).toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-rose-600">₹{m.pendingHandover.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.name} — Ledger` : ""}>
        {selected && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Collection summary */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-orange-600 mb-2">Collection Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-emerald-50 p-3"><p className="text-emerald-700 text-xs">Approved Total</p><b className="text-lg">₹{sum(filteredApproved).toLocaleString()}</b></div>
                <div className="rounded-xl bg-amber-50 p-3"><p className="text-amber-700 text-xs">Pending Approval</p><b className="text-lg">₹{sum(filteredPending).toLocaleString()}</b></div>
                <div className="rounded-xl bg-orange-50 p-3"><p className="text-orange-700 text-xs">Approved Cash</p><b>₹{sum(filteredApproved.filter(d => d.paymentMode === "cash")).toLocaleString()}</b></div>
                <div className="rounded-xl bg-emerald-50 p-3"><p className="text-emerald-700 text-xs">Approved UPI</p><b>₹{sum(filteredApproved.filter(d => d.paymentMode === "upi")).toLocaleString()}</b></div>
                {filteredRejected.length > 0 && <div className="rounded-xl bg-rose-50 p-3"><p className="text-rose-700 text-xs">Rejected</p><b>₹{sum(filteredRejected).toLocaleString()}</b></div>}
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-600 text-xs">Total Transactions</p><b>{filteredDonations.length}</b></div>
              </div>
            </div>

            {/* Cash accountability */}
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-orange-600 mb-2">Cash Accountability</p>
              <div className="flex justify-between"><span>Cash Collected (approved)</span><b>₹{sum(approvedCash).toLocaleString()}</b></div>
              <div className="flex justify-between"><span>Cash Handed Over</span><b>₹{(sum(approvedCash) - outstanding).toLocaleString()}</b></div>
              <div className="flex justify-between text-amber-700"><span>Cash Pending Handover</span><b>₹{outstanding.toLocaleString()}</b></div>
              {outstanding > 0 && (
                <div className="flex justify-between text-rose-700 border-t border-orange-200 pt-1 font-bold">
                  <span>Outstanding</span><span>₹{outstanding.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Handover button */}
            {outstanding > 0 && (
              <button disabled={handingOver} onClick={() => void confirmHandover()}
                className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50">
                {handingOver ? "Confirming…" : `Confirm Cash Handover ₹${outstanding.toLocaleString()}`}
              </button>
            )}

            {/* Transaction history */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-orange-600 mb-2">Transaction History</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <input value={donationSearch} onChange={e => setDonationSearch(e.target.value)} placeholder="Search donor or reference…"
                  className="flex-1 min-w-32 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                  <option value="all">All statuses</option>
                  <option value="pending_approval">Pending approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="flagged">Flagged</option>
                </select>
                <select value={methodFilter} onChange={e => setMethodFilter(e.target.value as typeof methodFilter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                  <option value="all">All methods</option><option value="cash">Cash</option><option value="upi">UPI</option>
                </select>
                <select value={dateFilter} onChange={e => setDateFilter(e.target.value as typeof dateFilter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                  <option value="all">All dates</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="custom">Custom range</option>
                </select>
                {dateFilter === "custom" && <><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="rounded-xl border border-slate-200 px-2 py-2 text-xs"/><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="rounded-xl border border-slate-200 px-2 py-2 text-xs"/></>}
                <button type="button" onClick={() => { setDonationSearch(""); setStatusFilter("all"); setMethodFilter("all"); setDateFilter("all"); setFromDate(""); setToDate(""); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">Clear filters</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {historyLoading ? <p className="text-sm text-slate-500 text-center py-4">Loading transactions…</p> : historyError ? <p className="text-sm text-rose-600 text-center py-4">{historyError}</p> : filteredDonations.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No transactions found.</p>
                ) : filteredDonations.map(d => (
                  <div key={d.id} className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3 text-sm">
                    <div>
                      <p className="font-bold text-slate-900">{d.residentName || "Donor"}</p>
                      {d.phone && <p className="text-xs text-slate-400">{d.phone}</p>}
                      <p className="text-xs text-slate-400">{dateFmt(d.createdAt)}</p>
                      <p className="text-xs font-mono text-slate-400">Ref: {d.paymentTransactionId ?? d.receiptNo ?? d.id.slice(0, 10)}</p>
                      {d.note && <p className="text-xs text-slate-400 italic">{d.note}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-none">
                      <p className="font-black text-orange-600">₹{Number(d.amount || 0).toLocaleString()}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${d.paymentMode === "cash" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {(d.paymentMode ?? "").toUpperCase()}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[d.status ?? "pending_approval"] ?? "bg-slate-100 text-slate-500"}`}>
                        {d.status === "approved" ? "Approved" : d.status === "rejected" ? "Rejected" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
