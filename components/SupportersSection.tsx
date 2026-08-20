"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import SectionHeading from "@/components/SectionHeading";
import { db } from "@/lib/firebase";

type Supporter = { id: string; displayName: string; message?: string | null };

export default function SupportersSection() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "public_supporters"),
      (snap) => {
        setSupporters(
          snap.docs
            .map((d) => ({
              id: d.id,
              displayName: d.data().displayName as string,
              message: d.data().message as string | null,
            }))
            .filter((d) => d.displayName),
        );
        setError("");
        setLoading(false);
      },
      () => {
        setError("Unable to load supporters right now.");
        setLoading(false);
      },
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
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [supporters]);

  useEffect(() => {
    const el = scrollRef.current;
    if (
      !el ||
      supporters.length === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let frame = 0;
    let previous = performance.now();
    const move = (now: number) => {
      const elapsed = now - previous;
      previous = now;
      if (!pausedRef.current && !document.hidden && el.scrollWidth > el.clientWidth) {
        const next = el.scrollLeft + elapsed * 0.035;
        el.scrollLeft = next >= el.scrollWidth - el.clientWidth - 1 ? 0 : next;
      }
      frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, [supporters]);

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });

  return (
    <div>
      <SectionHeading
        kicker="Community love"
        title="Our Supporters"
        symbol="✦"
        tone="accent"
        lede="Thank you to everyone who supported Colony Bois Ganesh Utsav this year."
      />

      {loading && (
        <div className="mt-7 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 w-44 flex-none animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      )}

      {!loading && !error && supporters.length === 0 && (
        <div className="mt-7 rounded-2xl border border-dashed border-saffron-200 bg-white p-8 text-center">
          <p className="text-2xl">🙏</p>
          <p className="mt-2 font-bold text-slate-900">Supporters will appear here</p>
          <p className="section-note mx-auto mt-1 max-w-sm">
            Donors who consent to public display will show up here after admin approval.
          </p>
        </div>
      )}

      {!loading && error && (
        <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      {!loading && !error && supporters.length > 0 && (
        <div className="relative mt-7">
          {canLeft && (
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="absolute -left-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-saffron-200 bg-white text-lg text-saffron-600 shadow-md transition hover:bg-white sm:flex"
            >
              ‹
            </button>
          )}
          {canRight && (
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="absolute -right-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-saffron-200 bg-white text-lg text-saffron-600 shadow-md transition hover:bg-white sm:flex"
            >
              ›
            </button>
          )}

          <div
            ref={scrollRef}
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-2 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onMouseEnter={() => {
              pausedRef.current = true;
            }}
            onMouseLeave={() => {
              pausedRef.current = false;
            }}
            onFocus={() => {
              pausedRef.current = true;
            }}
            onBlur={() => {
              pausedRef.current = false;
            }}
            onTouchStart={() => {
              pausedRef.current = true;
            }}
            onTouchEnd={() => {
              pausedRef.current = false;
            }}
          >
            {supporters.map((s) => (
              <div
                key={s.id}
                className="flex flex-none snap-start items-center gap-2 rounded-2xl border border-saffron-200 bg-white/90 px-4 py-3 shadow-temple"
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
