"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import Card from "@/components/ui/Card";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

type Donation = { amount?: number; status?: string; paymentMode?: "cash" | "upi" };
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function AnalyticsPage() {
  const { role, loading: authLoading } = useAuth(); const [field, setField] = useState<Donation[]>([]); const [online, setOnline] = useState<Donation[]>([]); const [error, setError] = useState("");
  useEffect(() => { if (role !== "admin" && role !== "super_admin") return; const stopField = onSnapshot(collection(db, "donations"), snap => setField(snap.docs.map(doc => doc.data() as Donation)), () => setError("Unable to load payment analytics.")); const stopOnline = onSnapshot(collection(db, "online_donations"), snap => setOnline(snap.docs.map(doc => doc.data() as Donation)), () => setError("Unable to load donation analytics.")); return () => { stopField(); stopOnline(); }; }, [role]);
  const data = useMemo(() => { const approvedField = field.filter(item => item.status === "approved"); const cash = approvedField.filter(item => item.paymentMode === "cash").reduce((sum, item) => sum + Number(item.amount || 0), 0); const memberUpi = approvedField.filter(item => item.paymentMode === "upi").reduce((sum, item) => sum + Number(item.amount || 0), 0); const self = online.filter(item => item.status === "approved").reduce((sum, item) => sum + Number(item.amount || 0), 0); return { cash, upi: memberUpi + self, member: cash + memberUpi, self, total: cash + memberUpi + self }; }, [field, online]);
  if (authLoading) return <p className="text-slate-600">Checking access…</p>;
  if (role !== "admin" && role !== "super_admin") return <Card className="p-6 text-center text-slate-600">Analytics is available to administrators only.</Card>;
  const paymentMethods = [["Cash", data.cash, "bg-orange-500"], ["UPI", data.upi, "bg-emerald-500"]] as const; const donationSources = [["Self donations", data.self, "bg-sky-500"], ["Member collections", data.member, "bg-amber-500"]] as const;
  const graph = (title: string, items: readonly (readonly [string, number, string])[]) => <Card className="p-6"><h2 className="text-lg font-black text-slate-900">{title}</h2><div className="mt-6 space-y-6">{items.map(([label, amount, color]) => <div key={label}><div className="flex justify-between gap-4 text-sm"><span className="font-semibold text-slate-700">{label}</span><b className="text-slate-900">{money(amount)}</b></div><div className="mt-2 h-5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${data.total ? Math.max(amount / data.total * 100, 2) : 0}%` }}/></div></div>)}</div></Card>;
  return <div className="space-y-7"><WelcomeBanner title="Analytics" text="Payment and donation breakdown for all approved collections."/>{error && <Card className="border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</Card>}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Card className="p-5"><p className="text-2xl font-black text-orange-600">{money(data.total)}</p><p className="mt-2 text-sm text-slate-600">Approved collection</p></Card><Card className="p-5"><p className="text-2xl font-black text-orange-600">{money(data.cash)}</p><p className="mt-2 text-sm text-slate-600">Cash payments</p></Card><Card className="p-5"><p className="text-2xl font-black text-orange-600">{money(data.upi)}</p><p className="mt-2 text-sm text-slate-600">UPI payments</p></Card></div><div className="grid gap-5 lg:grid-cols-2">{graph("Payment method", paymentMethods)}{graph("Donation source", donationSources)}</div></div>;
}
