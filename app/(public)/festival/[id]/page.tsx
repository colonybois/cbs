"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useParams } from "next/navigation";

type FestivalDay = {
  id: string;
  dayLabel: string;
  heading: string;
  shortDesc: string;
  detailedDesc: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  coverImageUrl: string;
  galleryUrls: string[];
  videoUrl?: string;
  featured: boolean;
  displayOrder: number;
  status: string;
};

export default function FestivalDayDetail() {
  const { id } = useParams<{ id: string }>();
  const [day, setDay] = useState<FestivalDay | null>(null);
  const [prev, setPrev] = useState<FestivalDay | null>(null);
  const [next, setNext] = useState<FestivalDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, "festival_days", id));
      if (!snap.exists()) {
        setLoading(false);
        return;
      }
      const current = { id: snap.id, ...snap.data() } as FestivalDay;
      setDay(current);

      // load siblings
      const all = await getDocs(
        query(collection(db, "festival_days"), orderBy("displayOrder", "asc")),
      );
      const list = all.docs
        .map((d) => ({ id: d.id, ...d.data() }) as FestivalDay)
        .filter((item) => item.status === "published");
      const idx = list.findIndex((d) => d.id === id);
      setPrev(idx > 0 ? list[idx - 1] : null);
      setNext(idx < list.length - 1 ? list[idx + 1] : null);
      setLoading(false);
    })();
  }, [id]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = day ? `${day.dayLabel} · ${day.heading} — Colony Bois Festival Journey` : "";

  if (loading)
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <div className="h-72 animate-pulse rounded-3xl bg-orange-100" />
        <div className="h-8 animate-pulse rounded-xl bg-orange-50 w-1/2" />
        <div className="h-4 animate-pulse rounded-xl bg-orange-50" />
      </div>
    );

  if (!day)
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <p className="text-4xl">🎪</p>
        <h1 className="mt-4 text-2xl font-black text-slateate-900">Day not found</h1>
        <Link
          href="/#gallery"
          className="mt-6 inline-block rounded-xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600"
        >
          Back to Festival Journey
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl py-6 space-y-8">
      {/* Back */}
      <Link
        href="/#festival"
        className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700"
      >
        ← Festival Journey
      </Link>

      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-200 shadow-xl shadow-orange-100/50">
        <img
          src={day.coverImageUrl}
          alt={day.heading}
          className="h-72 w-full object-cover sm:h-96"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <span className="rounded-xl bg-orange-500 px-3 py-1 text-sm font-black text-white shadow">
            {day.dayLabel}
          </span>
          {day.featured && (
            <span className="ml-2 rounded-xl bg-amber-400 px-3 py-1 text-sm font-black text-white shadow">
              ★ Featured
            </span>
          )}
          <h1 className="mt-3 text-2xl font-black text-white sm:text-4xl">{day.heading}</h1>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-sm">
        {day.eventDate && (
          <span className="flex items-center gap-1.5 rounded-xl bg-orange-50 border border-orange-200 px-4 py-2 font-semibold text-slate-700">
            📅{" "}
            {new Date(day.eventDate).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        )}
        {day.eventTime && (
          <span className="flex items-center gap-1.5 rounded-xl bg-orange-50 border border-orange-200 px-4 py-2 font-semibold text-slate-700">
            ⏰ {day.eventTime}
          </span>
        )}
        {day.location && (
          <span className="flex items-center gap-1.5 rounded-xl bg-orange-50 border border-orange-200 px-4 py-2 font-semibold text-slate-700">
            📍 {day.location}
          </span>
        )}
      </div>

      {/* Description */}
      {(day.shortDesc || day.detailedDesc) && (
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm space-y-3">
          {day.shortDesc && <p className="text-lg font-semibold text-slate-700">{day.shortDesc}</p>}
          {day.detailedDesc && (
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{day.detailedDesc}</p>
          )}
        </div>
      )}

      {/* Gallery */}
      {day.galleryUrls?.length > 0 && (
        <div>
          <h2 className="text-xl font-black text-slate-900 mb-4">Photo Gallery</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {day.galleryUrls.map((url, i) => (
              <button
                key={i}
                onClick={() => setLightbox(url)}
                className="group overflow-hidden rounded-2xl border border-orange-100 bg-orange-50"
              >
                <img
                  src={url}
                  alt={`Gallery ${i + 1}`}
                  loading="lazy"
                  className="h-36 w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video */}
      {day.videoUrl && (
        <div>
          <h2 className="text-xl font-black text-slate-900 mb-4">Video</h2>
          <div className="overflow-hidden rounded-2xl border border-orange-100 shadow-sm aspect-video">
            <iframe
              src={day.videoUrl}
              className="h-full w-full"
              allowFullScreen
              title={`${day.heading} video`}
            />
          </div>
        </div>
      )}

      {/* Share */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-bold text-slate-600">Share:</span>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600"
        >
          WhatsApp
        </a>
        <button
          onClick={() => navigator.clipboard.writeText(shareUrl)}
          className="rounded-xl border border-orange-300 px-4 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50"
        >
          Copy Link
        </button>
      </div>

      {/* Prev / Next */}
      <div className="grid gap-4 sm:grid-cols-2 border-t border-orange-100 pt-6">
        {prev ? (
          <Link
            href={`/festival/${prev.id}`}
            className="group flex items-center gap-3 rounded-2xl border border-orange-200 bg-white p-4 hover:border-orange-400 hover:shadow-md transition"
          >
            <span className="text-orange-400 text-xl">←</span>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Previous</p>
              <p className="font-bold text-slate-800 group-hover:text-orange-600">
                {prev.dayLabel} · {prev.heading}
              </p>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/festival/${next.id}`}
            className="group flex items-center justify-end gap-3 rounded-2xl border border-orange-200 bg-white p-4 hover:border-orange-400 hover:shadow-md transition"
          >
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-slate-400">Next</p>
              <p className="font-bold text-slate-800 group-hover:text-orange-600">
                {next.dayLabel} · {next.heading}
              </p>
            </div>
            <span className="text-orange-400 text-xl">→</span>
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Gallery lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 font-bold hover:bg-orange-50"
          >
            ✕
          </button>
          <img
            src={lightbox}
            alt="Gallery"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
