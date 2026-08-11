"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { recordAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import WelcomeBanner from "@/components/layout/WelcomeBanner";

const EMAILJS_SERVICE_ID_DISPLAY = "service_2h9hlku";

// ── types ─────────────────────────────────────────────────────────────────────
type EmailSettings = {
  thankYouEnabled: boolean;
  receiptEnabled: boolean;
  greetingEnabled: boolean;
  updatedAt?: string;
};

type EmailLog = {
  id: string;
  type?: string;
  recipientEmail?: string;
  recipientName?: string;
  status?: string;
  messageId?: string | null;
  error?: string | null;
  triggeredByName?: string;
  targetCollection?: string;
  targetId?: string;
  sentAt?: { toDate?: () => Date } | string | null;
};

const DEFAULT_SETTINGS: EmailSettings = {
  thankYouEnabled: true,
  receiptEnabled: true,
  greetingEnabled: false,
};

const dateFmt = (v: EmailLog["sentAt"]) => {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v?.toDate?.();
  return (
    d?.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) ?? "—"
  );
};

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  queued: "bg-amber-100 text-amber-700",
  not_sent: "bg-slate-100 text-slate-500",
};

const TYPE_LABEL: Record<string, string> = {
  thank_you: "Thank-You",
  receipt: "Receipt",
  greeting: "Greeting",
};

// ── toggle row component ──────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  enabled,
  saving,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-orange-100 bg-white p-4">
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      <button
        disabled={saving}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 flex-none cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${enabled ? "bg-emerald-500" : "bg-slate-300"}`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function EmailSettingsPage() {
  const { uid, name: adminName } = useAuth();
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Load settings from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "site_settings", "email"),
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<EmailSettings>) });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
        setLoadingSettings(false);
      },
      () => setLoadingSettings(false),
    );
    return unsub;
  }, []);

  // Load last 50 email logs
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "email_logs"), orderBy("sentAt", "desc")),
      (snap) => {
        setLogs(snap.docs.slice(0, 50).map((d) => ({ id: d.id, ...d.data() }) as EmailLog));
        setLoadingLogs(false);
      },
      () => setLoadingLogs(false),
    );
    return unsub;
  }, []);

  const toggle = async (key: keyof Omit<EmailSettings, "updatedAt">) => {
    if (!uid || !adminName) return;
    setSaving(true);
    const prev = settings[key];
    const next = { ...settings, [key]: !prev, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, "site_settings", "email"), next, { merge: true });
      await recordAudit({
        actorId: uid,
        actorName: adminName,
        action: "Email notification setting changed",
        module: "Email Settings",
        previousValue: { [key]: prev },
        newValue: { [key]: !prev },
      });
      showToast(`${key.replace("Enabled", "")} emails ${!prev ? "enabled" : "disabled"}.`, true);
    } catch {
      showToast("Failed to save setting.", false);
    } finally {
      setSaving(false);
    }
  };

  const toggles: {
    key: keyof Omit<EmailSettings, "updatedAt">;
    label: string;
    description: string;
  }[] = [
    {
      key: "thankYouEnabled",
      label: "Donation Thank-You Emails",
      description:
        "Send an instant thank-you email when a donor submits a public online Chanda contribution.",
    },
    {
      key: "receiptEnabled",
      label: "Donation Receipt Emails",
      description:
        "Send an official receipt email when an admin approves a collection (cash or UPI).",
    },
    {
      key: "greetingEnabled",
      label: "Vinayaka Chavithi Greetings",
      description:
        "Send a festive Vinayaka Chavithi greeting email to approved donors. Sent manually per donor.",
    },
  ];

  return (
    <div className="space-y-8">
      <WelcomeBanner
        title="Email Settings"
        text="Manage automated email notifications for donations and collections."
      />

      {/* Service status */}
      <Card className="flex items-center justify-between gap-4 bg-white p-5">
        <div>
          <p className="font-bold text-slate-900">Email Service</p>
          <p className="mt-0.5 text-sm text-slate-500">
            Powered by EmailJS · Service ID: {EMAILJS_SERVICE_ID_DISPLAY}
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
          Connected ✅
        </span>
      </Card>

      {/* Toggles */}
      <div>
        <h2 className="mb-3 text-lg font-black text-slate-900">Email Notifications</h2>
        {loadingSettings ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-orange-50" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {toggles.map((t) => (
              <ToggleRow
                key={t.key}
                label={t.label}
                description={t.description}
                enabled={settings[t.key]}
                saving={saving}
                onToggle={() => void toggle(t.key)}
              />
            ))}
          </div>
        )}
        {settings.updatedAt && (
          <p className="mt-3 text-xs text-slate-400">
            Last updated: {new Date(settings.updatedAt).toLocaleString("en-IN")}
          </p>
        )}
      </div>

      {/* Email history */}
      <div>
        <h2 className="mb-3 text-lg font-black text-slate-900">Email History</h2>
        <p className="mb-4 text-sm text-slate-500">
          Last 50 email delivery records. Donor email addresses are shown here — keep this page
          admin-only.
        </p>

        {loadingLogs ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-orange-50" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <Card className="p-8 text-center bg-white">
            <p className="text-2xl">📧</p>
            <p className="mt-2 font-bold text-slate-900">No emails sent yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Email logs will appear here after the first notification is sent.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-orange-100 bg-orange-50/60">
                  <tr>
                    {[
                      "Type",
                      "Recipient",
                      "Status",
                      "Triggered by",
                      "Collection",
                      "Sent at",
                      "Message ID / Error",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-orange-50/30 transition">
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                          {TYPE_LABEL[log.type ?? ""] ?? log.type ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{log.recipientName || "—"}</p>
                        {/* Email visible to admin only — not shown publicly anywhere */}
                        <p className="text-xs text-slate-500">{log.recipientEmail || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[log.status ?? "not_sent"] ?? STATUS_STYLE.not_sent}`}
                        >
                          {log.status === "sent"
                            ? "✓ Sent"
                            : log.status === "failed"
                              ? "✕ Failed"
                              : log.status === "queued"
                                ? "… Queued"
                                : "Not sent"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {log.triggeredByName || "System"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        <span className="font-mono">{log.targetId?.slice(0, 8) ?? "—"}</span>
                        {log.targetCollection && (
                          <p className="text-slate-400">{log.targetCollection}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {dateFmt(log.sentAt)}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-48 truncate">
                        {log.status === "sent" && log.messageId ? (
                          <span className="font-mono text-emerald-600">{log.messageId}</span>
                        ) : log.error ? (
                          <span className="text-rose-600">{log.error}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-xl ${toast.ok ? "bg-emerald-600" : "bg-rose-600"}`}
        >
          {toast.ok ? "✓ " : "✕ "}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
