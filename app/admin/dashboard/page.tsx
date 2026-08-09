"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import Card from "@/components/ui/Card";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import { db } from "@/lib/firebase";
import { recordAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth-context";
import { defaultRegistrationConfig, type RegistrationConfig, type RegistrationRole } from "@/hooks/useRegistrationConfig";

type Member = { id: string; name: string; role?: string; status?: string; pendingHandover: number };
type OnlineDonation = { status: string; amount: number; createdAt?: { toDate?: () => Date } | string | null };
type FieldDonation = { status: string; amount: number; paymentMode?: "cash" | "upi"; createdAt?: { toDate?: () => Date } | string | null };
type Visit = { sessionId?: string; createdAt?: { toDate?: () => Date } | string | null };
const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const dateOf = (value: Visit["createdAt"]) => typeof value === "string" ? new Date(value) : value?.toDate?.();

export default function Dashboard() {
  const { uid, name, role } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [onlineDonations, setOnlineDonations] = useState<OnlineDonation[]>([]);
  const [fieldDonations, setFieldDonations] = useState<FieldDonation[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationConfig, setRegistrationConfig] = useState<RegistrationConfig>(defaultRegistrationConfig);
  const [savingRegistrationSetting, setSavingRegistrationSetting] = useState(false);

  useEffect(() => {
    const users = onSnapshot(collection(db, "users"), snapshot => {
      setMembers(snapshot.docs.map(document => ({ id: document.id, name: document.data().name || "Unknown collector", role: document.data().role || "member", status: document.data().status || "pending", pendingHandover: Number(document.data().pendingHandover || 0) })));
      setLoading(false);
    });
    const online = onSnapshot(collection(db, "online_donations"), snapshot => setOnlineDonations(snapshot.docs.map(document => document.data() as OnlineDonation)));
    const field = onSnapshot(collection(db, "donations"), snapshot => setFieldDonations(snapshot.docs.map(document => document.data() as FieldDonation)));
    const siteVisits = onSnapshot(collection(db, "site_visits"), snapshot => setVisits(snapshot.docs.map(document => document.data() as Visit)));
    const registration = onSnapshot(doc(db, "site_settings", "registration_config"), snapshot => {
      const data = snapshot.data();
      const allowedRoles = Array.isArray(data?.allowedRoles)
        ? data.allowedRoles.filter((role): role is RegistrationRole => role === "member" || role === "admin")
        : defaultRegistrationConfig.allowedRoles;
      setRegistrationConfig({ isRegistrationOpen: data?.isRegistrationOpen !== false, hideRegistrationUI: data?.hideRegistrationUI === true, allowedRoles });
    });
    return () => { users(); online(); field(); siteVisits(); registration(); };
  }, []);

  const saveRegistrationConfig = async (nextConfig: RegistrationConfig) => {
    setSavingRegistrationSetting(true);
    try {
      await setDoc(doc(db, "site_settings", "registration_config"), { ...nextConfig, updatedAt: new Date().toISOString() }, { merge: true });
      if (uid && name) await recordAudit({ actorId: uid, actorName: name, action: "Changed registration access settings", module: "Settings", previousValue: registrationConfig, newValue: nextConfig });
      setRegistrationConfig(nextConfig);
    } finally { setSavingRegistrationSetting(false); }
  };

  const pendingMembers = members.filter(member => member.pendingHandover > 0);
  const unsettled = pendingMembers.reduce((sum, member) => sum + member.pendingHandover, 0);
  const approvedField = fieldDonations.filter(item => item.status === "approved");
  const onlineUpi = onlineDonations.filter(item => item.status === "approved").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const cashTotal = approvedField.filter(item => item.paymentMode === "cash").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const memberUpiTotal = approvedField.filter(item => item.paymentMode === "upi").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalCollected = cashTotal + memberUpiTotal + onlineUpi;
  const pending = onlineDonations.filter(item => item.status === "pending").length + fieldDonations.filter(item => item.status === "pending_approval").length;
  const active = members.filter(member => member.role === "member" && member.status === "active").length;
  const cards = [[rupees(totalCollected), "Total collection"], [rupees(onlineUpi), "Self donations (online)"], [rupees(cashTotal), "Member payments (cash)"], [rupees(memberUpiTotal), "Member payments (UPI)"], [rupees(unsettled), "Unsettled field cash"], [String(pending), "Pending payment reviews"], [String(active), "Active collection Bois"]];
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - 6);
  const days = Array.from({ length: 7 }, (_, index) => { const day = new Date(weekStart); day.setDate(weekStart.getDate() + index); const next = new Date(day); next.setDate(day.getDate() + 1); const collection = [...approvedField, ...onlineDonations.filter(item => item.status === "approved")].filter(item => { const date = dateOf(item.createdAt); return date && date >= day && date < next; }).reduce((sum, item) => sum + Number(item.amount || 0), 0); const viewers = new Set(visits.filter(item => { const date = dateOf(item.createdAt); return date && date >= day && date < next; }).map(item => item.sessionId).filter(Boolean)).size; return { label: day.toLocaleDateString("en-IN", { weekday: "short" }), collection, viewers }; });
  const uniqueViewers = new Set(visits.filter(item => { const date = dateOf(item.createdAt); return date && date >= weekStart; }).map(item => item.sessionId).filter(Boolean)).size;
  const maxCollection = Math.max(...days.map(day => day.collection), 1); const maxViewers = Math.max(...days.map(day => day.viewers), 1);

  return <div className="space-y-7">
    <WelcomeBanner title="Admin overview" text={loading ? "Loading live collection data..." : "Live figures from your Colony Bois Firebase data."}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([value, label]) => <Card key={label} className="bg-white p-5"><p className="text-2xl font-black text-orange-600">{value}</p><p className="mt-2 text-sm text-slate-600">{label}</p></Card>)}</div>
    {role === "super_admin" && <section className="space-y-4"><div><h2 className="text-xl font-black text-slate-900">Analytics</h2><p className="mt-1 text-sm text-slate-600">Super Admin insights are part of this dashboard.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Card className="p-5"><p className="text-2xl font-black text-orange-600">{uniqueViewers}</p><p className="mt-2 text-sm text-slate-600">Unique viewers (7 days)</p></Card><Card className="p-5"><p className="text-2xl font-black text-orange-600">{members.length}</p><p className="mt-2 text-sm text-slate-600">Registered users</p></Card><Card className="p-5"><p className="text-2xl font-black text-orange-600">{pending}</p><p className="mt-2 text-sm text-slate-600">Pending reviews</p></Card></div><div className="grid gap-5 lg:grid-cols-2"><Card className="p-5"><h3 className="font-black text-slate-900">Collection — last 7 days</h3><div className="mt-5 flex h-44 items-end gap-3">{days.map(day => <div key={day.label} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-bold text-slate-600">{day.collection ? rupees(day.collection) : "—"}</span><div className="flex h-28 w-full items-end rounded-t bg-orange-50"><div className="w-full rounded-t bg-orange-500" style={{ height: `${day.collection / maxCollection * 100}%` }}/></div><span className="text-xs text-slate-500">{day.label}</span></div>)}</div></Card><Card className="p-5"><h3 className="font-black text-slate-900">Viewers — last 7 days</h3><div className="mt-5 flex h-44 items-end gap-3">{days.map(day => <div key={day.label} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-bold text-slate-600">{day.viewers || "—"}</span><div className="flex h-28 w-full items-end rounded-t bg-sky-50"><div className="w-full rounded-t bg-sky-500" style={{ height: `${day.viewers / maxViewers * 100}%` }}/></div><span className="text-xs text-slate-500">{day.label}</span></div>)}</div></Card></div></section>}
    <Card className="border-orange-200 bg-orange-50 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-900">Registration & access control</p><p className="mt-1 text-sm text-slate-600">Manage who can request an account and where registration is visible.</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${registrationConfig.isRegistrationOpen ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{registrationConfig.isRegistrationOpen ? "Registration open" : "Registration frozen"}</span></div><div className="mt-5 grid gap-4 md:grid-cols-3"><label className="flex cursor-pointer gap-3 rounded-xl border border-orange-200 bg-white p-4"><input type="checkbox" checked={registrationConfig.isRegistrationOpen} disabled={savingRegistrationSetting} onChange={event => void saveRegistrationConfig({ ...registrationConfig, isRegistrationOpen: event.target.checked })} className="mt-1 h-4 w-4 accent-orange-600"/><span><b className="block text-sm text-slate-900">Allow new registrations</b><span className="mt-1 block text-xs leading-5 text-slate-600">Freeze sign-ups when volunteer quotas are filled.</span></span></label><label className="flex cursor-pointer gap-3 rounded-xl border border-orange-200 bg-white p-4"><input type="checkbox" checked={registrationConfig.hideRegistrationUI} disabled={savingRegistrationSetting} onChange={event => void saveRegistrationConfig({ ...registrationConfig, hideRegistrationUI: event.target.checked })} className="mt-1 h-4 w-4 accent-orange-600"/><span><b className="block text-sm text-slate-900">Hide registration UI</b><span className="mt-1 block text-xs leading-5 text-slate-600">Hide public Register links and guard direct registration URLs.</span></span></label><div className="rounded-xl border border-orange-200 bg-white p-4"><p className="text-sm font-bold text-slate-900">Allowed registration roles</p><div className="mt-3 space-y-2"><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={registrationConfig.allowedRoles.includes("member")} disabled={savingRegistrationSetting} onChange={event => void saveRegistrationConfig({ ...registrationConfig, allowedRoles: event.target.checked ? Array.from(new Set<RegistrationRole>([...registrationConfig.allowedRoles, "member"])) : registrationConfig.allowedRoles.filter(role => role !== "member") })} className="h-4 w-4 accent-orange-600"/>Allow member registrations</label><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={registrationConfig.allowedRoles.includes("admin")} disabled={savingRegistrationSetting} onChange={event => void saveRegistrationConfig({ ...registrationConfig, allowedRoles: event.target.checked ? Array.from(new Set<RegistrationRole>([...registrationConfig.allowedRoles, "admin"])) : registrationConfig.allowedRoles.filter(role => role !== "admin") })} className="h-4 w-4 accent-orange-600"/>Allow admin registrations</label></div></div></div>{savingRegistrationSetting && <p className="mt-3 text-xs font-semibold text-orange-700">Saving registration settings…</p>}</Card>
    <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-orange-100 p-5"><div><h2 className="font-bold text-slate-900">Action required</h2><p className="mt-1 text-sm text-slate-600">Collectors holding cash for handover</p></div><Link href="/admin/members" className="text-sm font-bold text-orange-600">View all →</Link></div>{pendingMembers.length === 0 ? <p className="p-6 text-center text-sm text-slate-600">No pending cash handovers.</p> : <div className="divide-y divide-orange-100">{pendingMembers.map(member => <div className="flex items-center gap-3 p-4" key={member.id}><div className="grid h-9 w-9 place-items-center rounded-full bg-orange-50">👤</div><p className="flex-1 font-semibold text-slate-900">{member.name}</p><b className="text-orange-600">{rupees(member.pendingHandover)}</b></div>)}</div>}</Card>
  </div>;
}
