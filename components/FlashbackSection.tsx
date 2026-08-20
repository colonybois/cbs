"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import SectionHeading from "@/components/SectionHeading";
import { db } from "@/lib/firebase";

type Flashback = {
  id: string;
  title: string;
  year: number;
  imageUrl: string;
  caption?: string;
  relatedEvent?: string;
  credit?: string;
  featured?: boolean;
  status?: "published" | "hidden";
};

const SLIDE_MS = 5000;
const RESUME_MS = 8000;
const SWIPE_PX = 56;
const CARD_CLASS =
  "w-full flex-none snap-center sm:w-[min(28rem,calc(100vw-3rem))]";
const CARD_SHELL =
  "flex flex-col overflow-hidden bg-white rounded-none border-0 shadow-none sm:rounded-2xl sm:border sm:border-zinc-200 sm:shadow-temple";

export default function FlashbackSection() {
  const [memories, setMemories] = useState<Flashback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Flashback | null>(null);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout>>();
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const publishedMemories = memories.filter((memory) => memory.status !== "hidden");
  const years = [...new Set(publishedMemories.map((memory) => memory.year))].sort((a, b) => b - a);
  const visibleMemories = publishedMemories.filter(
    (memory) => selectedYear === "all" || memory.year === selectedYear,
  );
  const selectedIndex = selected
    ? visibleMemories.findIndex((memory) => memory.id === selected.id)
    : -1;
  const moveSelected = (direction: -1 | 1) => {
    if (selectedIndex < 0 || visibleMemories.length < 2) return;
    setSelected(
      visibleMemories[
        (selectedIndex + direction + visibleMemories.length) % visibleMemories.length
      ],
    );
  };

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "flashback"), orderBy("year", "desc")),
      (snap) => {
        setMemories(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Flashback));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const scrollToIndex = (index: number, smooth = true) => {
    const el = scrollRef.current;
    const card = el?.children[index] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft, behavior: smooth ? "smooth" : "auto" });
    setActiveIndex(index);
  };

  const pauseAutoScroll = () => {
    pausedRef.current = true;
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_MS);
  };

  useEffect(() => {
    setActiveIndex(0);
    const el = scrollRef.current;
    if (el) el.scrollTo({ left: 0, behavior: "auto" });
  }, [selectedYear, visibleMemories.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      if (!cards.length) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let nearest = 0;
      let best = Infinity;
      cards.forEach((card, index) => {
        const center = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < best) {
          best = dist;
          nearest = index;
        }
      });
      setActiveIndex(nearest);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [visibleMemories]);

  useEffect(() => {
    if (visibleMemories.length < 2 || selected) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const tick = () => {
      if (pausedRef.current || document.hidden) return;
      const next = (activeIndex + 1) % visibleMemories.length;
      scrollToIndex(next);
    };

    const id = window.setInterval(tick, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [visibleMemories.length, activeIndex, selected]);

  const markFailed = (id: string) => setFailed((prev) => new Set([...prev, id]));

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft") moveSelected(-1);
      if (event.key === "ArrowRight") moveSelected(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, selectedIndex, visibleMemories.length]);

  return (
    <div>
      <SectionHeading
        kicker="Past celebrations & memories"
        title="Utsav Flashback"
        symbol="ॐ"
        tone="gold"
        lede="A live collection of Colony Bois pandal themes, devotion, and beautiful memories."
      />
      {!loading && years.length > 0 && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setSelectedYear("all")}
            className={`flex-none rounded-full px-3.5 py-1.5 text-sm font-bold ${selectedYear === "all" ? "bg-primary text-on-primary shadow-sm" : "bg-white text-ink ring-1 ring-navy/10"}`}
          >
            All
          </button>
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`flex-none rounded-full px-3.5 py-1.5 text-sm font-bold ${selectedYear === year ? "bg-primary text-on-primary shadow-sm" : "bg-white text-ink ring-1 ring-navy/10"}`}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-7 -mx-4 overflow-hidden sm:mx-0">
          <div className={`${CARD_SHELL} ${CARD_CLASS} mx-auto`}>
            <div className="aspect-square animate-pulse bg-navy/5" />
            <div className="space-y-3 p-5">
              <div className="h-7 w-20 animate-pulse rounded bg-navy/5" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-navy/5" />
            </div>
          </div>
        </div>
      )}

      {!loading && publishedMemories.length === 0 && (
        <div className="mt-7 rounded-2xl border border-dashed border-navy/15 bg-white p-10 text-center">
          <div className="text-4xl">📸</div>
          <h3 className="mt-3 font-display text-xl font-semibold text-ink">Memories are coming soon</h3>
          <p className="section-note mx-auto mt-2 max-w-sm">
            Our admins will add previous Utsav photos here.
          </p>
        </div>
      )}

      {!loading && visibleMemories.length > 0 && (
        <div className="relative mt-6 -mx-4 sm:mx-0">
          <button
            onClick={() => {
              pauseAutoScroll();
              scrollToIndex(
                (activeIndex - 1 + visibleMemories.length) % visibleMemories.length,
              );
            }}
            aria-label="Previous memory"
            className="absolute -left-2 top-[42%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg text-ink shadow-sm md:grid"
          >
            ‹
          </button>
          <button
            onClick={() => {
              pauseAutoScroll();
              scrollToIndex((activeIndex + 1) % visibleMemories.length);
            }}
            aria-label="Next memory"
            className="absolute -right-2 top-[42%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg text-ink shadow-sm md:grid"
          >
            ›
          </button>

          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
            onMouseEnter={pauseAutoScroll}
            onPointerDown={pauseAutoScroll}
            onTouchStart={pauseAutoScroll}
          >
            {visibleMemories.map((memory) => (
              <article
                key={memory.id}
                className={`${CARD_SHELL} ${CARD_CLASS}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    pauseAutoScroll();
                    setSelected(memory);
                  }}
                  className="relative aspect-square w-full overflow-hidden bg-navy/5 text-left"
                >
                  {failed.has(memory.id) ? (
                    <div className="grid h-full place-items-center p-4 text-center">
                      <span className="text-4xl">🚩</span>
                      <span className="mt-2 text-xs font-bold text-primary">Image unavailable</span>
                    </div>
                  ) : (
                    <img
                      src={memory.imageUrl}
                      alt={`${memory.year} ${memory.title}`}
                      className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                      onError={() => markFailed(memory.id)}
                    />
                  )}
                </button>

                <div className="flex flex-1 flex-col border-t border-navy/5 px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5 sm:pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-[1.65rem] font-semibold leading-none tracking-tight text-primary sm:text-2xl">
                      {memory.year}
                    </p>
                    {memory.featured && (
                      <span className="rounded-full bg-secondary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-saffron-800">
                        Featured
                      </span>
                    )}
                  </div>
                  {memory.relatedEvent && (
                    <p className="mt-1.5 text-xs font-medium text-[var(--text-light)]">
                      {memory.relatedEvent}
                    </p>
                  )}
                  <h3 className="mt-2 font-display text-[15px] font-semibold leading-snug text-[var(--text-muted)] sm:text-base">
                    {memory.title}
                  </h3>
                  {(memory.caption || memory.credit) && (
                    <p className="section-note mt-1 line-clamp-2">
                      {memory.caption || (memory.credit ? `Photo: ${memory.credit}` : "")}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      pauseAutoScroll();
                      setSelected(memory);
                    }}
                    className="btn-festive mt-3.5 w-full py-2.5 text-[11px] sm:mt-4"
                  >
                    View memory
                  </button>
                </div>
              </article>
            ))}
          </div>

          {visibleMemories.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {visibleMemories.map((memory, index) => (
                <button
                  key={memory.id}
                  aria-label={`Show ${memory.title}`}
                  onClick={() => {
                    pauseAutoScroll();
                    scrollToIndex(index);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-navy/20"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[80] flex h-[100dvh] flex-col bg-zinc-950"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.year} ${selected.title}`}
        >
          <div
            className="flex items-center justify-between gap-3 px-4 pb-2"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold leading-none text-secondary">
                {selected.year}
              </p>
              {visibleMemories.length > 1 && selectedIndex >= 0 && (
                <p className="mt-1 text-[11px] font-medium text-white/55">
                  {selectedIndex + 1} / {visibleMemories.length}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="grid h-10 w-10 flex-none place-items-center rounded-full bg-white text-lg font-bold text-ink"
            >
              ✕
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-3"
            onTouchStart={(event) => {
              swipeRef.current = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
              };
            }}
            onTouchEnd={(event) => {
              if (!swipeRef.current) return;
              const dx = event.changedTouches[0].clientX - swipeRef.current.x;
              const dy = event.changedTouches[0].clientY - swipeRef.current.y;
              swipeRef.current = null;
              if (Math.abs(dy) > Math.abs(dx) && dy > SWIPE_PX) {
                setSelected(null);
                return;
              }
              if (Math.abs(dx) > SWIPE_PX) moveSelected(dx < 0 ? 1 : -1);
            }}
          >
            {visibleMemories.length > 1 && (
              <>
                <button
                  onClick={() => moveSelected(-1)}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-ink shadow-sm"
                >
                  ‹
                </button>
                <button
                  onClick={() => moveSelected(1)}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-ink shadow-sm"
                >
                  ›
                </button>
              </>
            )}
            {failed.has(selected.id) ? (
              <p className="px-6 text-center text-sm text-white/70">Image unavailable</p>
            ) : (
              <img
                src={selected.imageUrl}
                alt={`${selected.year} ${selected.title}`}
                className="h-full w-full object-contain"
                onError={() => markFailed(selected.id)}
              />
            )}
          </div>

          <div
            className="bg-white px-5 pt-4"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <h3 className="font-display text-lg font-semibold leading-snug text-ink">
              {selected.title}
            </h3>
            {selected.caption && (
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{selected.caption}</p>
            )}
            {(selected.relatedEvent || selected.credit) && (
              <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-[var(--text-light)]">
                {selected.relatedEvent && <span>{selected.relatedEvent}</span>}
                {selected.credit && <span>Credit: {selected.credit}</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
