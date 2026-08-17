import type { ReactNode } from "react";
export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-amber-200/90 bg-[#fffdf8] shadow-temple ${className}`}
    >
      {children}
    </section>
  );
}
