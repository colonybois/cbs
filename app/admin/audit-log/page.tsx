"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Card from "@/components/ui/Card";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import { db } from "@/lib/firebase";

type TimestampLike = { toDate?: () => Date } | string;
type AuditLog = { id: string; actorName?: string; action?: string; module?: string; approvalStatus?: string; previousValue?: Record<string, unknown>; newValue?: Record<string, unknown>; createdAt?: TimestampLike };
const date = (value: TimestampLike | undefined) => value && typeof value !== "string" ? value.toDate?.().toLocaleString() : value ? new Date(value).toLocaleString() : "Not available";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]); const [error, setError] = useState("");
  useEffect(() => onSnapshot(
    query(collection(db, "admin_audit_logs"), orderBy("createdAt", "desc")),
    snapshot => setLogs(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as AuditLog))),
    () => setError("Unable to load the audit log.")
  ), []);
  return <div className="space-y-7"><WelcomeBanner title="Admin Audit Log" text="Append-only activity records. Normal admins can view records but cannot edit or delete them." />{error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}<Card className="overflow-x-auto"><table className="min-w-[850px] w-full text-left text-sm"><thead className="border-b border-orange-100 bg-orange-50"><tr>{["Admin / user", "Action", "Module", "Date & time", "Previous value", "New value", "Approval"].map(label => <th key={label} className="px-4 py-3 font-bold text-slate-700">{label}</th>)}</tr></thead><tbody className="divide-y divide-orange-100">{logs.map(log => <tr key={log.id} className="align-top"><td className="px-4 py-4 font-semibold text-slate-900">{log.actorName || "Unknown"}</td><td className="px-4 py-4 text-slate-700">{log.action || "—"}</td><td className="px-4 py-4 text-slate-600">{log.module || "—"}</td><td className="px-4 py-4 text-slate-600">{date(log.createdAt)}</td><td className="max-w-48 break-words px-4 py-4 text-xs text-slate-600">{log.previousValue ? JSON.stringify(log.previousValue) : "—"}</td><td className="max-w-48 break-words px-4 py-4 text-xs text-slate-600">{log.newValue ? JSON.stringify(log.newValue) : "—"}</td><td className="px-4 py-4 capitalize text-slate-600">{log.approvalStatus || "—"}</td></tr>)}{logs.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No audit entries have been recorded yet.</td></tr>}</tbody></table></Card></div>;
}
