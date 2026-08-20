"use client";

import { useEffect, useState } from "react";
import { smoothScrollToTop } from "@/lib/smooth-scroll";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => smoothScrollToTop()}
      className="fixed bottom-3 right-3 z-[45] grid h-9 w-9 place-items-center rounded-full bg-[var(--gold)] text-primary-dark shadow-sm ring-1 ring-white/25 transition hover:bg-[var(--accent)] sm:bottom-4 sm:right-4"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <path
          d="M6 14.5 12 8.5 18 14.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
