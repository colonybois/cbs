import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
const roles = ["member", "admin", "super_admin"] as const;
const statuses = ["active", "suspended"] as const;

async function actor(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Unauthenticated");
  const decoded = await adminAuth().verifyIdToken(token);
  const profile = (await adminDb().collection("users").doc(decoded.uid).get()).data();
  if (profile?.role !== "super_admin" || profile.status !== "active") throw new Error("Forbidden");
  return { uid: decoded.uid, name: profile.name || "Super Admin" };
}
const responseError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Request failed";
  return NextResponse.json({ error: message }, { status: message === "Unauthenticated" ? 401 : message === "Forbidden" ? 403 : 400 });
};
const total = (docs: FirebaseFirestore.QueryDocumentSnapshot[], status: string) => docs.filter(doc => doc.data().status === status).reduce((sum, doc) => sum + Number(doc.data().amount || 0), 0);

export async function GET(request: NextRequest) {
  try {
    await actor(request); const db = adminDb();
    const [users, donations, online] = await Promise.all([db.collection("users").get(), db.collection("donations").get(), db.collection("online_donations").get()]);
    const cash = donations.docs.filter(doc => doc.data().status === "approved" && doc.data().paymentMode === "cash").reduce((sum, doc) => sum + Number(doc.data().amount || 0), 0);
    const upi = donations.docs.filter(doc => doc.data().status === "approved" && doc.data().paymentMode === "upi").reduce((sum, doc) => sum + Number(doc.data().amount || 0), 0) + total(online.docs, "approved");
    return NextResponse.json({ users: users.docs.map(doc => ({ id: doc.id, ...doc.data() })), finance: { approved: cash + upi, cash, upi, pending: total(donations.docs, "pending_approval") + total(online.docs, "pending") } });
  } catch (error) { return responseError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const who = await actor(request); const body = await request.json() as Record<string, unknown>;
    if (body.action !== "user_update") throw new Error("Invalid action");
    const targetId = String(body.targetId || ""); const role = body.role; const status = body.status;
    if (!targetId || targetId === who.uid) throw new Error("You cannot change your own Super Admin access.");
    if (role !== undefined && !roles.includes(role as typeof roles[number])) throw new Error("Invalid role.");
    if (status !== undefined && !statuses.includes(status as typeof statuses[number])) throw new Error("Invalid status.");
    const db = adminDb(); const target = db.collection("users").doc(targetId); const before = await target.get();
    if (!before.exists) throw new Error("User not found.");
    const prior = before.data();
    const removesFinalSuperAdmin = prior?.role === "super_admin" && prior.status === "active" && (role !== "super_admin" || status === "suspended");
    if (removesFinalSuperAdmin) {
      const superAdmins = await db.collection("users").where("role", "==", "super_admin").where("status", "==", "active").get();
      if (superAdmins.size <= 1) throw new Error("The final active Super Admin cannot be changed.");
    }
    await target.update({ ...(role ? { role } : {}), ...(status ? { status } : {}), updatedAt: FieldValue.serverTimestamp() });
    await db.collection("admin_audit_logs").add({ actorId: who.uid, actorName: who.name, actorRole: "super_admin", action: "ROLE_OR_STATUS_CHANGED", module: "Users & Roles", targetId, previousValue: before.data(), newValue: { role, status }, createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  } catch (error) { return responseError(error); }
}
