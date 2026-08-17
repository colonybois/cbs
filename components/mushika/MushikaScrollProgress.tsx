"use client";

import { useScrollProgress } from "@/hooks/useScrollProgress";
import { MushikaCreature } from "./MushikaCreature";
import "./mushika.css";

/**
 * Mushika rides a bottom progress rail. As you scroll down he runs right;
 * as you scroll up he turns and runs left. He idles when scrolling stops.
 */
export function MushikaScrollProgress() {
  const { percent, running, facing } = useScrollProgress();

  return (
    <div
      className="mushika-scroll-companion pointer-events-none fixed inset-x-0 bottom-0 z-[40]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-hidden
    >
      <div className="relative h-1.5 w-full bg-[#1c1210]/20">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ff7a00] to-[#d4a017]"
          style={{ width: `${percent}%` }}
        />
        <div
          className="absolute bottom-1 will-change-transform"
          style={{
            left: `${percent}%`,
            transform: `translate(-50%, 0) ${facing === "left" ? "scaleX(-1)" : ""}`,
          }}
        >
          <MushikaCreature
            running={running}
            idle={!running}
            className="h-auto w-11 drop-shadow-md sm:w-12"
          />
        </div>
      </div>
    </div>
  );
}
