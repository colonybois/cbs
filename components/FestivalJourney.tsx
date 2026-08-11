"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
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
      <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Day by day</p>
      <h2 className="mt-2 text-3xl font-black text-slate-900">Festival Journey</h2>
      <p className="mt-3 text-slate-600">
        Every celebration, every moment — beautifully documented.
      </p>

      {/* Skeletons */}
      {loading && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-orange-100 h-72" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && days.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-10 text-center">
          <p className="text-4xl">🎪</p>
          <h3 className="mt-3 font-bold text-slate-900">Festival journey coming soon</h3>
          <p className="mt-2 text-sm text-slate-600">
            Daily updates will appear here during the celebrations.
          </p>
        </div>
      )}

      {/* Timeline cards */}
      {!loading && days.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => (
            <article
              key={day.id}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-lg hover:shadow-orange-100 ${day.featured ? "border-amber-400 ring-2 ring-amber-300/40" : "border-orange-100"}`}
            >
              {/* Featured badge */}
              {day.featured && (
                <span className="absolute left-3 top-3 z-10 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-black text-white shadow">
                  ★ Featured
                </span>
              )}

              {/* Cover */}
              <div className="relative h-48 overflow-hidden bg-orange-50">
                <img
                  src={day.coverImageUrl}
                  alt={day.heading}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {/* Day pill */}
                <span className="absolute bottom-3 left-3 rounded-xl bg-orange-500/90 px-3 py-1 text-xs font-black text-white shadow">
                  {day.dayLabel}
                </span>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                {day.eventDate && (
                  <p className="mb-2 text-xs font-semibold text-orange-500">
                    {new Date(day.eventDate).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
                <h3 className="font-black text-slate-900 leading-snug">{day.heading}</h3>
                {day.shortDesc && (
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">{day.shortDesc}</p>
                )}
                <Link
                  href={`/festival/${day.id}`}
                  className="mt-4 inline-flex items-center gap-1 self-start rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition"
                >
                  View More →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
