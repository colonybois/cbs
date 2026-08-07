import type { ReactNode } from "react";
export default function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`rounded-2xl border border-orange-200 bg-white shadow-xl shadow-orange-100/50 ${className}`}>{children}</section>; }
