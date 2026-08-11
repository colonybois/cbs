import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

async function requireAdmin(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token) throw new Error("Missing admin authorization.");

  const decoded = await adminAuth().verifyIdToken(token);
  const profile = await adminDb().collection("users").doc(decoded.uid).get();
  const data = profile.data();
  if (data?.status !== "active" || (data?.role !== "admin" && data?.role !== "super_admin")) {
    throw new Error("Admin access required.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const db = adminDb();
    let deleted = 0;

    while (true) {
      const snapshot = await db.collection("site_visits").limit(450).get();
      if (snapshot.empty) break;

      const batch = db.batch();
      snapshot.docs.forEach((document) => batch.delete(document.ref));
      await batch.commit();
      deleted += snapshot.size;
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to clear analytics.",
      },
      { status: 403 },
    );
  }
}
