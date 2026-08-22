"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import ScrollReveal from "@/components/ScrollReveal";
import SectionHeading from "@/components/SectionHeading";
import { db } from "@/lib/firebase";
import type { ComityMember } from "@/types";

const INITIAL_VISIBLE = 5;

function MemberPlate({ member, featured = false }: { member: ComityMember; featured?: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  const photoSize = featured
    ? "h-[8.75rem] w-[8.75rem] sm:h-40 sm:w-40"
    : "h-[6.75rem] w-[6.75rem]";

  return (
    <article className={`relative text-center ${featured ? "pt-[4.75rem] sm:pt-[5.25rem]" : "pt-14"}`}>
      <div
        className={`absolute left-1/2 top-0 z-10 -translate-x-1/2 ${photoSize} overflow-hidden rounded-full bg-navy/10 p-[3px]`}
      >
        {member.photoUrl && !imgErr ? (
          <img
            src={member.photoUrl}
            alt={member.fullName}
            loading="lazy"
            onError={() => setImgErr(true)}
            className="h-full w-full rounded-full border-[3px] border-white object-cover transition duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-primary font-display text-3xl text-on-primary">
            {member.fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div
        className={`rounded-[1.75rem] bg-white px-4 pb-5 shadow-sm ring-1 ring-[#c9a8ae] ${
          featured ? "pt-[5.25rem] sm:px-8 sm:pt-[5.75rem]" : "pt-[4.15rem]"
        }`}
      >
        {featured && (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            Featured
          </p>
        )}
        <p className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-[11px]">
          {member.designation}
        </p>
        <h3
          className={`mt-2 font-display font-semibold leading-snug tracking-tight text-ink ${
            featured ? "text-[1.65rem] sm:text-3xl" : "text-lg sm:text-xl"
          }`}
        >
          {member.fullName}
        </h3>
        {member.memberSince && (
          <p className="section-note mt-1.5 tracking-wide">Since {member.memberSince}</p>
        )}
        {member.bio && (
          <p className="section-note mx-auto mt-2.5 max-w-[16rem] line-clamp-3">{member.bio}</p>
        )}
        {member.showContact && member.publicContact && (
          <a
            href={`tel:${member.publicContact}`}
            className="mt-3 inline-block text-xs font-semibold text-primary"
          >
            {member.publicContact}
          </a>
        )}
      </div>
    </article>
  );
}

function MemberCard({
  member,
  featured = false,
  delay = 0,
}: {
  member: ComityMember;
  featured?: boolean;
  delay?: number;
}) {
  return (
    <ScrollReveal variant="right" delay={delay}>
      <MemberPlate member={member} featured={featured} />
    </ScrollReveal>
  );
}

export default function ComityMembersSection() {
  const [members, setMembers] = useState<ComityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [motionKey, setMotionKey] = useState(0);

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

  const featured = members.filter((m) => m.featured);
  const rest = members.filter((m) => !m.featured);
  const ordered = [...featured, ...rest];
  const visibleMembers =
    expanded || ordered.length <= INITIAL_VISIBLE ? ordered : ordered.slice(0, INITIAL_VISIBLE);
  const visibleFeatured = visibleMembers.filter((m) => m.featured);
  const visibleRest = visibleMembers.filter((m) => !m.featured);
  const canToggle = ordered.length > INITIAL_VISIBLE;

  const expandRoster = () => {
    setExpanded(true);
    setMotionKey((key) => key + 1);
  };

  const collapseRoster = () => {
    setExpanded(false);
    setMotionKey((key) => key + 1);
    document.getElementById("comity")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!loading && members.length === 0) return null;

  return (
    <div>
      <SectionHeading
        kicker="The team behind the celebration"
        title="Committee Management Rosters"
        symbol="ॐ"
        tone="navy"
        lede="Meet the dedicated committee that organizes Colony Bois Ganesh Chaturthi every year."
      />

      {loading && (
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="pt-14">
              <div className="mx-auto h-[6.75rem] w-[6.75rem] animate-pulse rounded-full bg-white" />
              <div className="mt-[-2.4rem] h-36 animate-pulse rounded-[1.75rem] bg-white" />
            </div>
          ))}
        </div>
      )}

      {!loading && visibleFeatured.length > 0 && (
        <div
          className={`mt-12 grid gap-x-6 gap-y-4 ${
            visibleFeatured.length === 1 ? "mx-auto max-w-md" : "sm:grid-cols-2"
          }`}
        >
          {visibleFeatured.map((member, index) => (
            <MemberCard
              key={`${member.id}-${motionKey}`}
              member={member}
              featured
              delay={index * 70}
            />
          ))}
        </div>
      )}

      {!loading && visibleRest.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-6 sm:gap-y-4 lg:grid-cols-3">
          {visibleRest.map((member, index) => {
            const globalIndex = visibleFeatured.length + index;
            return (
              <MemberCard
                key={`${member.id}-${motionKey}`}
                member={member}
                delay={globalIndex * 70}
              />
            );
          })}
        </div>
      )}

      {!loading && canToggle && (
        <div className="mt-8 flex justify-center">
          {expanded ? (
            <button type="button" onClick={collapseRoster} className="btn-festive px-6 py-2.5 text-xs uppercase">
              View Less
            </button>
          ) : (
            <button type="button" onClick={expandRoster} className="btn-festive px-6 py-2.5 text-xs uppercase">
              View More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
