"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, updateDoc, writeBatch } from "firebase/firestore";
import Card from "@/components/ui/Card";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import { db } from "@/lib/firebase";
import { recordAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth-context";
import { sendDonationEmail, emailDate } from "@/lib/email";
import TableExportButtons from "@/components/ui/TableExportButtons";

type TimestampLike = { toDate?: () => Date } | string | null;
type Transaction = {
  id: string;
  residentName?: string;
  donorEmail?: string | null;
  phone?: string;
  amount?: number;
  transactionId?: string | null;
  message?: string | null;
  paymentMethod?: string;
  screenshotUrl?: string | null;
  showPublicName?: boolean;
  emailStatus?: string;
  status?: "pending" | "approved" | "rejected";
  createdAt?: TimestampLike;
  verifiedAt?: TimestampLike;
  verifiedBy?: string;
  verifiedByName?: string;
};
type Filter = "all" | "approved" | "pending" | "rejected";

const dateOf = (v: TimestampLike | undefined) =>
  v && typeof v !== "string" ? v.toDate?.() : v ? new Date(v) : null;
const displayDate = (v: TimestampLike | undefined) =>
  dateOf(v)?.toLocaleString() || "Not available";
const statusLabel = (s: Transaction["status"]) =>
  s === "approved" ? "Successful" : s === "rejected" ? "Failed" : "Pending";

const EMAIL_BADGE: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  not_sent: "bg-slate-100 text-slate-500",
  queued: "bg-amber-100 text-amber-700",
};

