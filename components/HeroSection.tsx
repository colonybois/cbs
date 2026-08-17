"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import UploadHeroBgModal from "@/components/admin/UploadHeroBgModal";
import { useRegistrationConfig } from "@/hooks/useRegistrationConfig";
import { smoothScrollToId } from "@/lib/smooth-scroll";

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
      className={`grid-lines temple-frame relative isolate overflow-hidden rounded-[1.6rem] border border-amber-200/80 px-5 py-11 sm:rounded-[2.1rem] sm:px-14 sm:py-[4.5rem] ${hasCustomBackground ? "bg-slate-900" : "bg-gradient-to-br from-[#fffcf7] via-[#fff8ef] to-[#f4ead6]"}`}
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
      {!hasCustomBackground && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-amber-200/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-amber-100/25 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-6 top-6 font-yatra text-7xl leading-none text-amber-700/10 sm:right-10 sm:text-8xl"
          >
            ॐ
          </span>
        </>
      )}
      {signedIn && (role === "admin" || role === "super_admin") && (
        <button
          onClick={() => setEditorOpen(true)}
          className="absolute right-5 top-5 rounded-xl border border-amber-300 bg-white/90 px-3 py-2 text-sm font-bold text-orange-700 shadow-sm backdrop-blur hover:bg-white"
        >
          Edit Hero Background
        </button>
      )}
      <div className="max-w-3xl">
        <p
          className={`mb-2 font-yatra text-2xl sm:text-3xl ${hasCustomBackground ? "text-amber-200" : "text-orange-700"}`}
        >
          गणपति बप्पा मोरया
        </p>
        <p
          className={`mb-5 text-xs font-semibold uppercase tracking-[.22em] ${hasCustomBackground ? "text-orange-200" : "text-orange-600"}`}
        >
          Vinayaka Chavathi 2026 · Colony Pandal
        </p>
        <h1
          className={`font-display text-4xl font-semibold leading-[1.12] sm:text-6xl ${hasCustomBackground ? "text-orange-50" : "text-slate-900"}`}
        >
          Bappa is home.{" "}
          <span className={hasCustomBackground ? "text-amber-200" : "text-orange-600"}>
            Let&apos;s celebrate.
          </span>
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
            onClick={(event) => {
              event.preventDefault();
              smoothScrollToId("donate");
            }}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 font-bold text-white shadow-temple hover:from-orange-600 hover:to-amber-600"
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
