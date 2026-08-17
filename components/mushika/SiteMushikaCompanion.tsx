"use client";

import { usePathname } from "next/navigation";
import { MushikaScrollProgress } from "./MushikaScrollProgress";

/** Public-page Mushika companion. Hidden on admin/member portals. */
export function SiteMushikaCompanion() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/member")) return null;
  return <MushikaScrollProgress />;
}
