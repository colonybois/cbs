"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { recordAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import {
  defaultHomeSections,
  HOME_SECTION_META,
  parseHomeSections,
  saveHomeSections,
  type HomeSectionId,
  type HomeSectionsConfig,
} from "@/hooks/useHomeSections";

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
    <div className="flex items-center justify-between gap-4 rounded-xl border border-saffron-100 bg-white p-4">
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
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

export default function HomeSectionsAdminPage() {
  const { uid, name: adminName, role, loading: authLoading } = useAuth();
  const [sections, setSections] = useState<HomeSectionsConfig>(defaultHomeSections);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const savingRef = useRef(false);

  const isAdmin = role === "admin" || role === "super_admin";

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    window.setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    return onSnapshot(
      doc(db, "site_settings", "home_sections"),
      (snapshot) => {
        if (savingRef.current) return;
        setSections(parseHomeSections(snapshot.data() as Record<string, unknown> | undefined));
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        showToast(error.message || "Unable to load homepage section settings.", false);
      },
    );
  }, [authLoading, isAdmin]);

  const toggle = async (id: HomeSectionId) => {
    if (!uid || !isAdmin || savingRef.current) return;
    const previous = sections[id] === true;
    const nextValue = !previous;
    const next: HomeSectionsConfig = { ...sections, [id]: nextValue };
    savingRef.current = true;
    setSaving(true);
    setSections(next);
    try {
      await saveHomeSections(next);
      showToast(
        `${HOME_SECTION_META.find((item) => item.id === id)?.label ?? id} ${nextValue ? "enabled" : "disabled"}.`,
        true,
      );
      void recordAudit({
        actorId: uid,
        actorName: adminName || "Admin",
        action: nextValue ? "enable_home_section" : "disable_home_section",
        module: "home_sections",
        targetId: id,
        previousValue: { [id]: previous },
        newValue: { [id]: nextValue },
      }).catch(() => undefined);
    } catch (reason) {
      setSections((current) => ({ ...current, [id]: previous }));
      const err = reason as { code?: string; message?: string };
      showToast(
        `[${err?.code || "error"}] ${err?.message || "Could not update section visibility."}`,
        false,
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (authLoading) {
    return <p className="py-16 text-center text-sm text-slate-500">Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Admins only</h1>
        <p className="section-note mt-2">Homepage section controls are available to admins.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <WelcomeBanner
        title="Homepage sections"
        text="Enable or disable homepage blocks. Changes also update the public navigation."
      />

      <Card className="space-y-3 p-5">
        <p className="text-sm text-slate-600">
          Off hides the section on the homepage and in the menu. On shows it again.
        </p>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-saffron-50" />
            ))}
          </div>
        ) : (
          HOME_SECTION_META.map((item) => (
            <ToggleRow
              key={item.id}
              label={`${item.label} · Nav: ${item.navLabel}`}
              description={item.description}
              enabled={sections[item.id] === true}
              saving={saving}
              onToggle={() => void toggle(item.id)}
            />
          ))
        )}
      </Card>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-xl ${
            toast.ok ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.ok ? "✓ " : "✕ "}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
