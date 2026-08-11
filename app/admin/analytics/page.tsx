"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import Card from "@/components/ui/Card";
import TableExportButtons from "@/components/ui/TableExportButtons";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

type TimestampLike = Date | { toDate?: () => Date } | string | null | undefined;
type Donation = {
  id: string;
  amount?: number;
  status?: string;
  paymentMode?: "cash" | "upi";
  residentName?: string;
  donorName?: string;
  createdAt?: TimestampLike;
};
type SiteVisit = {
  id: string;
  eventType?: "page_view" | "menu_click" | "section_view" | "external_click";
  visitorId?: string;
  sessionId?: string;
  visitorUid?: string;
  visitorName?: string;
  visitorRole?: string;
  isAuthenticated?: boolean;
  path?: string;
  menuLabel?: string;
  menuTarget?: string;
  sectionId?: string;
  sectionLabel?: string;
  source?: string;
  deviceType?: string;
  language?: string;
  timezone?: string;
  referrerHost?: string;
  createdAt?: TimestampLike;
};

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const dateOf = (value: TimestampLike) => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return value.toDate?.();
};
const displayDate = (value: TimestampLike) =>
  dateOf(value)?.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) || "—";
const eventName = (value: SiteVisit["eventType"]) =>
  value === "menu_click"
    ? "Menu click"
    : value === "section_view"
      ? "Section view"
      : value === "external_click"
        ? "External click"
        : "Page view";

