"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ComityMember } from "@/types";

function MemberCard({ member }: { member: ComityMember }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <article className={`group relative flex w-56 flex-none flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-lg hover:shadow-orange-100/60 ${member.featured ? "border-amber-400 ring-2 ring-amber-300/30" : "border-orange-100"}`}>
      {member.featured && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black text-white shadow">★ Featured</span>
      )}

      {/* Photo */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
        {member.photoUrl && !imgErr ? (
          <img
            src={member.photoUrl}
            alt={member.fullName}
            loading="lazy"
            onError={() => setImgErr(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-4xl font-black text-white shadow-lg">
              {member.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        {/* Designation ribbon */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent px-3 pb-3 pt-8">
          <p className="text-xs font-black uppercase tracking-wider text-orange-300">{member.designation}</p>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-black text-slate-900 leading-snug">{member.fullName}</h3>
        {member.memberSince && (
          <p className="mt-1 text-xs text-slate-400">Member since {member.memberSince}</p>
        )}
        {member.bio && (
          <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-3">{member.bio}</p>
        )}
        {member.showContact && member.publicContact && (
          <p className="mt-3 text-xs font-semibold text-orange-600 truncate">📞 {member.publicContact}</p>
        )}
      </div>
    </article>
  );
}

export default function ComityMembersSection() {
  const [members, setMembers] = useState<ComityMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "comity_members"), orderBy("displayOrder", "asc")),
      snap => {
        setMembers(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() } as ComityMember))
            .filter(m => m.active && m.publicVisible)
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  if (!loading && members.length === 0) return null;

  // Featured first, then rest
  const featured = members.filter(m => m.featured);
  const rest = members.filter(m => !m.featured);
  const ordered = [...featured, ...rest];

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-widest text-orange-600">The team behind the celebration</p>
      <h2 className="mt-2 text-3xl font-black text-slate-900">Committee Management Rosters</h2>
      <p className="mt-3 text-slate-600">Meet the dedicated committee that organizes Colony Bois Ganesh Chaturthi every year.</p>

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
          className="mt-8 flex gap-5 overflow-x-auto pb-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {ordered.map(m => <MemberCard key={m.id} member={m} />)}
        </div>
      )}
    </div>
  );
}
