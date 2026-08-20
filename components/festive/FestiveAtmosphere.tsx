"use client";

import { usePathname } from "next/navigation";
import { HeroMandala } from "@/components/hero/HeroOrnaments";

export default function FestiveAtmosphere() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/member")) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="festive-orb festive-orb-a" />
      <div className="festive-orb festive-orb-b" />
      <HeroMandala className="absolute -left-24 top-32 h-72 w-72 opacity-[0.07]" />
      <HeroMandala className="absolute -right-28 bottom-24 h-80 w-80 opacity-[0.06]" />
    </div>
  );
}
