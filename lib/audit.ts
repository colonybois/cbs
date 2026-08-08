import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AuditEntry = {
  actorId: string;
  actorName: string;
  action: string;
  module: string;
  targetId?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  approvalStatus?: "approved" | "rejected" | "pending";
};

/** Audit entries are append-only in Firestore rules. Do not store secrets or payment proofs here. */
export function recordAudit(entry: AuditEntry) {
  const auditId = `AUD-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  return addDoc(collection(db, "admin_audit_logs"), { ...entry, auditId, createdAt: serverTimestamp() });
}
