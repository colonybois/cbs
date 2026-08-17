"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { smoothScrollToId } from "@/lib/smooth-scroll";

export default function SmoothHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    const id = window.location.hash.replace(/^#/, "");
    if (!id) return;
    const frame = window.requestAnimationFrame(() => {
      window.setTimeout(() => smoothScrollToId(id), 60);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id) smoothScrollToId(id);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
