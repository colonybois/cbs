"use client";

import { useEffect, useState } from "react";
import { smoothScrollToTop } from "@/lib/smooth-scroll";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 360);
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
      className="fixed bottom-[max(3.65rem,calc(env(safe-area-inset-bottom)+3.35rem))] right-4 z-[45] grid h-12 w-12 place-items-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-lg font-bold text-orange-50 shadow-temple md:right-6"
    >
      ↑
    </button>
  );
}
