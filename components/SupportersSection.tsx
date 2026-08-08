"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Supporter = { id: string; residentName: string; showPublicName: boolean };

export default function SupportersSection() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, "online_donations"),
        where("status", "==", "approved")
      ),
      snap => {
        // filter showPublicName client-side to avoid composite index requirement
        setSupporters(
          snap.docs
            .map(d => ({ id: d.id, residentName: d.data().residentName as string, showPublicName: d.data().showPublicName as boolean }))
            .filter(d => d.showPublicName === true)
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  if (loading || supporters.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Community love</p>
      <h2 className="mt-2 text-3xl font-black text-slate-900">🙏 Our Supporters</h2>
      <p className="mt-3 text-slate-600">Thank you to everyone who supported Colony Bois Ganesh Utsav this year.</p>

      <div className="mt-7 flex flex-wrap gap-3">
        {supporters.map(s => (
          <div
            key={s.id}
            className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-3 shadow-sm shadow-orange-100/50"
          >
            <span className="text-lg">❤️</span>
            <span className="font-bold text-slate-900">{s.residentName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
