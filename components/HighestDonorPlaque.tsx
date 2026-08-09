"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Donor = { donorName?: string; amount?: number };

export default function HighestDonorPlaque() {
  const [donor, setDonor] = useState<Donor | null>(null);
  const [minimized, setMinimized] = useState(false);
  useEffect(() => onSnapshot(query(collection(db, "public_highest_donors"), orderBy("amount", "desc"), limit(1)), snapshot => setDonor(snapshot.empty ? null : snapshot.docs[0].data() as Donor), () => setDonor(null)), []);
  if (minimized) return <button type="button" onClick={() => setMinimized(false)} className="fixed bottom-4 right-4 z-50 rounded-full border-2 border-orange-400 bg-white px-4 py-3 font-black text-orange-700 shadow-xl transition hover:bg-orange-50">👑 Highest Donor</button>;
  return <aside className="fixed bottom-4 right-4 z-50 flex w-[360px] aspect-[4/3] flex-col overflow-hidden rounded-2xl border-2 border-orange-300 bg-white p-5 shadow-2xl"><div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#fed7aa_1px,transparent_1px)] [background-size:12px_12px]"/><div className="relative flex items-center justify-between"><h2 className="text-base font-black tracking-wide text-orange-600">🚩 HIGHEST DONOR</h2><button type="button" onClick={() => setMinimized(true)} aria-label="Minimize highest donor plaque" className="rounded-full px-2 text-slate-500 transition hover:bg-orange-50 hover:text-orange-700">✕</button></div><div className="relative flex flex-1 flex-col items-center justify-center text-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-orange-100 text-3xl ring-4 ring-orange-50" aria-hidden="true">👑</span><p className="mt-4 text-xl font-black text-slate-900">{donor?.donorName || "Awaiting first donor"}</p>{donor && <p className="mt-1 text-3xl font-black text-orange-600">₹{Number(donor.amount || 0).toLocaleString("en-IN")}</p>}</div><p className="relative rounded-xl bg-orange-50 px-3 py-2 text-center text-xs font-semibold leading-5 text-orange-800">✨ May divine blessings &amp; prosperity fill the homes of our generous patrons! ✨</p></aside>;
}
