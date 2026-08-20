import type { ReactNode } from "react";
export default function Card({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-gold/40 bg-[var(--background)] shadow-temple ${className}`}
    >
      {children}
    </section>
  );
}
