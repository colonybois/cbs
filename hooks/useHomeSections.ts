"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const HOME_SECTION_IDS = [
  "hero",
  "about",
  "events",
  "gallery",
  "festival",
  "comity",
  "supporters",
  "donate",
  "contact",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export type HomeSectionsConfig = Record<HomeSectionId, boolean>;

export const defaultHomeSections: HomeSectionsConfig = {
  hero: true,
  about: true,
  events: true,
  gallery: true,
  festival: true,
  comity: true,
  supporters: true,
  donate: true,
  contact: true,
};

export const HOME_SECTION_META: {
  id: HomeSectionId;
  label: string;
  navLabel: string;
  description: string;
}[] = [
  {
    id: "hero",
    label: "Hero",
    navLabel: "Home",
    description: "Top banner and main call-to-action on the homepage.",
  },
  {
    id: "about",
    label: "Our Journey",
    navLabel: "About",
    description: "About / Our Journey story section.",
  },
  {
    id: "events",
    label: "Pandal Events",
    navLabel: "Events",
    description: "Festival schedule and event listings.",
  },
  {
    id: "gallery",
    label: "Utsav Flashback",
    navLabel: "Gallery",
    description: "Past celebration memories gallery.",
  },
  {
    id: "festival",
    label: "Festival Journey",
    navLabel: "Festival",
    description: "Day-by-day festival journey cards.",
  },
  {
    id: "comity",
    label: "Committee",
    navLabel: "Committee",
    description: "Committee management roster cards.",
  },
  {
    id: "supporters",
    label: "Supporters",
    navLabel: "Sponsors",
    description: "Public supporters / sponsors strip.",
  },
  {
    id: "donate",
    label: "Donate / Chanda",
    navLabel: "Donate",
    description: "Online contribution form and Donate button.",
  },
  {
    id: "contact",
    label: "Contact",
    navLabel: "Contact",
    description: "Talk to us, email, Instagram, and pandal location.",
  },
];

export function parseHomeSections(data: Record<string, unknown> | undefined): HomeSectionsConfig {
  const nested =
    data?.enabled && typeof data.enabled === "object"
      ? (data.enabled as Record<string, unknown>)
      : data;
  const next = { ...defaultHomeSections };
  for (const id of HOME_SECTION_IDS) {
    if (nested?.[id] === false) next[id] = false;
    if (nested?.[id] === true) next[id] = true;
  }
  return next;
}

export function toHomeSectionsPayload(sections: HomeSectionsConfig) {
  const payload: Record<string, boolean> = {};
  for (const id of HOME_SECTION_IDS) {
    payload[id] = sections[id] === true;
  }
  return payload;
}

export async function saveHomeSections(sections: HomeSectionsConfig) {
  await setDoc(doc(db, "site_settings", "home_sections"), {
    ...toHomeSectionsPayload(sections),
    updatedAt: new Date().toISOString(),
  });
}

export function useHomeSections() {
  const [sections, setSections] = useState<HomeSectionsConfig>(defaultHomeSections);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onSnapshot(
        doc(db, "site_settings", "home_sections"),
        (snapshot) => {
          setSections(parseHomeSections(snapshot.data() as Record<string, unknown> | undefined));
          setLoading(false);
        },
        () => setLoading(false),
      ),
    [],
  );

  const isEnabled = (id: HomeSectionId) => sections[id] === true;

  return { sections, loading, isEnabled };
}
