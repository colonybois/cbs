"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Category = "member" | "self";
type Donor = { donorName?: string; amount?: number };

export default function HighestDonorPlaque() {
  const [category, setCategory] = useState<Category>("member");
  const [donor, setDonor] = useState<Donor | null>(null);
  const [minimized, setMinimized] = useState(false);
  useEffect(() => onSnapshot(query(collection(db, "public_highest_donors"), where("category", "==", category), orderBy("amount", "desc"), limit(1)), snapshot => setDonor(snapshot.empty ? null : snapshot.docs[0].data() as Donor), () => setDonor(null)), [category]);
  if (minimized) return <button type="button" onClick={() => setMinimized(false)} className="fixed bottom-4 right-4 z-50 rounded-full border-2 border-amber-500 bg-amber-950 px-4 py-3 font-black text-amber-100 shadow-2xl hover:bg-amber-900">👑 Highest Donor</button>;
  return <aside className="fixed bottom-4 right-4 z-50 flex w-[360px] aspect-[4/3] flex-col overflow-hidden rounded-2xl border-4 border-amber-700 bg-amber-950 p-5 text-amber-100 shadow-2xl"><div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#d97706_1px,transparent_1px)] [background-size:10px_10px]"/><div className="relative flex items-center justify-between gap-2"><h2 className="text-base font-black tracking-wide text-amber-300">🚩 HIGHEST DONOR</h2><button type="button" onClick={() => setMinimized(true)} aria-label="Minimize highest donor plaque" className="rounded-full px-2 text-amber-200 hover:bg-amber-800">✕</button></div><div className="relative mt-3 grid grid-cols-2 gap-2 rounded-lg bg-black/20 p-1"><button type="button" onClick={() => setCategory("member")} className={`rounded-md px-3 py-1.5 text-sm font-bold ${category === "member" ? "bg-amber-500 text-amber-950" : "text-amber-100"}`}>🤝 Member</button><button type="button" onClick={() => setCategory("self")} className={`rounded-md px-3 py-1.5 text-sm font-bold ${category === "self" ? "bg-amber-500 text-amber-950" : "text-amber-100"}`}>🌐 Self</button></div><div className="relative flex flex-1 flex-col items-center justify-center text-center"><span className="text-4xl" aria-hidden="true">👑</span><p className="mt-2 text-xl font-black text-white">{donor?.donorName || "Awaiting first donor"}</p>{donor && <p className="mt-1 text-3xl font-black text-amber-400">₹{Number(donor.amount || 0).toLocaleString("en-IN")}</p>}</div><p className="relative text-center text-xs font-semibold leading-5 text-amber-200">✨ May divine blessings &amp; prosperity fill the homes of our generous patrons! ✨</p></aside>;
}
