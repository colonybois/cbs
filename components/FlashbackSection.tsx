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
const CARD_CLASS =
  "w-full flex-none snap-center sm:w-[min(28rem,calc(100vw-3rem))]";
const CARD_SHELL =
  "flex flex-col overflow-hidden rounded-none border border-zinc-200 bg-white sm:rounded-2xl sm:shadow-temple";

export default function FlashbackSection() {
  const [memories, setMemories] = useState<Flashback[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout>>();
  const publishedMemories = memories.filter((memory) => memory.status !== "hidden");
  const years = [...new Set(publishedMemories.map((memory) => memory.year))].sort((a, b) => b - a);
  const visibleMemories = publishedMemories.filter(
    (memory) => selectedYear === "all" || memory.year === selectedYear,
  );

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
    if (visibleMemories.length < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const tick = () => {
      if (pausedRef.current || document.hidden) return;
      const next = (activeIndex + 1) % visibleMemories.length;
      scrollToIndex(next);
    };

    const id = window.setInterval(tick, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [visibleMemories.length, activeIndex]);

  const markFailed = (id: string) => setFailed((prev) => new Set([...prev, id]));

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
          <div className={`${CARD_SHELL} ${CARD_CLASS}`}>
            <div className="aspect-square animate-pulse bg-navy/5" />
            <div className="space-y-2 border-t border-zinc-100 px-5 py-4 text-center">
              <div className="mx-auto h-7 w-16 animate-pulse rounded bg-navy/5" />
              <div className="mx-auto h-4 w-2/3 animate-pulse rounded bg-navy/5" />
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
            className="flex touch-pan-x snap-x snap-mandatory gap-0 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
            onMouseEnter={pauseAutoScroll}
            onPointerDown={pauseAutoScroll}
            onTouchStart={pauseAutoScroll}
          >
            {visibleMemories.map((memory, index) => (
              <article
                key={memory.id}
                className={`${CARD_SHELL} ${CARD_CLASS} pointer-events-none select-none`}
              >
                <div className="relative flex w-full flex-col overflow-hidden">
                  <div className="relative aspect-square w-full overflow-hidden bg-navy/5">
                    {failed.has(memory.id) ? (
                      <div className="grid h-full place-items-center p-4 text-center">
                        <span className="text-4xl">🚩</span>
                        <span className="mt-2 text-xs font-bold text-primary">Image unavailable</span>
                      </div>
                    ) : (
                      <img
                        src={memory.imageUrl}
                        alt={`${memory.year} ${memory.title}`}
                        draggable={false}
                        className="h-full w-full object-cover"
                        onError={() => markFailed(memory.id)}
                      />
                    )}
                    {memory.featured && (
                      <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-saffron-800 shadow-sm">
                        Featured
                      </span>
                    )}
                  </div>

                  <div
                    key={`${memory.id}-${index === activeIndex ? activeIndex : "idle"}`}
                    className={`flashback-caption border-t border-zinc-100 bg-white px-4 py-4 text-center sm:px-5 sm:py-5 ${
                      index === activeIndex ? "is-active" : ""
                    }`}
                  >
                    <p className="flashback-year font-display text-[1.75rem] font-semibold leading-none tracking-tight text-primary sm:text-[1.85rem]">
                      {memory.year}
                    </p>
                    <div
                      className="flashback-rule mx-auto mt-2.5 h-px w-10 bg-secondary/80"
                      aria-hidden
                    />
                    <h3 className="flashback-title mt-2.5 font-display text-[15px] font-semibold leading-snug text-ink sm:text-base">
                      {memory.title}
                    </h3>
                    {memory.relatedEvent && (
                      <p className="flashback-meta mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-light)]">
                        {memory.relatedEvent}
                      </p>
                    )}
                    {(memory.caption || memory.credit) && (
                      <p className="flashback-meta section-note mt-2 line-clamp-2">
                        {memory.caption || (memory.credit ? `Photo: ${memory.credit}` : "")}
                      </p>
                    )}
                  </div>
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
    </div>
  );
}
