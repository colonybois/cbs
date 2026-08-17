"use client";

import { useEffect, useRef, useState } from "react";

export type ScrollFacing = "left" | "right";

const IDLE_DELAY_MS = 200;

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [running, setRunning] = useState(false);
  const [facing, setFacing] = useState<ScrollFacing>("right");

  const lastScrollTopRef = useRef(0);
  const idleTimerRef = useRef(0);
  const rafRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const update = () => {
      tickingRef.current = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const next = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      setProgress(next);
      setScrolled(scrollTop > 12);

      const delta = scrollTop - lastScrollTopRef.current;
      lastScrollTopRef.current = scrollTop;
      if (Math.abs(delta) > 1) setFacing(delta > 0 ? "right" : "left");

      setRunning(true);
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => setRunning(false), IDLE_DELAY_MS);
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearTimeout(idleTimerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { progress, percent: progress * 100, scrolled, running, facing };
}