export default function ChandaTransactionsPage() {
  const { uid, name, role } = useAuth();
  const canDelete = role === "super_admin";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [emailingId, setEmailingId] = useState("");
  const [syncingSupporters, setSyncingSupporters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(
    () =>
      onSnapshot(
        collection(db, "online_donations"),
        (snap) => setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction)),
        () => setError("Unable to load Chanda transactions."),
      ),
    [],
  );

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (filter !== "all" && t.status !== filter) return false;
        const date = dateOf(t.createdAt);
        if (from && (!date || date < new Date(`${from}T00:00:00`))) return false;
        if (to && (!date || date > new Date(`${to}T23:59:59`))) return false;
        return true;
      }),
    [transactions, filter, from, to],
  );

  const approved = transactions.filter((t) => t.status === "approved");
  const exportHeaders = [
    "Donor",
    "Phone",
    "Email",
    "Amount",
    "UPI Reference",
    "Date & Time",
    "Method",
    "Status",
    "Reviewed By",
    "Message",
  ];
  const exportRows = filtered.map((t) => [
    t.residentName || "Unknown donor",
    t.phone || "",
    t.donorEmail || "",
    `₹${Number(t.amount || 0).toLocaleString()}`,
    t.transactionId || "",
    displayDate(t.createdAt),
    t.paymentMethod?.toUpperCase() || "UPI",
    statusLabel(t.status),
    t.verifiedByName || t.verifiedBy || "",
    t.message || "",
  ]);
  const summary = [
    [
      `₹${approved.reduce((s, t) => s + Number(t.amount || 0), 0).toLocaleString()}`,
      "Total Chanda Collected",
    ],
    [String(transactions.length), "Transactions"],
    [String(approved.length), "Successful Payments"],
    [String(transactions.filter((t) => t.status === "pending").length), "Pending Payments"],
    [String(transactions.filter((t) => t.status === "rejected").length), "Failed Payments"],
  ];

  // ── Approve / Reject ───────────────────────────────────────────────────────
  const review = async (transaction: Transaction, status: "approved" | "rejected") => {
    if (!uid || !name) return;
    setUpdatingId(transaction.id);
    setError("");
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "online_donations", transaction.id), {
        status,
        verifiedBy: uid,
        verifiedByName: name,
        verifiedAt: new Date().toISOString(),
      });
      const publicRef = doc(db, "public_supporters", transaction.id);
      if (status === "approved" && transaction.showPublicName === true) {
        batch.set(publicRef, {
          displayName: transaction.residentName || "Anonymous supporter",
          message: transaction.message || null,
          approvalStatus: "approved",
          publicDisplay: true,
          updatedAt: new Date().toISOString(),
        });
      } else {
        batch.delete(publicRef);
      }
      await batch.commit();
      await recordAudit({
        actorId: uid,
        actorName: name,
        action:
          status === "approved" ? "Approved Chanda transaction" : "Rejected Chanda transaction",
        module: "Chanda Transactions",
        targetId: transaction.id,
        previousValue: { status: transaction.status || "pending" },
        newValue: { status },
        approvalStatus: status,
      });

      // Send receipt email on approval if donor provided email
      if (status === "approved" && transaction.donorEmail) {
        await triggerEmail(transaction, "receipt", uid, name);
      }
    } catch {
      setError("Could not update the transaction. Please try again.");
    } finally {
      setUpdatingId("");
    }
  };

  // ── Email trigger (approval or manual retry) ───────────────────────────────
  const triggerEmail = async (
    t: Transaction,
    type: "thank_you" | "receipt",
    actorId: string,
    actorName: string,
  ) => {
    if (!t.donorEmail) return;
    setEmailingId(t.id);
    // Mark queued optimistically
    await updateDoc(doc(db, "online_donations", t.id), { emailStatus: "queued" });
    const result = await sendDonationEmail({
      type,
      to: t.donorEmail,
      donorName: t.residentName ?? "Donor",
      amount: t.amount ?? 0,
      paymentMethod: (t.paymentMethod ?? "UPI").toUpperCase(),
      date: emailDate(t.createdAt),
      referenceId: t.id.slice(0, 10).toUpperCase(),
      targetCollection: "online_donations",
      targetId: t.id,
      triggeredBy: actorId,
      triggeredByName: actorName,
    });
    await updateDoc(doc(db, "online_donations", t.id), {
      emailStatus: result.ok ? "sent" : "failed",
    });
    if (result.ok) {
      await recordAudit({
        actorId,
        actorName,
        action: "Donation email sent",
        module: "Chanda Transactions",
        targetId: t.id,
        newValue: { recipient: t.donorEmail, type, status: "sent" },
      });
    }
    setEmailingId("");
  };

  // ── Sync supporters ────────────────────────────────────────────────────────
  const syncExistingSupporters = async () => {
    if (!uid) return;
    setSyncingSupporters(true);
    setError("");
    try {
      const eligible = transactions.filter(
        (t) => t.status === "approved" && t.showPublicName === true,
      );
      if (eligible.length > 500) throw new Error("Too many supporters to sync at once.");
      const batch = writeBatch(db);
      eligible.forEach((t) =>
        batch.set(doc(db, "public_supporters", t.id), {
          displayName: t.residentName || "Anonymous supporter",
          message: t.message || null,
          approvalStatus: "approved",
          publicDisplay: true,
          updatedAt: new Date().toISOString(),
        }),
      );
      await batch.commit();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sync public supporters.");
    } finally {
      setSyncingSupporters(false);
    }
  };

  const toggleSelected = (id: string) =>
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
    );
  const toggleAllFiltered = () =>
    setSelectedIds((ids) => {
      const filteredIds = filtered.map((item) => item.id);
      return filteredIds.every((id) => ids.includes(id))
        ? ids.filter((id) => !filteredIds.includes(id))
        : [...new Set([...ids, ...filteredIds])];
    });
  const deleteSelected = async () => {
    const targets = transactions.filter((item) => selectedIds.includes(item.id));
    if (!uid || !name || targets.length === 0) return;
    if (targets.length > 250) {
      setError("Delete up to 250 transactions at a time.");
      return;
    }
    if (
      !window.confirm(
        `Permanently delete ${targets.length} selected Chanda transaction${targets.length === 1 ? "" : "s"}? This cannot be undone.`,
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      const batch = writeBatch(db);
      targets.forEach((item) => {
        batch.delete(doc(db, "online_donations", item.id));
        batch.delete(doc(db, "public_supporters", item.id));
      });
      await batch.commit();
      await recordAudit({
        actorId: uid,
        actorName: name,
        action: "Deleted Chanda transactions",
        module: "Chanda Transactions",
        newValue: { count: targets.length, transactionIds: targets.map((item) => item.id) },
        approvalStatus: "approved",
      });
      setSelectedIds([]);
    } catch {
      setError("Could not delete the selected transactions. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-7">
      <WelcomeBanner
        title="Chanda Transactions"
        text="Only verified transactions are counted as collected. A UPI app launch is not payment confirmation."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summary.map(([v, l]) => (
          <Card key={l} className="bg-white p-5">
            <p className="text-2xl font-black text-orange-600">{v}</p>
            <p className="mt-2 text-sm text-slate-600">{l}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="approved">Successful</option>
            <option value="pending">Pending</option>
            <option value="rejected">Failed</option>
          </select>
          <label className="text-sm text-slate-600">
            From{" "}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="ml-1 rounded-lg border border-slate-300 px-2 py-2"
            />
          </label>
          <label className="text-sm text-slate-600">
            To{" "}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="ml-1 rounded-lg border border-slate-300 px-2 py-2"
            />
          </label>
          <button
            disabled={syncingSupporters}
            onClick={() => void syncExistingSupporters()}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 disabled:opacity-50"
          >
            {syncingSupporters ? "Syncing…" : "Sync approved supporters"}
          </button>
          {canDelete && (
            <button
              disabled={deleting || selectedIds.length === 0}
              onClick={() => void deleteSelected()}
              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 disabled:opacity-50"
            >
              {deleting
                ? "Deleting…"
                : `Delete selected${selectedIds.length ? ` (${selectedIds.length})` : ""}`}
            </button>
          )}
          <TableExportButtons
            title="Chanda Transactions"
            headers={exportHeaders}
            rows={exportRows}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          One-time backfill for approved donors who opted into public display.
        </p>
      </Card>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
        >
          {error}
        </p>
      )}

      <Card className="overflow-x-auto">
        <table className="min-w-[1200px] w-full text-left text-sm">
          <thead className="border-b border-orange-100 bg-orange-50 text-slate-700">
            <tr>
              {canDelete && (
                <th className="px-4 py-3">
                  <input
                    aria-label="Select all visible transactions"
                    type="checkbox"
                    checked={
                      filtered.length > 0 && filtered.every((item) => selectedIds.includes(item.id))
                    }
                    onChange={toggleAllFiltered}
                  />
                </th>
              )}
              {[
                "Screenshot",
                "Donor",
                "Amount",
                "UPI reference",
                "Date & time",
                "Method",
                "Status",
                "Email",
                "Details",
                "Review",
              ].map((l) => (
                <th key={l} className="px-4 py-3 font-bold">
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100">
            {filtered.map((item) => (
              <tr key={item.id} className="align-top">
                {canDelete && (
                  <td className="px-4 py-4">
                    <input
                      aria-label={`Select ${item.residentName || "transaction"}`}
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelected(item.id)}
                    />
                  </td>
                )}
                {/* Screenshot */}
                <td className="px-4 py-4">
                  {item.screenshotUrl ? (
                    <button
                      onClick={() => setLightbox(item.screenshotUrl!)}
                      className="group relative overflow-hidden rounded-lg border border-orange-200 bg-orange-50 hover:border-orange-400 transition"
                    >
                      <img
                        src={item.screenshotUrl}
                        alt="Proof"
                        className="h-12 w-16 object-cover"
                      />
                      <span className="absolute inset-0 hidden items-center justify-center bg-slate-900/40 text-xs font-bold text-white group-hover:flex">
                        View
                      </span>
                    </button>
                  ) : (
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      No screenshot
                    </span>
                  )}
                </td>
                {/* Donor */}
                <td className="px-4 py-4 font-semibold text-slate-900">
                  {item.residentName || "Unknown donor"}
                  <br />
                  <span className="font-normal text-slate-500">{item.phone || "No phone"}</span>
                </td>
                <td className="px-4 py-4 font-bold text-orange-700">
                  ₹{Number(item.amount || 0).toLocaleString()}
                </td>
                <td className="px-4 py-4 text-slate-600">{item.transactionId || "Not provided"}</td>
                <td className="px-4 py-4 text-slate-600">{displayDate(item.createdAt)}</td>
                <td className="px-4 py-4 text-slate-600">
                  {item.paymentMethod?.toUpperCase() || "UPI"}
                </td>
                {/* Status */}
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "approved" ? "bg-emerald-50 text-emerald-700" : item.status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.verifiedAt ? `Reviewed ${displayDate(item.verifiedAt)}` : "Awaiting"}
                  </p>
                </td>
                {/* Email status + retry */}
                <td className="px-4 py-4">
                  {item.donorEmail ? (
                    <div className="space-y-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${EMAIL_BADGE[item.emailStatus ?? "not_sent"] ?? EMAIL_BADGE.not_sent}`}
                      >
                        {item.emailStatus === "sent"
                          ? "✓ Sent"
                          : item.emailStatus === "failed"
                            ? "✕ Failed"
                            : item.emailStatus === "queued"
                              ? "… Queued"
                              : "Not sent"}
                      </span>
                      {(item.emailStatus === "failed" || item.emailStatus === "not_sent") &&
                        item.status === "approved" &&
                        uid &&
                        name && (
                          <button
                            disabled={emailingId === item.id}
                            onClick={() => void triggerEmail(item, "receipt", uid, name)}
                            className="block rounded-lg border border-orange-300 bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                          >
                            {emailingId === item.id ? "Sending…" : "Retry Email"}
                          </button>
                        )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No email</span>
                  )}
                </td>
                <td className="max-w-48 px-4 py-4 text-slate-600">{item.message || "—"}</td>
                {/* Review */}
                <td className="px-4 py-4">
                  {item.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        disabled={updatingId === item.id}
                        onClick={() => void review(item, "approved")}
                        className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Verify
                      </button>
                      <button
                        disabled={updatingId === item.id}
                        onClick={() => void review(item, "rejected")}
                        className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-600 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">
                      {item.verifiedByName || item.verifiedBy || "Reviewed"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={canDelete ? 11 : 10}>
                  No transactions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 font-bold hover:bg-orange-50"
          >
            ✕
          </button>
          <img
            src={lightbox}
            alt="Payment screenshot"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
