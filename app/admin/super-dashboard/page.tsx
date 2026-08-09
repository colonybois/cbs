"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

type Data = { users: unknown[]; finance: { approved: number; cash: number; upi: number; pending: number } };
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function SuperDashboardPage() {
  const { role, status, loading } = useAuth(); const router = useRouter();
  const [data, setData] = useState<Data | null>(null); const [error, setError] = useState("");
  const load = useCallback(async () => { try { const token = await auth.currentUser?.getIdToken(); const response = await fetch("/api/super-admin", { headers: { Authorization: `Bearer ${token || ""}` } }); const json = await response.json() as Data & { error?: string }; if (!response.ok) throw new Error(json.error || "Unable to load protected data."); setData(json); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load protected data."); } }, []);
  useEffect(() => { if (!loading && (role !== "super_admin" || status !== "active")) router.replace("/login"); }, [loading, role, status, router]);
  useEffect(() => { if (role === "super_admin" && status === "active") void load(); }, [role, status, load]);
  if (loading || role !== "super_admin" || status !== "active") return <p className="text-slate-600">Checking secure Super Admin access…</p>;
  const values = data ? [[money(data.finance.approved), "Approved collection"], [money(data.finance.cash), "Cash collection"], [money(data.finance.upi), "UPI collection"], [money(data.finance.pending), "Pending collection"], [String(data.users.length), "Registered users"]] : [];
  return <div className="space-y-7"><div className="flex flex-wrap items-center justify-between gap-3"><WelcomeBanner title="Super Admin Dashboard" text="Protected high-level financial and platform oversight."/><Link href="/admin/dashboard" className="rounded-xl border border-orange-300 px-4 py-2 text-sm font-bold text-orange-700">← Admin Dashboard</Link></div>{error && <Card className="border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</Card>}{!data ? <Card className="p-8 text-center text-slate-500">Loading protected data…</Card> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{values.map(([value, label]) => <Card key={label} className="p-5"><p className="text-2xl font-black text-orange-600">{value}</p><p className="mt-2 text-sm text-slate-600">{label}</p></Card>)}</div><Card className="p-5"><h2 className="font-black text-slate-900">Analytics</h2><p className="mt-1 text-sm text-slate-600">Explore collection trends, payment sources, approvals, and viewer activity in the dedicated analytics section.</p><Link href="/admin/analytics" className="mt-4 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Open Analytics →</Link></Card></>}</div>;
}
