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
  return addDoc(collection(db, "admin_audit_logs"), { ...entry, createdAt: serverTimestamp() });
}
