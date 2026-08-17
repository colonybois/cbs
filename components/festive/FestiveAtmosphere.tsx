"use client";

import { usePathname } from "next/navigation";

function Diya({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" className={className} aria-hidden>
      <ellipse cx="24" cy="30" rx="18" ry="8" fill="#d4a017" stroke="#c2410c" strokeWidth="1.4" />
      <ellipse cx="24" cy="28" rx="12" ry="4" fill="#fff6e9" opacity="0.45" />
      <g className="diya-flame">
        <path d="M24 6 C28 14 30 18 24 26 C18 18 20 14 24 6 Z" fill="#ff7a00" />
        <path d="M24 12 C26 16 26 18 24 22 C22 18 22 16 24 12 Z" fill="#ffeb3b" />
      </g>
    </svg>
  );
}

function Lotus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden>
      <path d="M32 40 C20 32 12 22 16 14 C22 18 28 28 32 40 Z" fill="#f8bbd0" opacity="0.85" />
      <path d="M32 40 C44 32 52 22 48 14 C42 18 36 28 32 40 Z" fill="#f8bbd0" opacity="0.85" />
      <path d="M32 42 C26 28 26 12 32 6 C38 12 38 28 32 42 Z" fill="#f48fb1" />
      <circle cx="32" cy="36" r="4" fill="#d4a017" />
    </svg>
  );
}

export default function FestiveAtmosphere() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/member")) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="festive-orb festive-orb-a" />
      <div className="festive-orb festive-orb-b" />
      <Lotus className="festive-float absolute -left-6 top-24 h-20 w-24 opacity-10 sm:left-4 sm:h-28 sm:w-32" />
      <Lotus className="festive-float-delayed absolute -right-8 top-[42%] h-24 w-28 opacity-10 sm:right-6" />
      <Diya className="festive-float absolute right-[8%] top-28 hidden h-12 w-14 opacity-20 sm:block" />
      <Diya className="festive-float-delayed absolute bottom-28 left-[6%] hidden h-11 w-14 opacity-15 md:block" />
    </div>
  );
}
