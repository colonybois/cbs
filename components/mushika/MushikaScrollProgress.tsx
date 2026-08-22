"use client";

import { useEffect, useState } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { MushikaCreature } from "./MushikaCreature";
import "./mushika.css";

/**
 * Mushika rides a bottom progress rail. Hidden when the footer is on screen
 * so he does not sit on top of copyright or the floating chat control.
 */
export function MushikaScrollProgress() {
  const { percent, running, facing } = useScrollProgress();
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    const footer = document.querySelector("[data-site-footer]");
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterInView(entry.isIntersecting),
      { threshold: 0.18 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (footerInView) return null;

  const travel = Math.min(percent, 88);

  return (
    <div
      className="mushika-scroll-companion pointer-events-none fixed inset-x-0 bottom-0 z-[40]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-hidden
    >
      <div className="relative h-px w-full bg-[#1c1210]/15">
        <div
          className="absolute inset-y-0 left-0 bg-[#e8b8bc]/80"
          style={{ width: `${travel}%` }}
        />
        <div
          className="absolute bottom-0.5 will-change-transform"
          style={{
            left: `${travel}%`,
            transform: `translate(-50%, 0) ${facing === "left" ? "scaleX(-1)" : ""}`,
          }}
        >
          <MushikaCreature
            running={running}
            idle={!running}
            className="h-auto w-8 drop-shadow-md sm:w-9"
          />
        </div>
      </div>
    </div>
  );
}
