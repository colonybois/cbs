"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ComityMember } from "@/types";

function MemberCard({ member }: { member: ComityMember }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <article className="group relative w-56 flex-none text-center">
      {member.featured && (
        <span className="absolute left-1/2 top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black text-white shadow">
          ★ Featured
        </span>
      )}

      <div className="relative mx-auto flex h-44 w-44 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-100 via-amber-50 to-orange-200 p-1 transition duration-500 group-hover:scale-105">
        {member.photoUrl && !imgErr ? (
          <img
            src={member.photoUrl}
            alt={member.fullName}
            loading="lazy"
            onError={() => setImgErr(true)}
            className={`h-full w-full rounded-full border-4 border-white object-cover shadow-lg ${member.featured ? "ring-4 ring-amber-300/70" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-5xl font-black text-white shadow-lg">
            {member.fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="pt-4">
        <p className="text-xs font-black uppercase tracking-wider text-orange-600">
          {member.designation}
        </p>
        <h3 className="mt-1 font-black leading-snug text-slate-900">{member.fullName}</h3>
        {member.memberSince && (
          <p className="mt-1 text-xs text-slate-400">Member since {member.memberSince}</p>
        )}
        {member.bio && (
          <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-3">{member.bio}</p>
        )}
        {member.showContact && member.publicContact && (
          <p className="mt-3 text-xs font-semibold text-orange-600">📞 {member.publicContact}</p>
        )}
      </div>
    </article>
  );
}

export default function ComityMembersSection() {
  const [members, setMembers] = useState<ComityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "comity_members"), orderBy("displayOrder", "asc")),
      (snap) => {
        setMembers(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as ComityMember)
            .filter((m) => m.active && m.publicVisible),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  // Featured first, then rest
  const featured = members.filter((m) => m.featured);
  const rest = members.filter((m) => !m.featured);
  const ordered = [...featured, ...rest];

  useEffect(() => {
    const element = scrollRef.current;
    if (
      !element ||
      ordered.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const elapsed = now - previous;
      previous = now;
      if (!pausedRef.current && !document.hidden && element.scrollWidth > element.clientWidth) {
        const next = element.scrollLeft + elapsed * 0.035;
        element.scrollLeft = next >= element.scrollWidth - element.clientWidth - 1 ? 0 : next;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(pauseTimerRef.current);
    };
  }, [ordered.length]);

  const pauseAutoScroll = () => {
    pausedRef.current = true;
    clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 2500);
  };
  const holdAutoScroll = () => {
    clearTimeout(pauseTimerRef.current);
    pausedRef.current = true;
  };
  const resumeAutoScroll = () => {
    clearTimeout(pauseTimerRef.current);
    pausedRef.current = false;
  };

  if (!loading && members.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
        The team behind the celebration
      </p>
      <h2 className="mt-2 text-3xl font-black text-slate-900">Committee Management Rosters</h2>
      <p className="mt-3 text-slate-600">
        Meet the dedicated committee that organizes Colony Bois Ganesh Chaturthi every year.
      </p>

      {/* Skeletons */}
      {loading && (
        <div className="mt-8 flex gap-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 w-56 flex-none animate-pulse rounded-2xl bg-orange-100" />
          ))}
        </div>
      )}

      {/* Cards — horizontal scroll */}
      {!loading && ordered.length > 0 && (
        <div
          ref={scrollRef}
          className="mt-8 flex gap-5 overflow-x-auto pb-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onFocus={holdAutoScroll}
          onBlur={resumeAutoScroll}
          onMouseEnter={holdAutoScroll}
          onMouseLeave={resumeAutoScroll}
          onPointerDown={pauseAutoScroll}
          onTouchStart={pauseAutoScroll}
          onWheel={pauseAutoScroll}
        >
          {ordered.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}
