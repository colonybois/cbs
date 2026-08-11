"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import UploadHeroBgModal from "@/components/admin/UploadHeroBgModal";
import { useRegistrationConfig } from "@/hooks/useRegistrationConfig";

export default function HeroSection() {
  const { loading, signedIn, role } = useAuth();
  const { config: registrationConfig } = useRegistrationConfig();
  const [heroBgUrl, setHeroBgUrl] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  useEffect(
    () =>
      onSnapshot(
        doc(db, "site_settings", "hero"),
        (snapshot) => setHeroBgUrl(String(snapshot.data()?.heroBgUrl || "")),
        () => setHeroBgUrl(""),
      ),
    [],
  );
  const dashboardHref =
    role === "admin" || role === "super_admin" ? "/admin/dashboard" : "/member/dashboard";
  const hasCustomBackground = Boolean(heroBgUrl);
  return (
    <section
      className={`grid-lines relative isolate overflow-hidden rounded-3xl border border-orange-200 px-7 py-16 sm:px-14 ${hasCustomBackground ? "bg-slate-900" : "bg-orange-50"}`}
      style={
        hasCustomBackground
          ? {
              backgroundImage: `url("${heroBgUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {hasCustomBackground && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/35 backdrop-blur-[1px]" />
      )}
      {signedIn && (role === "admin" || role === "super_admin") && (
        <button
          onClick={() => setEditorOpen(true)}
          className="absolute right-5 top-5 rounded-xl border border-orange-300 bg-white/90 px-3 py-2 text-sm font-bold text-orange-700 shadow-sm backdrop-blur hover:bg-white"
        >
          Edit Hero Background
        </button>
      )}
      <div className="max-w-3xl">
        <p
          className={`mb-5 text-sm font-bold uppercase tracking-[.22em] ${hasCustomBackground ? "text-orange-200" : "text-orange-600"}`}
        >
          Vinayaka Chavathi 2026 · Colony Pandal
        </p>
        <h1
          className={`text-4xl font-black leading-tight sm:text-6xl ${hasCustomBackground ? "text-orange-50" : "text-slate-900"}`}
        >
          Bappa is home. <span className="text-orange-400">Let&apos;s celebrate.</span>
        </h1>
        <p
          className={`mt-6 max-w-xl text-lg leading-8 ${hasCustomBackground ? "text-slate-100" : "text-slate-600"}`}
        >
          Celebrating Vinayaka Chavithi with devotion, tradition, unity, community, and the spirit
          of Lord Ganesha.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#donate"
            className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600"
          >
            Chanda / Donate
          </a>
          {loading ? (
            <span className="h-12 w-48 animate-pulse rounded-xl bg-slate-200/70" />
          ) : signedIn ? (
            <Link
              href={dashboardHref}
              className={`rounded-xl border px-5 py-3 font-bold transition ${hasCustomBackground ? "border-orange-300 bg-white/90 text-orange-700 hover:bg-white" : "border-orange-300 bg-white text-orange-700 hover:bg-orange-50"}`}
            >
              Go to Dashboard
            </Link>
          ) : !registrationConfig.hideRegistrationUI ? (
            <Link
              href="/register"
              className={`rounded-xl border px-5 py-3 font-bold transition ${hasCustomBackground ? "border-orange-300 bg-white/90 text-orange-700 hover:bg-white" : "border-orange-300 bg-white text-orange-700 hover:bg-orange-50"}`}
            >
              Join the volunteer team
            </Link>
          ) : null}
        </div>
      </div>
      <UploadHeroBgModal open={editorOpen} onClose={() => setEditorOpen(false)} />
    </section>
  );
}
