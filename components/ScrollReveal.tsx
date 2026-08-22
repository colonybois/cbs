"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./scroll-reveal.css";

type RevealVariant = "up" | "fade" | "scale" | "left" | "right" | "image";
type RevealFrom = "down" | "up";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: RevealVariant;
  delay?: number;
  threshold?: number;
  stagger?: boolean;
  /** When true (default), reveal once and stay visible. */
  once?: boolean;
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
  once = true,
  as: Tag = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [from, setFrom] = useState<RevealFrom>("down");

  // Mount in the hidden state first so CSS transitions have a starting point.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
      setVisible(true);
      return;
    }
    setReady(true);
  }, []);

  // Observe only after the hidden state has painted.
  useEffect(() => {
    if (!ready) return;
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setFrom(entry.boundingClientRect.top > 0 ? "down" : "up");
        if (entry.isIntersecting) {
          if (once) {
            frame = window.requestAnimationFrame(() => setVisible(true));
            observer.disconnect();
          } else {
            setVisible(false);
            frame = window.requestAnimationFrame(() => {
              frame = window.requestAnimationFrame(() => setVisible(true));
            });
          }
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => observer.observe(node));
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ready, threshold, once]);

  const style: CSSProperties | undefined =
    ready && delay > 0 && visible
      ? { transitionDelay: `${delay}ms` }
      : ready
        ? { transitionDelay: "0ms" }
        : undefined;

  const classes = [
    ready && "scroll-reveal",
    ready && `scroll-reveal-${variant}`,
    ready && stagger && "scroll-reveal-stagger",
    ready && visible && "is-visible",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      id={id}
      ref={ref as never}
      style={style}
      data-from={ready ? from : undefined}
      className={classes}
    >
      {children}
    </Tag>
  );
}
