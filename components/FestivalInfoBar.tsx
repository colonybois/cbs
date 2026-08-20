"use client";

import type { ComponentType } from "react";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";
import { smoothScrollToId } from "@/lib/smooth-scroll";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 flex-none" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="#E5A51A" strokeWidth="1.6" />
      <path
        d="M8 3.5v3M16 3.5v3M3.5 10h17"
        stroke="#E5A51A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="7.5" y="13" width="3" height="3" rx="0.5" fill="#E5A51A" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 flex-none" fill="none" aria-hidden>
      <path
        d="M12 21s7-6.2 7-11.2A7 7 0 1 0 5 9.8C5 14.8 12 21 12 21z"
        stroke="#E5A51A"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="9.8" r="2.2" stroke="#E5A51A" strokeWidth="1.6" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 flex-none" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="#E5A51A" strokeWidth="1.6" />
      <circle cx="16.5" cy="9" r="2.3" stroke="#E5A51A" strokeWidth="1.6" />
      <path
        d="M3.6 19c.6-3.2 2.8-5 5.4-5s4.8 1.8 5.4 5M14 14.4c2.2.2 4 1.7 4.6 4.2"
        stroke="#E5A51A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartHandsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 flex-none" fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.3-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6C19 15.7 12 20 12 20z"
        stroke="#E5A51A"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type InfoItem = {
  label: string;
  detail: string;
  icon: ComponentType;
  onClick?: () => void;
  href?: string;
};

const items: InfoItem[] = [
  {
    label: "Festival Dates",
    detail: "Vinayaka Chavathi 2026",
    icon: CalendarIcon,
    onClick: () => smoothScrollToId("events"),
  },
  {
    label: "Location",
    detail: COLONY_BOIS_CONTACT.pandalLocation.title,
    icon: PinIcon,
    href: COLONY_BOIS_CONTACT.pandalLocation.mapsUrl,
  },
  {
    label: "Events",
    detail: "Poojas, cultural programs & ceremonies",
    icon: PeopleIcon,
    onClick: () => smoothScrollToId("events"),
  },
  {
    label: "Donate",
    detail: "Support the pandal with Chanda",
    icon: HeartHandsIcon,
    onClick: () => smoothScrollToId("donate"),
  },
];

export default function FestivalInfoBar() {
  return (
    <section className="relative overflow-hidden bg-[var(--primary-dark)]">
      <div className="mx-auto grid max-w-7xl sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[var(--gold)]/50">
        {items.map((item, index) => {
          const Icon = item.icon;
          const className = `flex w-full items-center gap-4 px-6 py-6 text-left transition hover:bg-[var(--primary)] sm:px-7 sm:py-8 ${
            index > 0 ? "border-t border-[var(--gold)]/30 sm:border-t-0" : ""
          } ${index >= 2 ? "sm:border-t sm:border-[var(--gold)]/30 lg:border-t-0" : ""} ${
            index % 2 === 1 ? "sm:border-l sm:border-[var(--gold)]/40 lg:border-l-0" : ""
          }`;
          const content = (
            <>
              <Icon />
              <span className="min-w-0">
                <span className="block font-cinzel text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                  {item.label}
                </span>
                <span className="mt-1 block text-sm text-[#FFF8E8]">{item.detail}</span>
              </span>
            </>
          );
          if (item.href) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                {content}
              </a>
            );
          }
          return (
            <button key={item.label} type="button" onClick={item.onClick} className={className}>
              {content}
            </button>
          );
        })}
      </div>
      <div className="info-bar-pattern h-3 w-full bg-[var(--primary-dark)]" aria-hidden />
    </section>
  );
}
