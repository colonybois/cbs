"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Flashback = { id: string; title: string; year: number; imageUrl: string; caption?: string };

const AUTO_SCROLL_SPEED = 0.6;   // px per animation frame
const AUTO_SCROLL_PAUSE  = 3000; // ms pause when user interacts

export default function FlashbackSection() {
  const [memories, setMemories] = useState<Flashback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Flashback | null>(null);
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const scrollRef   = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number>(0);
  const pausedRef   = useRef(false);
  const pauseTimer  = useRef<ReturnType<typeof setTimeout>>();

  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  // ── Firestore ────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "flashback"), orderBy("year", "desc")),
      snap => {
        setMemories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Flashback)));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  // ── Arrow visibility ─────────────────────────────────────────────────────
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
  }, [memories]);

  // ── Auto-scroll loop ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || memories.length === 0) return;

    const tick = () => {
      if (!pausedRef.current && el) {
        // Seamless loop: when we reach the end, jump back to start
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += AUTO_SCROLL_SPEED;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [memories]);

  // ── Pause helpers ────────────────────────────────────────────────────────
  const pauseAutoScroll = () => {
    pausedRef.current = true;
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => { pausedRef.current = false; }, AUTO_SCROLL_PAUSE);
  };

  // ── Manual arrow scroll ──────────────────────────────────────────────────
  const scroll = (dir: "left" | "right") => {
    pauseAutoScroll();
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  const markFailed = (id: string) => setFailed(prev => new Set([...prev, id]));

  return (
    <div>
      {/* Header */}
      <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Past celebrations &amp; memories</p>
      <h2 className="mt-2 text-3xl font-black text-slate-900">Utsav Flashback</h2>
      <p className="mt-3 text-slate-600">A live collection of Colony Bois pandal themes, devotion, and beautiful memories.</p>

      {/* Skeleton */}
      {loading && (
        <div className="mt-7 flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-64 w-48 flex-none animate-pulse rounded-2xl bg-orange-100" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && memories.length === 0 && (
        <div className="mt-7 rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-10 text-center">
          <div className="text-4xl">📸</div>
          <h3 className="mt-3 font-bold text-slate-900">Memories are coming soon</h3>
          <p className="mt-2 text-sm text-slate-600">Our admins will add previous Utsav photos here.</p>
        </div>
      )}

      {/* Scroll strip */}
      {!loading && memories.length > 0 && (
        <div className="relative mt-7">

          {/* Left arrow */}
          {canLeft && (
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-white text-lg text-orange-600 shadow-md hover:bg-orange-50 transition"
            >
              ‹
            </button>
          )}

          {/* Right arrow */}
          {canRight && (
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-white text-lg text-orange-600 shadow-md hover:bg-orange-50 transition"
            >
              ›
            </button>
          )}

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-3"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onMouseEnter={pauseAutoScroll}
            onMouseLeave={() => { pausedRef.current = false; }}
            onTouchStart={pauseAutoScroll}
          >
            {memories.map(memory => (
              <button
                key={memory.id}
                onClick={() => { pauseAutoScroll(); setSelected(memory); }}
                className="group relative h-64 w-44 flex-none overflow-hidden rounded-2xl border-2 border-orange-200 bg-orange-50 shadow-sm transition hover:border-orange-500 hover:shadow-lg hover:shadow-orange-100"
              >
                {failed.has(memory.id) ? (
                  <div className="grid h-full place-items-center p-4 text-center">
                    <span className="text-4xl">🚩</span>
                    <span className="mt-2 text-xs font-bold text-orange-700">Image unavailable</span>
                  </div>
                ) : (
                  <img
                    src={memory.imageUrl}
                    alt={`${memory.year} ${memory.title}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={() => markFailed(memory.id)}
                  />
                )}
                {/* Year pill */}
                <span className="absolute left-2 top-2 rounded-lg bg-orange-500/90 px-2.5 py-0.5 text-xs font-black text-white shadow">
                  {memory.year}
                </span>
                {/* Title fade */}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent px-3 pb-3 pt-8 text-xs font-bold text-white/90 truncate">
                  {memory.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.year} flashback`}
          onClick={() => setSelected(null)}
        >
          <button
            onClick={() => setSelected(null)}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 font-bold hover:bg-orange-50"
          >
            ✕
          </button>
          <div
            className="max-h-full max-w-3xl overflow-hidden rounded-2xl bg-black"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selected.imageUrl}
              alt={`${selected.year} ${selected.title}`}
              className="max-h-[78vh] w-auto object-contain"
              onError={() => markFailed(selected.id)}
            />
            <div className="bg-white px-4 py-3">
              <p className="font-bold text-slate-900">{selected.year} · {selected.title}</p>
              {selected.caption && <p className="mt-0.5 text-sm text-slate-500">{selected.caption}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
