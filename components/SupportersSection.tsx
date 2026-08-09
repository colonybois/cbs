"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Supporter = { id: string; displayName: string; message?: string | null };

export default function SupportersSection() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "public_supporters"),
      snap => {
        setSupporters(
          snap.docs
            .map(d => ({ id: d.id, displayName: d.data().displayName as string, message: d.data().message as string | null }))
            .filter(d => d.displayName)
        );
        setError(""); setLoading(false);
      },
      () => { setError("Unable to load supporters right now."); setLoading(false); }
    );
    return unsub;
  }, []);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateArrows); ro.disconnect(); };
  }, [supporters]);

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Community love</p>
      <h2 className="mt-2 text-3xl font-black text-slate-900">🙏 Our Supporters</h2>
      <p className="mt-3 text-slate-600">Thank you to everyone who supported Colony Bois Ganesh Utsav this year.</p>

      {loading && (
        <div className="mt-7 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 w-44 flex-none animate-pulse rounded-2xl bg-orange-100" />
          ))}
        </div>
      )}

      {!loading && !error && supporters.length === 0 && (
        <div className="mt-7 rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-8 text-center">
          <p className="text-2xl">🙏</p>
          <p className="mt-2 font-bold text-slate-900">Supporters will appear here</p>
          <p className="mt-1 text-sm text-slate-500">
            Donors who consent to public display will show up here after admin approval.
          </p>
        </div>
      )}

      {!loading && error && <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

      {!loading && !error && supporters.length > 0 && (
        <div className="relative mt-7">
          {canLeft && (
            <button onClick={() => scroll("left")} aria-label="Scroll left"
              className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-white text-lg text-orange-600 shadow-md hover:bg-orange-50 transition">
              ‹
            </button>
          )}
          {canRight && (
            <button onClick={() => scroll("right")} aria-label="Scroll right"
              className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-white text-lg text-orange-600 shadow-md hover:bg-orange-50 transition">
              ›
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {supporters.map(s => (
              <div
                key={s.id}
                className="flex flex-none items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-3 shadow-sm shadow-orange-100/50"
              >
                <span className="text-lg">❤️</span>
                <span className="whitespace-nowrap font-bold text-slate-900">{s.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
