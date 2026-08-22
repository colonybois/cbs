"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import ScrollReveal from "@/components/ScrollReveal";
import SectionHeading from "@/components/SectionHeading";
import { db } from "@/lib/firebase";
import Link from "next/link";

type FestivalDay = {
  id: string;
  dayLabel: string;
  heading: string;
  shortDesc: string;
  eventDate: string;
  coverImageUrl: string;
  featured: boolean;
  status: string;
  displayOrder: number;
};

function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function FestivalJourney() {
  const [days, setDays] = useState<FestivalDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "festival_days"), orderBy("displayOrder", "asc")),
      (snap) => {
        setDays(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as FestivalDay)
            .filter((day) => day.status === "published"),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  return (
    <div>
      <SectionHeading
        kicker="Day by day"
        title="Festival Journey"
        symbol="॥"
        tone="primary"
        lede="Every celebration, every moment — beautifully documented."
      />

      {loading && (
        <div className="mt-8 -mx-4 grid gap-6 sm:mx-0 lg:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden bg-white sm:rounded-2xl sm:border sm:border-zinc-200"
            >
              <div className="aspect-square animate-pulse bg-navy/5" />
              <div className="space-y-3 p-5">
                <div className="h-7 w-28 animate-pulse rounded bg-navy/5" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-navy/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && days.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-saffron-200 bg-white p-10 text-center">
          <p className="text-4xl">🎪</p>
          <h3 className="mt-3 font-bold text-ink">Festival journey coming soon</h3>
          <p className="section-note mx-auto mt-2 max-w-sm">
            Daily updates will appear here during the celebrations.
          </p>
        </div>
      )}

      {!loading && days.length > 0 && (
        <div className="mt-8 -mx-4 grid gap-6 sm:mx-0 lg:grid-cols-2">
          {days.map((day, index) => (
            <ScrollReveal
              key={day.id}
              as="article"
              variant="image"
              delay={index * 80}
              className={`group home-card flex flex-col overflow-hidden bg-white sm:rounded-2xl sm:border sm:shadow-temple ${
                day.featured
                  ? "sm:border-saffron-400 sm:ring-2 sm:ring-saffron-200/50"
                  : "sm:border-zinc-200"
              }`}
            >
              <div className="home-media relative aspect-square overflow-hidden bg-navy/5">
                <img
                  src={day.coverImageUrl}
                  alt={day.heading}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col border-t border-navy/5 px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5 sm:pt-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-[1.65rem] font-semibold leading-none tracking-tight text-primary sm:text-2xl">
                    {day.dayLabel}
                  </h3>
                  {day.featured && (
                    <span className="rounded-full bg-secondary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-saffron-800">
                      Featured
                    </span>
                  )}
                </div>
                {day.eventDate && (
                  <p className="mt-1.5 text-xs font-medium text-[var(--text-light)]">
                    {formatEventDate(day.eventDate)}
                  </p>
                )}
                <p className="mt-2 font-display text-base font-semibold leading-snug text-[var(--text-muted)]">
                  {day.heading}
                </p>
                {day.shortDesc && (
                  <p className="section-note mt-1.5 line-clamp-2">{day.shortDesc}</p>
                )}
                <Link
                  href={`/festival/${day.id}`}
                  className="btn-festive mt-3.5 w-full py-2.5 text-[11px] sm:mt-4"
                >
                  View the day
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}
