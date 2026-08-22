"use client";

import { useEffect, useRef, useState } from "react";

type SectionTone = "primary" | "gold" | "navy" | "accent";

const TONE_MARK: Record<SectionTone, string> = {
  primary: "bg-primary/10 text-primary ring-primary/15",
  gold: "bg-secondary/15 text-[#b8860b] ring-secondary/25",
  navy: "bg-navy/10 text-navy ring-navy/15",
  accent: "bg-accent/10 text-accent ring-accent/20",
};

type SectionHeadingProps = {
  kicker: string;
  title: string;
  symbol?: string;
  tone?: SectionTone;
  lede?: string;
  align?: "left" | "center";
};

/** Shared section title with staggered scroll-in animation. */
export default function SectionHeading({
  kicker,
  title,
  symbol = "ॐ",
  tone = "primary",
  lede,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";
  const ref = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(true);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        window.cancelAnimationFrame(frame);
        if (entry.isIntersecting) {
          setPlaying(false);
          frame = window.requestAnimationFrame(() => {
            frame = window.requestAnimationFrame(() => setPlaying(true));
          });
        } else {
          setPlaying(false);
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`section-heading ${playing ? "is-playing" : ""} ${centered ? "text-center" : ""}`}
    >
      <div
        className={`section-heading-row flex items-center gap-2.5 ${centered ? "justify-center" : ""}`}
      >
        <span
          aria-hidden="true"
          className={`section-heading-mark grid h-9 w-9 flex-none place-items-center rounded-full font-yatra text-lg leading-none ring-1 ${TONE_MARK[tone]}`}
        >
          {symbol}
        </span>
        <p className="section-heading-kicker font-cinzel text-xs font-semibold uppercase tracking-[.22em] text-primary">
          {kicker}
        </p>
      </div>
      <h2
        className={`section-heading-title mt-2 font-display text-3xl font-semibold text-ink ${
          centered ? "sm:text-4xl" : ""
        }`}
      >
        {title}
      </h2>
      {lede ? (
        <p className={`section-heading-lede section-lede ${centered ? "mx-auto" : ""}`}>{lede}</p>
      ) : null}
    </div>
  );
}
