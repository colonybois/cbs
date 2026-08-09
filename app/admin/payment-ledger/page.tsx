"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection, doc, onSnapshot, orderBy, query, runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { recordAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import TableExportButtons from "@/components/ui/TableExportButtons";

type TsLike = { toDate?: () => Date } | string | null;
type Donation = {
  id: string; receiptNo?: string; residentName?: string; phone?: string;
  houseNo?: string; amount?: number; paymentMode?: "cash" | "upi"; note?: string | null;
  collectorId?: string; collectorName?: string;
  status?: "pending_approval" | "approved" | "rejected";
  rejectionReason?: string | null;
  approvedByName?: string; approvedAt?: TsLike;
  createdAt?: TsLike;
};

const dateFmt = (v: TsLike | undefined) => {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v?.toDate?.();
  return d?.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) ?? "—";
};

const STATUS_STYLE: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-700",
  approved:         "bg-emerald-100 text-emerald-700",
  rejected:         "bg-rose-100 text-rose-700",
};

type FilterStatus = "all" | "pending_approval" | "approved" | "rejected";
type FilterMethod = "all" | "cash" | "upi";
type FilterDate = "all" | "today" | "yesterday" | "7d" | "30d" | "custom";

export default function PaymentLedgerPage() {
  const { uid, name: adminName } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Donation | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [receiptTarget, setReceiptTarget] = useState<Donation | null>(null);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [methodFilter, setMethodFilter] = useState<FilterMethod>("all");
  const [collectorFilter, setCollectorFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<FilterDate>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => onSnapshot(
    query(collection(db, "donations"), orderBy("createdAt", "desc")),
    snap => { setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation))); setLoading(false); },
    () => setLoading(false)
  ), []);

  const collectors = useMemo(() => {
    const seen = new Map<string, string>();
    donations.forEach(d => { if (d.collectorId && d.collectorName) seen.set(d.collectorId, d.collectorName); });
    return Array.from(seen.entries());
  }, [donations]);

  const filtered = useMemo(() => {
    const now = new Date();
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return donations.filter(d => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (methodFilter !== "all" && d.paymentMode !== methodFilter) return false;
      if (collectorFilter !== "all" && d.collectorId !== collectorFilter) return false;
      const ts = typeof d.createdAt === "string" ? new Date(d.createdAt) : d.createdAt?.toDate?.();
      if (ts) {
        if (dateFilter === "today" && ts < startOf(now)) return false;
        if (dateFilter === "yesterday") { const y = new Date(now); y.setDate(y.getDate() - 1); if (ts < startOf(y) || ts >= startOf(now)) return false; }
        if (dateFilter === "7d" && ts < new Date(now.getTime() - 7 * 86400000)) return false;
        if (dateFilter === "30d" && ts < new Date(now.getTime() - 30 * 86400000)) return false;
        if (dateFilter === "custom") {
          if (fromDate && ts < new Date(`${fromDate}T00:00:00`)) return false;
          if (toDate && ts > new Date(`${toDate}T23:59:59`)) return false;
        }
      }
      if (search) {
        const q = search.toLowerCase();
        if (!d.residentName?.toLowerCase().includes(q) && !d.collectorName?.toLowerCase().includes(q) && !d.receiptNo?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [donations, statusFilter, methodFilter, collectorFilter, dateFilter, fromDate, toDate, search]);

  const all = donations;
  const approvedD = all.filter(d => d.status === "approved");
  const pendingD  = all.filter(d => d.status === "pending_approval");
  const rejectedD = all.filter(d => d.status === "rejected");
  const sum = (arr: Donation[]) => arr.reduce((s, d) => s + Number(d.amount || 0), 0);
  const summary = [
    [`₹${sum(approvedD).toLocaleString()}`, "Total Approved"],
    [`₹${sum(pendingD).toLocaleString()}`, "Pending Approval"],
    [`₹${sum(approvedD.filter(d => d.paymentMode === "cash")).toLocaleString()}`, "Approved Cash"],
    [`₹${sum(approvedD.filter(d => d.paymentMode === "upi")).toLocaleString()}`, "Approved UPI"],
    [`₹${sum(rejectedD).toLocaleString()}`, "Rejected Amount"],
    [String(new Set(all.map(d => d.collectorId)).size), "Collectors"],
  ];
  const exportHeaders = ["Volunteer", "Donor", "House", "Amount", "Method", "Date", "Reference", "Status", "Approved By", "Note"];
  const exportRows = filtered.map(d => [d.collectorName || "", d.residentName || "", d.houseNo || "", `₹${Number(d.amount || 0).toLocaleString()}`, d.paymentMode?.toUpperCase() || "", dateFmt(d.createdAt), d.receiptNo || d.id.slice(0, 10), d.status === "pending_approval" ? "Pending" : d.status === "approved" ? "Approved" : "Rejected", d.approvedByName || "", d.note || ""]);

  // ── Approve ────────────────────────────────────────────────────────────────
  const approve = async (d: Donation) => {
    if (!uid || !adminName || d.collectorId === uid) { setError("You cannot approve your own collection."); return; }
    if (d.status !== "pending_approval") return;
    setProcessing(d.id); setError("");
    try {
      await runTransaction(db, async tx => {
        const ref = doc(db, "donations", d.id);
        const snap = await tx.get(ref);
        if (snap.data()?.status !== "pending_approval") throw new Error("Already processed.");
        const collectorId = snap.data()?.collectorId;
        if (typeof collectorId !== "string" || !collectorId) throw new Error("This collection has no valid collector.");
        const userRef = doc(db, "users", collectorId);
        // Firestore transactions require every read before the first write.
        // Reading both documents first also prevents a stale total overwrite.
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error("Collector profile was not found.");
        const amount = Number(snap.data()?.amount ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) throw new Error("This collection has an invalid amount.");
        const paymentMode = snap.data()?.paymentMode;
        if (paymentMode !== "cash" && paymentMode !== "upi") throw new Error("This collection has an invalid payment method.");
        const userData = userSnap.data();
        tx.update(ref, { status: "approved", approvedBy: uid, approvedByName: adminName, approvedAt: new Date().toISOString() });
        const inc = paymentMode === "cash"
          ? { cashTotal: amount, pendingHandover: amount }
          : { upiTotal: amount };
        tx.update(userRef, Object.fromEntries(Object.entries(inc).map(([k, v]) => [k, (Number(userData[k] ?? 0) + Number(v))])));
      });
      await recordAudit({ actorId: uid, actorName: adminName, action: "Collection Approved", module: "Payment Ledger", targetId: d.id, newValue: { volunteer: d.collectorName, donor: d.residentName, amount: `₹${d.amount}`, method: d.paymentMode, approvedBy: adminName } });
    } catch (err) { setError(err instanceof Error ? err.message : "Approval failed."); }
    finally { setProcessing(null); }
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const reject = async () => {
    if (!rejectTarget || !uid || !adminName) return;
    setProcessing(rejectTarget.id); setError("");
    try {
      await runTransaction(db, async tx => {
        const ref = doc(db, "donations", rejectTarget.id);
        const snap = await tx.get(ref);
        if (snap.data()?.status !== "pending_approval") throw new Error("Already processed.");
        tx.update(ref, { status: "rejected", rejectionReason: rejectReason.trim() || null, rejectedBy: uid, rejectedByName: adminName, rejectedAt: new Date().toISOString() });
      });
      await recordAudit({ actorId: uid, actorName: adminName, action: "Collection Rejected", module: "Payment Ledger", targetId: rejectTarget.id, newValue: { volunteer: rejectTarget.collectorName, donor: rejectTarget.residentName, amount: `₹${rejectTarget.amount}`, reason: rejectReason || "No reason given" } });
      setRejectTarget(null); setRejectReason("");
    } catch (err) { setError(err instanceof Error ? err.message : "Rejection failed."); }
    finally { setProcessing(null); }
  };

  const toggleSelected = (id: string) => setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  const toggleAllFiltered = () => setSelectedIds(ids => {
    const filteredIds = filtered.map(item => item.id);
    return filteredIds.every(id => ids.includes(id)) ? ids.filter(id => !filteredIds.includes(id)) : [...new Set([...ids, ...filteredIds])];
  });
  const deleteSelected = async () => {
    const targets = donations.filter(item => selectedIds.includes(item.id));
    if (!uid || !adminName || targets.length === 0) return;
    if (targets.length > 100) { setError("Delete up to 100 ledger entries at a time."); return; }
    if (!window.confirm(`Permanently delete ${targets.length} selected ledger entr${targets.length === 1 ? "y" : "ies"}? Approved totals will be reversed. This cannot be undone.`)) return;
    setDeleting(true); setError("");
    try {
      await runTransaction(db, async tx => {
        const donationRefs = targets.map(item => doc(db, "donations", item.id));
        const donationSnapshots = await Promise.all(donationRefs.map(ref => tx.get(ref)));
        const adjustments = new Map<string, { cash: number; upi: number; pending: number }>();
        donationSnapshots.forEach(snapshot => {
          const data = snapshot.data();
          if (!data || data.status !== "approved" || typeof data.collectorId !== "string") return;
          const amount = Number(data.amount || 0);
          if (!Number.isFinite(amount) || amount <= 0) return;
          const current = adjustments.get(data.collectorId) || { cash: 0, upi: 0, pending: 0 };
          if (data.paymentMode === "cash") { current.cash += amount; current.pending += amount; }
          if (data.paymentMode === "upi") current.upi += amount;
          adjustments.set(data.collectorId, current);
        });
        const userRefs = [...adjustments.keys()].map(id => doc(db, "users", id));
        const userSnapshots = await Promise.all(userRefs.map(ref => tx.get(ref)));
        userSnapshots.forEach((snapshot, index) => {
          if (!snapshot.exists()) return;
          const adjustment = adjustments.get(userRefs[index].id)!;
          const data = snapshot.data();
          tx.update(snapshot.ref, {
            cashTotal: Math.max(0, Number(data.cashTotal || 0) - adjustment.cash),
            upiTotal: Math.max(0, Number(data.upiTotal || 0) - adjustment.upi),
            pendingHandover: Math.max(0, Number(data.pendingHandover || 0) - adjustment.pending),
          });
        });
        donationRefs.forEach(ref => tx.delete(ref));
      });
      await recordAudit({ actorId: uid, actorName: adminName, action: "Deleted payment ledger entries", module: "Payment Ledger", newValue: { count: targets.length, donationIds: targets.map(item => item.id) }, approvalStatus: "approved" });
      setSelectedIds([]);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete the selected ledger entries."); }
    finally { setDeleting(false); }
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setMethodFilter("all"); setCollectorFilter("all"); setDateFilter("all"); setFromDate(""); setToDate(""); };

  return (
    <div className="space-y-7">
      <WelcomeBanner title="Payment Ledger" text="Review and approve volunteer door-to-door collections. Only approved collections count toward the official total." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {summary.map(([v, l]) => <Card key={l} className="bg-white p-4"><p className="text-xl font-black text-orange-600">{v}</p><p className="mt-1 text-xs text-slate-500">{l}</p></Card>)}
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donor, volunteer, reference…" className="flex-1 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as FilterStatus)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
            <option value="all">All Status</option><option value="pending_approval">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
          </select>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value as FilterMethod)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
            <option value="all">All Methods</option><option value="cash">Cash</option><option value="upi">UPI</option>
          </select>
          <select value={collectorFilter} onChange={e => setCollectorFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
            <option value="all">All Volunteers</option>
            {collectors.map(([id, cname]) => <option key={id} value={id}>{cname}</option>)}
          </select>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value as FilterDate)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
            <option value="all">All Dates</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="custom">Custom range</option>
          </select>
          {(search || statusFilter !== "all" || methodFilter !== "all" || collectorFilter !== "all" || dateFilter !== "all") && (
            <button onClick={clearFilters} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Clear Filters</button>
          )}
          <button disabled={deleting || selectedIds.length === 0} onClick={() => void deleteSelected()} className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">{deleting ? "Deleting…" : `Delete selected${selectedIds.length ? ` (${selectedIds.length})` : ""}`}</button>
        </div>
        {dateFilter === "custom" && (
          <div className="flex flex-wrap gap-3">
            <label className="text-sm text-slate-600">From <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="ml-1 rounded-lg border border-slate-300 px-2 py-2 text-sm" /></label>
            <label className="text-sm text-slate-600">To <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="ml-1 rounded-lg border border-slate-300 px-2 py-2 text-sm" /></label>
          </div>
        )}
        <TableExportButtons title="Payment Ledger" headers={exportHeaders} rows={exportRows} />
      </Card>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-orange-50" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No collections match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="border-b border-orange-100 bg-orange-50/60">
                <tr><th className="px-4 py-3"><input aria-label="Select all visible ledger entries" type="checkbox" checked={filtered.length > 0 && filtered.every(item => selectedIds.includes(item.id))} onChange={toggleAllFiltered}/></th>{["Volunteer", "Donor", "Amount", "Method", "Date", "Note", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-orange-50/30 transition">
                    <td className="px-4 py-3"><input aria-label={`Select ${d.residentName || "ledger entry"}`} type="checkbox" checked={selectedIds.includes(d.id)} onChange={() => toggleSelected(d.id)}/></td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{d.collectorName || "—"}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{d.residentName || "—"}</p>
                      {d.houseNo && <p className="text-xs text-slate-400">{d.houseNo}</p>}
                      {d.phone && <p className="text-xs text-slate-400">{d.phone}</p>}
                    </td>
                    <td className="px-4 py-3 font-black text-orange-600">₹{Number(d.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${d.paymentMode === "cash" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {(d.paymentMode ?? "").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{dateFmt(d.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-32 truncate">{d.note || "—"}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[d.status ?? "pending_approval"] ?? "bg-slate-100 text-slate-500"}`}>
                        {d.status === "pending_approval" ? "Pending" : d.status === "approved" ? "Approved" : "Rejected"}
                      </span>
                      {d.status === "approved" && d.approvedByName && <p className="mt-0.5 text-xs text-slate-400">by {d.approvedByName}</p>}
                      {d.status === "rejected" && d.rejectionReason && <p className="mt-0.5 text-xs text-rose-400">{d.rejectionReason}</p>}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setReceiptTarget(d)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Receipt</button>
                        {d.status === "pending_approval" && (
                          <>
                            <button disabled={processing === d.id} onClick={() => void approve(d)} className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50">{processing === d.id ? "…" : "Approve"}</button>
                            <button disabled={processing === d.id} onClick={() => { setRejectTarget(d); setRejectReason(""); }} className="rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50">Reject</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reject dialog */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4" onClick={() => setRejectTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900">Reject this collection?</h3>
            <p className="mt-1 text-sm text-slate-500"><strong>{rejectTarget.collectorName}</strong> · {rejectTarget.residentName} · <strong className="text-orange-600">₹{rejectTarget.amount?.toLocaleString()}</strong></p>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Reason <span className="font-normal text-slate-400">(optional)</span>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="e.g. incorrect amount…" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
            </label>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setRejectTarget(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => void reject()} disabled={!!processing} className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-50">{processing ? "Rejecting…" : "Reject"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {receiptTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4" onClick={() => setReceiptTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black uppercase tracking-widest text-orange-600">Collection Receipt</p>
              <button onClick={() => setReceiptTarget(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              {([
                ["Donor", receiptTarget.residentName],
                receiptTarget.phone ? ["Phone", receiptTarget.phone] : null,
                receiptTarget.houseNo ? ["House", receiptTarget.houseNo] : null,
                ["Amount", `₹${Number(receiptTarget.amount || 0).toLocaleString()}`],
                ["Method", (receiptTarget.paymentMode ?? "").toUpperCase()],
                ["Collected by", receiptTarget.collectorName],
                ["Date", dateFmt(receiptTarget.createdAt)],
                ["Status", receiptTarget.status === "approved" ? "✅ Verified" : receiptTarget.status === "rejected" ? "❌ Rejected" : "⏳ Pending"],
                receiptTarget.approvedByName ? ["Approved by", receiptTarget.approvedByName] : null,
                receiptTarget.rejectionReason ? ["Reason", receiptTarget.rejectionReason] : null,
                receiptTarget.note ? ["Note", receiptTarget.note] : null,
                ["Reference", receiptTarget.receiptNo ?? receiptTarget.id.slice(0, 10)],
              ] as ([string, string | undefined] | null)[]).filter((r): r is [string, string] => r !== null).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="font-semibold flex-none">{k}</span>
                  <span className="text-right text-slate-600">{v}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">Colony Bois · Ganesh Chaturthi Chanda</p>
          </div>
        </div>
      )}
    </div>
  );
}
