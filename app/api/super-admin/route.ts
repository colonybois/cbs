import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

type Profile = { name?: string; role?: string; status?: string };
const roles = ["member", "admin", "super_admin"] as const;
const statuses = ["active", "suspended"] as const;

async function actor(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Unauthenticated");
  const decoded = await adminAuth().verifyIdToken(token);
  const profile = (await adminDb().collection("users").doc(decoded.uid).get()).data() as Profile | undefined;
  if (profile?.role !== "super_admin" || profile.status !== "active") throw new Error("Forbidden");
  return { uid: decoded.uid, name: profile.name || "Super Admin" };
}
function fail(error: unknown) { const message = error instanceof Error ? error.message : "Request failed"; return NextResponse.json({ error: message }, { status: message === "Unauthenticated" ? 401 : message === "Forbidden" ? 403 : 400 }); }
async function audit(data: Record<string, unknown>) { await adminDb().collection("admin_audit_logs").add({ ...data, actorRole: "super_admin", createdAt: FieldValue.serverTimestamp() }); }

export async function GET(request: NextRequest) {
  try {
    await actor(request);
    const db = adminDb();
    const [users, donations, online, events, gallery, comity, supporters] = await Promise.all(["users", "donations", "online_donations", "events", "flashback", "comity_members", "public_supporters"].map(name => db.collection(name).get()));
    const sum = (docs: FirebaseFirestore.QueryDocumentSnapshot[], status: string) => docs.filter(d => d.data().status === status).reduce((n, d) => n + Number(d.data().amount || 0), 0);
    const usersData = users.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({
      users: usersData, counts: { events: events.size, gallery: gallery.size, comity: comity.size, supporters: supporters.size },
      finance: { approved: sum(donations.docs, "approved") + sum(online.docs, "approved"), pending: sum(donations.docs, "pending_approval") + sum(online.docs, "pending"), cash: donations.docs.filter(d => d.data().status === "approved" && d.data().paymentMode === "cash").reduce((n,d) => n + Number(d.data().amount || 0), 0), upi: donations.docs.filter(d => d.data().status === "approved" && d.data().paymentMode === "upi").reduce((n,d) => n + Number(d.data().amount || 0), 0) + sum(online.docs, "approved"), rejected: sum(donations.docs, "rejected") + sum(online.docs, "rejected"), voided: sum(donations.docs, "void") + sum(online.docs, "void") },
    });
  } catch (error) { return fail(error); }
}

export async function POST(request: NextRequest) {
  try {
    const who = await actor(request); const body = await request.json() as Record<string, unknown>; const db = adminDb();
    if (body.action === "user_update") {
      const targetId = String(body.targetId || ""); const role = body.role; const status = body.status;
      if (!targetId || targetId === who.uid) throw new Error("You cannot change your own Super Admin access.");
      if (role !== undefined && !roles.includes(role as typeof roles[number])) throw new Error("Invalid role.");
      if (status !== undefined && !statuses.includes(status as typeof statuses[number])) throw new Error("Invalid status.");
      await db.runTransaction(async tx => { const ref = db.collection("users").doc(targetId); const snap = await tx.get(ref); if (!snap.exists) throw new Error("User not found."); const before = snap.data() as Profile; const removesFinal = before.role === "super_admin" && before.status === "active" && (role !== "super_admin" || status === "suspended"); if (removesFinal) { const supers = await tx.get(db.collection("users").where("role", "==", "super_admin").where("status", "==", "active")); if (supers.size <= 1) throw new Error("The final active Super Admin cannot be changed."); } tx.update(ref, { ...(role ? { role } : {}), ...(status ? { status } : {}), updatedAt: FieldValue.serverTimestamp() }); tx.set(db.collection("admin_audit_logs").doc(), { actorId: who.uid, actorName: who.name, actorRole: "super_admin", action: "UPDATE_USER_ACCESS", module: "Users & Roles", targetId, previousValue: { role: before.role, status: before.status }, newValue: { role: role ?? before.role, status: status ?? before.status }, createdAt: FieldValue.serverTimestamp() }); });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "treasury_adjustment") { const amount = Number(body.amount); const reason = String(body.reason || "").trim(); const reference = String(body.reference || "").trim(); if (!Number.isFinite(amount) || amount === 0 || !reason || !reference) throw new Error("Amount, reason, and reference are required."); const ref = await db.collection("treasury_adjustments").add({ amount, reason, reference, createdBy: who.uid, createdByName: who.name, createdAt: FieldValue.serverTimestamp() }); await audit({ actorId: who.uid, actorName: who.name, action: "TREASURY_ADJUSTMENT", module: "Treasury", targetId: ref.id, newValue: { amount, reason, reference } }); return NextResponse.json({ ok: true }); }
    throw new Error("Unsupported action.");
  } catch (error) { return fail(error); }
}
