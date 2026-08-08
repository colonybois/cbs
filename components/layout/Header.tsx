"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { COLONY_BOIS_ASSETS } from "@/lib/assets";

const publicSections = [["Home", "hero"], ["Donate / Chanda", "donate"], ["Events", "events"], ["Gallery & Flashback", "gallery"], ["Contact", "contact"]] as const;
const adminLinks = [["Dashboard", "/admin/dashboard"], ["Members", "/admin/members"], ["Events", "/admin/events"], ["Gallery", "/admin/gallery"], ["Approvals", "/admin/approvals"]] as const;
const memberLinks = [["My Dashboard", "/member/dashboard"]] as const;

export default function Header() {
  const { signedIn, loading, role, signOut } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const inPortal = pathname.startsWith("/admin") || pathname.startsWith("/member");
  const portalLinks = role === "admin" ? adminLinks : memberLinks;
  const closeMenu = () => setIsMobileMenuOpen(false);
  const scrollToSection = (id: string) => { closeMenu(); const element = document.getElementById(id); if (element) element.scrollIntoView({ behavior: "smooth", block: "start" }); else window.location.assign(`/#${id}`); };
  const brand = <Link href="/" onClick={closeMenu} className="flex items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-orange-200 bg-orange-50">{!imgError ? <img src={COLONY_BOIS_ASSETS.logo.src} alt={COLONY_BOIS_ASSETS.logo.alt} width={40} height={40} className="h-full w-full object-contain" onError={() => setImgError(true)}/> : <span className="text-xs font-black text-orange-700">CB</span>}</span><span className="text-lg font-bold text-slate-900">Colony <span className="text-orange-600">Bois</span></span></Link>;
  const portalNav = <>{inPortal && <Link href="/" onClick={closeMenu} className="text-sm font-medium text-slate-700 hover:text-orange-600">Home</Link>}{portalLinks.map(([label, href]) => <Link key={href} href={href} onClick={closeMenu} className={`text-sm font-medium hover:text-orange-600 ${pathname === href ? "font-bold text-orange-600" : "text-slate-700"}`}>{label}</Link>)}</>;
  const authActions = loading ? <span className="h-9 w-28 animate-pulse rounded-lg bg-orange-100"/> : signedIn ? <><Link href={role === "admin" ? "/admin/dashboard" : "/member/dashboard"} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Dashboard</Link><button onClick={() => void signOut()} className="rounded-lg border border-orange-300 px-3 py-1.5 text-sm font-bold text-orange-700 hover:bg-orange-50">Sign Out</button></> : <Link href="/login" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Sign In</Link>;
  return <header className="sticky top-0 z-50 border-b-2 border-orange-500 bg-white/95 shadow-sm backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">{brand}<nav className="hidden items-center gap-5 md:flex">{inPortal ? portalNav : publicSections.map(([label, id]) => <button key={id} onClick={() => scrollToSection(id)} className={`text-sm font-medium hover:text-orange-600 ${id === "donate" ? "font-bold text-orange-600" : "text-slate-700"}`}>{label}</button>)}{authActions}</nav><button onClick={() => setIsMobileMenuOpen(value => !value)} aria-expanded={isMobileMenuOpen} aria-label="Toggle navigation menu" className="p-2 text-slate-800 md:hidden">{isMobileMenuOpen ? "✕" : "☰"}</button></div>{isMobileMenuOpen && <div className="flex flex-col space-y-1 border-b-2 border-orange-500 bg-white px-4 py-4 text-left shadow-xl md:hidden">{inPortal ? portalNav : publicSections.map(([label, id]) => <button key={id} onClick={() => scrollToSection(id)} className={`rounded-lg px-3 py-2 text-left font-medium ${id === "donate" ? "font-bold text-orange-600" : "text-slate-800 hover:bg-orange-50"}`}>{label}</button>)}{loading ? <span className="mx-3 mt-2 h-10 animate-pulse rounded-lg bg-orange-100"/> : signedIn ? <div className="flex gap-2 px-3 pt-2"><Link href={role === "admin" ? "/admin/dashboard" : "/member/dashboard"} onClick={closeMenu} className="flex-1 rounded-lg bg-orange-500 py-2 text-center font-bold text-white">Dashboard</Link><button onClick={() => { closeMenu(); void signOut(); }} className="rounded-lg border border-orange-300 px-3 text-sm font-bold text-orange-700">Sign Out</button></div> : <Link href="/login" onClick={closeMenu} className="mx-3 mt-2 rounded-lg bg-orange-500 py-2 text-center font-bold text-white">Sign In</Link>}</div>}</header>;
}
