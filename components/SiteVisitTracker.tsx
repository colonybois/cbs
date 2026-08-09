"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const sessionKey = "colony_bois_analytics_session";

export default function SiteVisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    let sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) { sessionId = crypto.randomUUID(); sessionStorage.setItem(sessionKey, sessionId); }
    void addDoc(collection(db, "site_visits"), { sessionId, path: pathname, createdAt: serverTimestamp() }).catch(() => undefined);
  }, [pathname]);
  return null;
}
