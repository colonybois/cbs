"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { COLONY_BOIS_ASSETS } from "@/lib/assets";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";

const publicSections = [["Home", "hero"], ["Events", "events"], ["Gallery & Flashback", "gallery"], ["Chanda / Contribution", "donate"], ["About Us", "about"], ["Committee Management Rosters", "comity"], ["Contact", "contact"]] as const;
const adminLinks = [["Dashboard", "/admin/dashboard"], ["Chanda Transactions", "/admin/chanda-transactions"], ["Payment Ledger", "/admin/payment-ledger"], ["Members", "/admin/members"], ["Events", "/admin/events"], ["Gallery", "/admin/gallery"], ["Festival Days", "/admin/festival-days"], ["Comity Members", "/admin/comity-members"], ["Approvals", "/admin/approvals"], ["Email Settings", "/admin/email-settings"], ["Admin Audit Log", "/admin/audit-log"]] as const;
const memberLinks = [["My Dashboard", "/member/dashboard"]] as const;

export default function Header() {
  const { signedIn, loading, role, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const inPortal = pathname.startsWith("/admin") || pathname.startsWith("/member");
  const portalLinks = role === "admin" ? adminLinks : memberLinks;
  const closeMenu = () => setIsMobileMenuOpen(false);
  const handleSignOut = async () => { closeMenu(); await signOut(); router.push("/"); };
  const scrollToSection = (id: string) => { closeMenu(); const element = document.getElementById(id); if (element) element.scrollIntoView({ behavior: "smooth", block: "start" }); else window.location.assign(`/#${id}`); };
  const instagramIcon = (
    <a href={COLONY_BOIS_CONTACT.instagram.url} target="_blank" rel="noreferrer" aria-label="Colony Bois on Instagram"
      className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:text-orange-600 transition">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    </a>
  );
  const brand = <Link href="/" onClick={closeMenu} className="flex items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-orange-200 bg-orange-50">{!imgError ? <img src={COLONY_BOIS_ASSETS.logo.src} alt={COLONY_BOIS_ASSETS.logo.alt} width={40} height={40} className="h-full w-full object-contain" onError={() => setImgError(true)}/> : <span className="text-xs font-black text-orange-700">CB</span>}</span><span className="text-lg font-bold text-slate-900">Colony <span className="text-orange-600">Bois</span></span></Link>;
  const portalNav = <>{inPortal && <Link href="/" onClick={closeMenu} className="text-sm font-medium text-slate-700 hover:text-orange-600">Home</Link>}{portalLinks.map(([label, href]) => <Link key={href} href={href} onClick={closeMenu} className={`text-sm font-medium hover:text-orange-600 ${pathname === href ? "font-bold text-orange-600" : "text-slate-700"}`}>{label}</Link>)}</>;
  const authActions = loading ? <span className="h-9 w-28 animate-pulse rounded-lg bg-orange-100"/> : signedIn ? <>{!inPortal && <Link href={role === "admin" ? "/admin/dashboard" : "/member/dashboard"} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Dashboard</Link>}<button onClick={() => void handleSignOut()} className="rounded-lg border border-orange-300 px-3 py-1.5 text-sm font-bold text-orange-700 hover:bg-orange-50">Sign Out</button></> : <Link href="/login" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Sign In</Link>;
  return <header className="sticky top-0 z-50 border-b-2 border-orange-500 bg-white/95 shadow-sm backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">{brand}<nav className="hidden items-center gap-5 md:flex">{inPortal ? portalNav : publicSections.map(([label, id]) => <button key={id} onClick={() => scrollToSection(id)} className={`text-sm font-medium hover:text-orange-600 ${id === "donate" ? "font-bold text-orange-600" : "text-slate-700"}`}>{label}</button>)}{instagramIcon}{authActions}</nav><div className="flex items-center gap-1 md:hidden">{instagramIcon}<button onClick={() => setIsMobileMenuOpen(value => !value)} aria-expanded={isMobileMenuOpen} aria-label="Toggle navigation menu" className="p-2 text-slate-800">{isMobileMenuOpen ? "✕" : "☰"}</button></div></div>{isMobileMenuOpen && <div className="flex flex-col space-y-1 border-b-2 border-orange-500 bg-white px-4 py-4 text-left shadow-xl md:hidden">{inPortal ? portalNav : publicSections.map(([label, id]) => <button key={id} onClick={() => scrollToSection(id)} className={`rounded-lg px-3 py-2 text-left font-medium ${id === "donate" ? "font-bold text-orange-600" : "text-slate-800 hover:bg-orange-50"}`}>{label}</button>)}{loading ? <span className="mx-3 mt-2 h-10 animate-pulse rounded-lg bg-orange-100"/> : signedIn ? <div className="flex gap-2 px-3 pt-2">{!inPortal && <Link href={role === "admin" ? "/admin/dashboard" : "/member/dashboard"} onClick={closeMenu} className="flex-1 rounded-lg bg-orange-500 py-2 text-center font-bold text-white">Dashboard</Link>}<button onClick={() => void handleSignOut()} className="rounded-lg border border-orange-300 px-3 py-2 text-sm font-bold text-orange-700">Sign Out</button></div> : <Link href="/login" onClick={closeMenu} className="mx-3 mt-2 rounded-lg bg-orange-500 py-2 text-center font-bold text-white">Sign In</Link>}</div>}</header>;
}
