"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { recordSiteAnalyticsEvent } from "@/lib/site-analytics";

const trackedSections = {
  hero: "Home",
  events: "Events",
  gallery: "Gallery & Flashback",
  festival: "Festival Journey",
  comity: "Committee Management Rosters",
  supporters: "Supporters",
  donate: "Chanda / Contribution",
  about: "About Us",
  contact: "Contact",
} as const;

export default function SiteVisitTracker() {
  const pathname = usePathname();
  const { uid, name, role, signedIn, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    void recordSiteAnalyticsEvent(
      { eventType: "page_view", path: pathname, source: "route_change" },
      { uid, name, role, signedIn },
    );
  }, [loading, name, pathname, role, signedIn, uid]);

  useEffect(() => {
    if (loading || typeof IntersectionObserver === "undefined") return;
    const elements = Object.keys(trackedSections)
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (elements.length === 0) return;

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.45) return;
          const sectionId = entry.target.id as keyof typeof trackedSections;
          const key = `${pathname}:${sectionId}`;
          if (seen.has(key)) return;
          seen.add(key);
          void recordSiteAnalyticsEvent(
            {
              eventType: "section_view",
              path: pathname,
              sectionId,
              sectionLabel: trackedSections[sectionId],
              source: "section_visibility",
            },
            { uid, name, role, signedIn },
          );
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -15% 0px", threshold: [0.45, 0.7] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [loading, name, pathname, role, signedIn, uid]);

  return null;
}
