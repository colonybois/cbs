import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const bootstrapCode = process.env.SUPER_ADMIN_BOOTSTRAP_CODE;
  if (!bootstrapCode) {
    return NextResponse.json({ error: "Super Admin bootstrap registration is disabled." }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const code = String(body.bootstrapCode || "");
    if (!name || !email || password.length < 6 || !code) throw new Error("Provide your name, email, password, and bootstrap code.");
    if (code !== bootstrapCode) return NextResponse.json({ error: "Invalid Super Admin bootstrap code." }, { status: 403 });

    const created = await adminAuth().createUser({ email, password, displayName: name });
    try {
      await adminDb().collection("users").doc(created.uid).set({
        uid: created.uid,
        name,
        email,
        phone: "",
        role: "super_admin",
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
        bootstrapCreated: true,
      });
      await adminDb().collection("admin_audit_logs").add({
        actorId: created.uid,
        actorName: name,
        actorRole: "super_admin",
        action: "BOOTSTRAP_SUPER_ADMIN_CREATED",
        module: "Authentication",
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      await adminAuth().deleteUser(created.uid);
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the Super Admin account.";
    const status = message.includes("email-already-exists") ? 409 : 400;
    return NextResponse.json({ error: status === 409 ? "An account with this email already exists." : message }, { status });
  }
}