function countTop(items: SiteVisit[], labelFor: (item: SiteVisit) => string | undefined) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const label = labelFor(item);
    if (!label) return;
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function ProgressList({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No activity recorded yet.</p>;
  }
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between gap-4 text-sm">
            <span className="truncate font-semibold text-slate-700">{item.label}</span>
            <b className="text-slate-900">{item.count}</b>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-50">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${Math.max((item.count / max) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { role, loading: authLoading } = useAuth();
  const [field, setField] = useState<Donation[]>([]);
  const [online, setOnline] = useState<Donation[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [error, setError] = useState("");
  const [clearingAnalytics, setClearingAnalytics] = useState(false);

  useEffect(() => {
    if (role !== "admin" && role !== "super_admin") return;
    const stopField = onSnapshot(
      collection(db, "donations"),
      (snap) => setField(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Donation)),
      () => setError("Unable to load payment analytics."),
    );
    const stopOnline = onSnapshot(
      collection(db, "online_donations"),
      (snap) => setOnline(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Donation)),
      () => setError("Unable to load donation analytics."),
    );
    const stopSiteVisits = onSnapshot(
      query(collection(db, "site_visits"), orderBy("createdAt", "desc"), limit(1000)),
      (snap) =>
        setSiteVisits(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as SiteVisit)),
      () => setError("Unable to load public site reach analytics."),
    );
    return () => {
      stopField();
      stopOnline();
      stopSiteVisits();
    };
  }, [role]);

  const clearAnalytics = async () => {
    if (
      !window.confirm(
        "Permanently delete all public site analytics from Firebase? This cannot be undone.",
      )
    ) {
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("Please sign in again before clearing analytics.");
      return;
    }

    setClearingAnalytics(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/clear-site-analytics", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = (await response.json()) as { ok?: boolean; deleted?: number; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to clear analytics.");
      }
      window.alert(`Cleared ${result.deleted ?? 0} analytics event(s).`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to clear analytics.");
    } finally {
      setClearingAnalytics(false);
    }
  };

  const donationData = useMemo(() => {
    const approvedField = field.filter((item) => item.status === "approved");
    const approvedSelf = online.filter((item) => item.status === "approved");
    const cash = approvedField
      .filter((item) => item.paymentMode === "cash")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const memberUpi = approvedField
      .filter((item) => item.paymentMode === "upi")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const self = approvedSelf.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const amount = [...approvedField, ...approvedSelf]
        .filter((item) => {
          const date = dateOf(item.createdAt);
          return date && date >= day && date < next;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return { label: day.toLocaleDateString("en-IN", { weekday: "short" }), amount };
    });
    return {
      cash,
      upi: memberUpi + self,
      member: cash + memberUpi,
      self,
      total: cash + memberUpi + self,
      days,
    };
  }, [field, online]);

  const siteData = useMemo(() => {
    const sorted = [...siteVisits].sort(
      (a, b) => (dateOf(b.createdAt)?.getTime() || 0) - (dateOf(a.createdAt)?.getTime() || 0),
    );
    const pageViews = sorted.filter((item) => !item.eventType || item.eventType === "page_view");
    const menuClicks = sorted.filter((item) => item.eventType === "menu_click");
    const sectionViews = sorted.filter((item) => item.eventType === "section_view");
    const externalClicks = sorted.filter((item) => item.eventType === "external_click");
    const visitorKeys = sorted.map((item) => item.visitorId || item.sessionId || item.id);
    const sessionKeys = sorted.map((item) => item.sessionId || item.visitorId || item.id);
    const signedInKeys = sorted
      .filter((item) => item.visitorUid)
      .map((item) => item.visitorUid as string);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const visitors = new Map<
      string,
      {
        label: string;
        role: string;
        device: string;
        language: string;
        lastSeen?: Date;
        pageViews: number;
        menuClicks: number;
        sectionViews: number;
        lastPath: string;
      }
    >();
    sorted.forEach((item) => {
      const key = item.visitorUid || item.visitorId || item.sessionId || item.id;
      const current = visitors.get(key) || {
        label: item.visitorName || `Anonymous ${key.slice(0, 8)}`,
        role: item.visitorRole || (item.isAuthenticated ? "signed-in" : "anonymous"),
        device: item.deviceType || "unknown",
        language: item.language || "",
        lastSeen: undefined,
        pageViews: 0,
        menuClicks: 0,
        sectionViews: 0,
        lastPath: item.path || "/",
      };
      const seenAt = dateOf(item.createdAt);
      if (!current.lastSeen || (seenAt && seenAt > current.lastSeen)) {
        current.lastSeen = seenAt;
        current.lastPath = item.path || current.lastPath;
        current.device = item.deviceType || current.device;
        current.language = item.language || current.language;
      }
      if (!item.eventType || item.eventType === "page_view") current.pageViews += 1;
      if (item.eventType === "menu_click") current.menuClicks += 1;
      if (item.eventType === "section_view") current.sectionViews += 1;
      visitors.set(key, current);
    });

    return {
      uniqueVisitors: new Set(visitorKeys).size,
      uniqueSessions: new Set(sessionKeys).size,
      signedInVisitors: new Set(signedInKeys).size,
      pageViews,
      menuClicks,
      sectionViews,
      externalClicks,
      todayEvents: sorted.filter((item) => {
        const date = dateOf(item.createdAt);
        return date && date >= todayStart;
      }).length,
      topMenus: countTop(menuClicks, (item) => item.menuLabel || item.menuTarget),
      topSections: countTop(sectionViews, (item) => item.sectionLabel || item.sectionId),
      topPages: countTop(pageViews, (item) => item.path),
      visitors: [...visitors.values()]
        .sort((a, b) => (b.lastSeen?.getTime() || 0) - (a.lastSeen?.getTime() || 0))
        .slice(0, 12),
      recent: sorted.slice(0, 14),
    };
  }, [siteVisits]);

  if (authLoading) return <p className="text-slate-600">Checking access…</p>;
  if (role !== "admin" && role !== "super_admin")
    return (
      <Card className="p-6 text-center text-slate-600">
        Analytics is available to administrators only.
      </Card>
    );

  const paymentMethods = [
    ["Cash", donationData.cash, "bg-orange-500"],
    ["UPI", donationData.upi, "bg-emerald-500"],
  ] as const;
  const donationSources = [
    ["Self donations", donationData.self, "bg-sky-500"],
    ["Member collections", donationData.member, "bg-amber-500"],
  ] as const;
  const maxDay = Math.max(...donationData.days.map((day) => day.amount), 1);
  const siteExportRows = siteData.recent.map((item) => [
    eventName(item.eventType),
    item.visitorName || item.visitorId || item.sessionId || "Anonymous",
    item.path || "",
    item.menuLabel || item.sectionLabel || "",
    item.deviceType || "",
    displayDate(item.createdAt),
  ]);
  const graph = (title: string, items: readonly (readonly [string, number, string])[]) => (
    <Card className="p-6">
      <h2 className="text-lg font-black text-slate-900">{title}</h2>
      <div className="mt-6 space-y-6">
        {items.map(([label, amount, color]) => (
          <div key={label}>
            <div className="flex justify-between gap-4 text-sm">
              <span className="font-semibold text-slate-700">{label}</span>
              <b className="text-slate-900">{money(amount)}</b>
            </div>
            <div className="mt-2 h-5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${color}`}
                style={{
                  width: `${donationData.total ? Math.max((amount / donationData.total) * 100, 2) : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="space-y-9">
      <WelcomeBanner
        title="Analytics"
        text="Public site reach, visitor activity, and approved collection performance."
      />
      {error && <Card className="border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</Card>}

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
              Public reach
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Site Visitor Analytics</h2>
          </div>
          <TableExportButtons
            title="Public Site Reach"
            headers={["Event", "Visitor", "Path", "Interaction", "Device", "Date"]}
            rows={siteExportRows}
          />
          <button
            type="button"
            disabled={clearingAnalytics || siteVisits.length === 0}
            onClick={() => void clearAnalytics()}
            className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {clearingAnalytics ? "Clearing…" : "Clear Analytics"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[
            [String(siteData.uniqueVisitors), "Unique visitors"],
            [String(siteData.uniqueSessions), "Visit sessions"],
            [String(siteData.pageViews.length), "Page views"],
            [String(siteData.menuClicks.length), "Menu clicks"],
            [String(siteData.sectionViews.length), "Section views"],
            [String(siteData.signedInVisitors), "Known visitors"],
          ].map(([value, label]) => (
            <Card key={label} className="bg-white p-4">
              <p className="text-2xl font-black text-orange-600">{value}</p>
              <p className="mt-1 text-sm text-slate-600">{label}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="p-6">
            <h3 className="text-lg font-black text-slate-900">Menu Option Reach</h3>
            <div className="mt-5">
              <ProgressList items={siteData.topMenus} />
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-black text-slate-900">Viewed Sections</h3>
            <div className="mt-5">
              <ProgressList items={siteData.topSections} />
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-black text-slate-900">Top Pages</h3>
            <div className="mt-5">
              <ProgressList items={siteData.topPages} />
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-orange-100 p-5">
              <h3 className="text-lg font-black text-slate-900">Who Visited</h3>
              <p className="mt-1 text-sm text-slate-500">
                Signed-in users show by name; anonymous visitors show by browser visitor ID.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="border-b border-orange-100 bg-orange-50 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    {[
                      "Visitor",
                      "Type",
                      "Last seen",
                      "Page views",
                      "Menu clicks",
                      "Device",
                      "Last page",
                    ].map((heading) => (
                      <th key={heading} className="px-4 py-3">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {siteData.visitors.map((visitor) => (
                    <tr key={`${visitor.label}-${visitor.lastSeen?.getTime() || 0}`}>
                      <td className="px-4 py-3 font-bold text-slate-900">{visitor.label}</td>
                      <td className="px-4 py-3 text-slate-600">{visitor.role}</td>
                      <td className="px-4 py-3 text-slate-500">{displayDate(visitor.lastSeen)}</td>
                      <td className="px-4 py-3 font-semibold text-orange-700">
                        {visitor.pageViews}
                      </td>
                      <td className="px-4 py-3 font-semibold text-orange-700">
                        {visitor.menuClicks}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{visitor.device}</td>
                      <td className="px-4 py-3 text-slate-500">{visitor.lastPath}</td>
                    </tr>
                  ))}
                  {siteData.visitors.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No visitors recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-orange-100 p-5">
              <h3 className="text-lg font-black text-slate-900">Recent Public Activity</h3>
              <p className="mt-1 text-sm text-slate-500">
                {siteData.todayEvents} event{siteData.todayEvents === 1 ? "" : "s"} today
              </p>
            </div>
            <div className="divide-y divide-orange-50">
              {siteData.recent.map((item) => (
                <div key={item.id} className="p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-slate-900">{eventName(item.eventType)}</b>
                    <span className="text-xs text-slate-400">{displayDate(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-slate-600">
                    {item.visitorName ||
                      (item.visitorId ? `Anonymous ${item.visitorId.slice(0, 8)}` : "Anonymous")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.menuLabel || item.sectionLabel || item.path || "No target"}
                  </p>
                </div>
              ))}
              {siteData.recent.length === 0 && (
                <p className="p-8 text-center text-sm text-slate-500">No public activity yet.</p>
              )}
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
            Collection performance
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Donation Analytics</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="p-5">
            <p className="text-2xl font-black text-orange-600">{money(donationData.total)}</p>
            <p className="mt-2 text-sm text-slate-600">Approved collection</p>
          </Card>
          <Card className="p-5">
            <p className="text-2xl font-black text-orange-600">{money(donationData.cash)}</p>
            <p className="mt-2 text-sm text-slate-600">Cash payments</p>
          </Card>
          <Card className="p-5">
            <p className="text-2xl font-black text-orange-600">{money(donationData.upi)}</p>
            <p className="mt-2 text-sm text-slate-600">UPI payments</p>
          </Card>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {graph("Payment method", paymentMethods)}
          {graph("Donation source", donationSources)}
          <Card className="p-6">
            <h2 className="text-lg font-black text-slate-900">
              Day-by-day collection — last 7 days
            </h2>
            <div className="mt-6 flex h-48 items-end gap-3">
              {donationData.days.map((day) => (
                <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    {day.amount ? money(day.amount) : "—"}
                  </span>
                  <div className="flex h-28 w-full items-end rounded-t bg-orange-50">
                    <div
                      className="w-full rounded-t bg-orange-500"
                      style={{ height: `${(day.amount / maxDay) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{day.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
