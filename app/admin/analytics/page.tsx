"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import Card from "@/components/ui/Card";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";

type Donation = { amount?: number; status?: string; paymentMode?: "cash" | "upi"; createdAt?: { toDate?: () => Date } | string | null };
type User = { role?: string; status?: string };
type Visit = { sessionId?: string; createdAt?: { toDate?: () => Date } | string | null };
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const dateOf = (value: Donation["createdAt"]) => typeof value === "string" ? new Date(value) : value?.toDate?.();

export default function AnalyticsPage() {
  const { role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [fieldDonations, setFieldDonations] = useState<Donation[]>([]);
  const [onlineDonations, setOnlineDonations] = useState<Donation[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role !== "admin" && role !== "super_admin") return;
    const finish = () => setLoading(false);
    const stopUsers = onSnapshot(collection(db, "users"), snapshot => { setUsers(snapshot.docs.map(item => item.data() as User)); finish(); }, () => { setError("Unable to load analytics data."); finish(); });
    const stopField = onSnapshot(collection(db, "donations"), snapshot => setFieldDonations(snapshot.docs.map(item => item.data() as Donation)), () => setError("Unable to load field collection analytics."));
    const stopOnline = onSnapshot(collection(db, "online_donations"), snapshot => setOnlineDonations(snapshot.docs.map(item => item.data() as Donation)), () => setError("Unable to load online collection analytics."));
    const stopVisits = onSnapshot(collection(db, "site_visits"), snapshot => setVisits(snapshot.docs.map(item => item.data() as Visit)), () => setError("Unable to load visitor analytics."));
    return () => { stopUsers(); stopField(); stopOnline(); stopVisits(); };
  }, [role]);

  const data = useMemo(() => {
    const approvedField = fieldDonations.filter(item => item.status === "approved");
    const approvedOnline = onlineDonations.filter(item => item.status === "approved");
    const cash = approvedField.filter(item => item.paymentMode === "cash").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const fieldUpi = approvedField.filter(item => item.paymentMode === "upi").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const online = approvedOnline.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const total = cash + fieldUpi + online;
    const all = [...fieldDonations, ...onlineDonations];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start); day.setDate(start.getDate() + index);
      const next = new Date(day); next.setDate(day.getDate() + 1);
      const amount = all.filter(item => item.status === "approved").filter(item => { const date = dateOf(item.createdAt); return date && date >= day && date < next; }).reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const dayVisits = visits.filter(item => { const date = dateOf(item.createdAt); return date && date >= day && date < next; });
      return { label: day.toLocaleDateString("en-IN", { weekday: "short" }), amount, viewers: new Set(dayVisits.map(item => item.sessionId).filter(Boolean)).size };
    });
    const weekVisits = visits.filter(item => { const date = dateOf(item.createdAt); return date && date >= start; });
    return { cash, fieldUpi, online, total, days, viewers: new Set(weekVisits.map(item => item.sessionId).filter(Boolean)).size, pending: fieldDonations.filter(item => item.status === "pending_approval").length + onlineDonations.filter(item => item.status === "pending").length, activeMembers: users.filter(item => item.role === "member" && item.status === "active").length, activeAdmins: users.filter(item => item.role === "admin" && item.status === "active").length, approvalRate: all.length ? Math.round((approvedField.length + approvedOnline.length) / all.length * 100) : 0 };
  }, [fieldDonations, onlineDonations, users, visits]);

  if (authLoading) return <p className="text-slate-600">Checking access…</p>;
  if (role !== "admin" && role !== "super_admin") return <Card className="p-6 text-center text-slate-600">Analytics is available to administrators only.</Card>;
  const maxDay = Math.max(...data.days.map(day => day.amount), 1);
  const maxViewers = Math.max(...data.days.map(day => day.viewers), 1);
  const sources = [["Cash collections", data.cash, "bg-orange-500"], ["Field UPI", data.fieldUpi, "bg-amber-500"], ["Online UPI", data.online, "bg-emerald-500"]] as const;

  return <div className="space-y-7">
    <WelcomeBanner title="Analytics" text={loading ? "Loading live collection data…" : "Live view of contributions, payment approvals, and active volunteers."}/>
    {error && <Card className="border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</Card>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {[[money(data.total), "Approved collection"], [String(data.viewers), "Unique viewers (7 days)"], [String(data.pending), "Pending reviews"], [`${data.approvalRate}%`, "Approval rate"], [String(data.activeMembers), "Active members"], [String(data.activeAdmins), "Active admins"]].map(([value, label]) => <Card key={label} className="bg-white p-5"><p className="text-2xl font-black text-orange-600">{value}</p><p className="mt-2 text-sm text-slate-600">{label}</p></Card>)}
    </div>
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="p-5"><h2 className="font-black text-slate-900">Collection by payment source</h2><div className="mt-5 space-y-5">{sources.map(([label, amount, color]) => <div key={label}><div className="flex justify-between gap-4 text-sm"><span className="font-semibold text-slate-700">{label}</span><b className="text-slate-900">{money(amount)}</b></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${data.total ? Math.max(amount / data.total * 100, 2) : 0}%` }}/></div></div>)}</div></Card>
      <Card className="p-5"><h2 className="font-black text-slate-900">Approved collection — last 7 days</h2><div className="mt-5 flex h-44 items-end gap-3">{data.days.map(day => <div key={day.label} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-bold text-slate-600">{day.amount ? money(day.amount) : "—"}</span><div className="flex h-28 w-full items-end rounded-t bg-orange-50"><div className="w-full rounded-t bg-orange-500" style={{ height: `${day.amount / maxDay * 100}%` }}/></div><span className="text-xs text-slate-500">{day.label}</span></div>)}</div></Card>
      <Card className="p-5"><h2 className="font-black text-slate-900">Unique viewers — last 7 days</h2><div className="mt-5 flex h-44 items-end gap-3">{data.days.map(day => <div key={day.label} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-bold text-slate-600">{day.viewers || "—"}</span><div className="flex h-28 w-full items-end rounded-t bg-sky-50"><div className="w-full rounded-t bg-sky-500" style={{ height: `${day.viewers / maxViewers * 100}%` }}/></div><span className="text-xs text-slate-500">{day.label}</span></div>)}</div></Card>
    </div>
  </div>;
}
