"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import Card from "@/components/ui/Card";
import { db } from "@/lib/firebase";
import { recordAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth-context";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  createdAt?: { toDate?: () => Date } | string;
};

function formatDate(value: PendingUser["createdAt"]) {
  if (!value) return "Just now";
  if (typeof value === "string") return new Date(value).toLocaleDateString();
  return value.toDate?.().toLocaleDateString() || "Just now";
}

export default function Approvals() {
  const [registrations, setRegistrations] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { uid, name } = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "users"), where("status", "==", "pending")),
      (snap) => {
        setRegistrations(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PendingUser));
        setLoading(false);
      },
      () => {
        setError("Unable to load registration approvals.");
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const review = async (user: PendingUser, status: "active" | "rejected") => {
    if (!uid || !name) return;
    if (user.id === uid) {
      setError("You cannot approve or reject your own request.");
      return;
    }
    setError("");
    try {
      await updateDoc(doc(db, "users", user.id), {
        status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: uid,
        reviewedByName: name,
      });
      await recordAudit({
        actorId: uid,
        actorName: name,
        action: status === "active" ? "Approved account request" : "Rejected account request",
        module: "Admin Approvals",
        targetId: user.id,
        previousValue: { status: "pending", requestedRole: user.role },
        newValue: { status, requestedBy: user.name || user.email },
        approvalStatus: status === "active" ? "approved" : "rejected",
      });
    } catch {
      setError("Could not update this registration. Please try again.");
    }
  };

  return (
    <div>
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-saffron-600">
          🛡️ Admin review
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Registration Approvals</h1>
        <p className="mt-2 text-slate-600">
          Approve or decline new volunteer and admin account requests.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
        >
          {error}
        </p>
      )}

      <div className="mt-7 space-y-3">
        {loading ? (
          <Card className="p-6 text-center text-slate-500">Loading pending registrations…</Card>
        ) : registrations.length === 0 ? (
          <Card className="p-8 text-center text-slate-600">
            No registrations awaiting approval.
          </Card>
        ) : (
          registrations.map((user) => (
            <Card className="flex flex-wrap items-center gap-4 p-5" key={user.id}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-lg">
                🛡️
              </span>
              <div className="flex-1">
                <b className="text-slate-900">{user.name || "Unnamed candidate"}</b>
                <p className="text-sm text-slate-600">
                  {user.email || "No email supplied"} · Requested{" "}
                  {user.role === "admin" ? "Admin" : "Member"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Registered: {formatDate(user.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => void review(user, "active")}
                  className="rounded-lg bg-saffron px-3 py-2 text-xs font-bold text-white hover:bg-saffron-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => void review(user, "rejected")}
                  className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  Decline
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
