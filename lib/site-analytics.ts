"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserRole } from "@/types";

const visitorKey = "colony_bois_analytics_visitor";
const sessionKey = "colony_bois_analytics_session";

export type SiteAnalyticsEventType = "page_view" | "menu_click" | "section_view" | "external_click";

export type SiteAnalyticsVisitor = {
  uid?: string;
  name?: string;
  role?: UserRole;
  signedIn?: boolean;
};

export type SiteAnalyticsEvent = {
  eventType: SiteAnalyticsEventType;
  path?: string;
  menuLabel?: string;
  menuTarget?: string;
  sectionId?: string;
  sectionLabel?: string;
  source?: string;
};

function getOrCreateId(storage: Storage, key: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  storage.setItem(key, next);
  return next;
}

function analyticsIds() {
  try {
    return {
      visitorId: getOrCreateId(window.localStorage, visitorKey),
      sessionId: getOrCreateId(window.sessionStorage, sessionKey),
    };
  } catch {
    const fallback = crypto.randomUUID();
    return { visitorId: fallback, sessionId: fallback };
  }
}

function deviceType() {
  const width = window.innerWidth;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function referrerHost() {
  if (!document.referrer) return "";
  try {
    return new URL(document.referrer).host;
  } catch {
    return "";
  }
}

export function recordSiteAnalyticsEvent(
  event: SiteAnalyticsEvent,
  visitor?: SiteAnalyticsVisitor,
) {
  if (typeof window === "undefined") return Promise.resolve();

  const { visitorId, sessionId } = analyticsIds();
  const isAuthenticated = visitor?.signedIn === true && Boolean(visitor.uid);
  const payload: Record<string, unknown> = {
    eventType: event.eventType,
    visitorId,
    sessionId,
    path: event.path || `${window.location.pathname}${window.location.search}`,
    isAuthenticated,
    deviceType: deviceType(),
    language: navigator.language || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    referrerHost: referrerHost(),
    createdAt: serverTimestamp(),
  };

  if (event.menuLabel) payload.menuLabel = event.menuLabel;
  if (event.menuTarget) payload.menuTarget = event.menuTarget;
  if (event.sectionId) payload.sectionId = event.sectionId;
  if (event.sectionLabel) payload.sectionLabel = event.sectionLabel;
  if (event.source) payload.source = event.source;
  if (isAuthenticated) {
    payload.visitorUid = visitor?.uid;
    payload.visitorName = visitor?.name || "Signed-in user";
    payload.visitorRole = visitor?.role || "member";
  }

  return addDoc(collection(db, "site_visits"), payload).catch(() => undefined);
}
