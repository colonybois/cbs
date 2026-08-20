"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./scroll-reveal.css";

type RevealVariant = "up" | "fade" | "scale" | "left" | "right";
type RevealFrom = "down" | "up";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: RevealVariant;
  delay?: number;
  threshold?: number;
  stagger?: boolean;
  as?: "div" | "section" | "header" | "footer" | "article";
};

export default function ScrollReveal({
  children,
  className = "",
  id,
  variant = "up",
  delay = 0,
  threshold = 0.12,
  stagger = false,
  as: Tag = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [from, setFrom] = useState<RevealFrom>("down");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const inViewNow = () => {
      const rect = node.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.92 && rect.bottom > window.innerHeight * 0.08;
    };

    setEnabled(true);

    let frame = 0;
    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => {
        if (inViewNow()) setVisible(true);
      });
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setFrom(entry.boundingClientRect.top > 0 ? "down" : "up");
        setVisible(entry.isIntersecting);
      },
      { threshold: [0, threshold], rootMargin: "-8% 0px -12% 0px" },
    );

    observer.observe(node);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [threshold]);

  const style: CSSProperties | undefined =
    enabled && delay > 0 && visible
      ? { transitionDelay: `${delay}ms` }
      : enabled
        ? { transitionDelay: "0ms" }
        : undefined;

  const classes = [
    enabled && "scroll-reveal",
    enabled && `scroll-reveal-${variant}`,
    enabled && stagger && "scroll-reveal-stagger",
    enabled && visible && "is-visible",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      id={id}
      ref={ref as never}
      style={style}
      data-from={enabled ? from : undefined}
      className={classes}
    >
      {children}
    </Tag>
  );
}
