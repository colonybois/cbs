"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { COLONY_BOIS_ASSETS } from "@/lib/assets";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";
import { recordSiteAnalyticsEvent } from "@/lib/site-analytics";
import { useRegistrationConfig } from "@/hooks/useRegistrationConfig";
import { smoothScrollToId } from "@/lib/smooth-scroll";
import "./mobile-menu.css";

const publicSections = [
  ["Home", "hero"],
  ["Events", "events"],
  ["Gallery & Flashback", "gallery"],
  ["Chanda / Contribution", "donate"],
  ["About Us", "about"],
  ["Committee Management Rosters", "comity"],
  ["Contact", "contact"],
] as const;

function MenuIcon({ id }: { id: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
  };
  switch (id) {
    case "hero":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "events":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case "gallery":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10.5" r="1.4" />
          <path d="m21 15-4.5-4.5L7 20" />
        </svg>
      );
    case "donate":
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z" />
        </svg>
      );
    case "about":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 8h.01" />
        </svg>
      );
    case "comity":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="16.5" cy="9" r="2.3" />
          <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M14 14.2c2.2.2 4 1.7 4.6 4.3" />
        </svg>
      );
    case "contact":
      return (
        <svg {...common}>
          <path d="M6.5 4.5h3l1.4 3.4-1.8 1.1a12 12 0 0 0 6 6l1.1-1.8 3.4 1.4v3A2 2 0 0 1 18 19 15 15 0 0 1 5 6a2 2 0 0 1 1.5-1.5z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}
const adminLinks = [
  ["Dashboard", "/admin/dashboard"],
  ["Analytics", "/admin/analytics"],
  ["Chanda Transactions", "/admin/chanda-transactions"],
  ["Payment Ledger", "/admin/payment-ledger"],
  ["Members", "/admin/members"],
  ["Events", "/admin/events"],
  ["Gallery", "/admin/gallery"],
  ["Festival Days", "/admin/festival-days"],
  ["Committee Members", "/admin/comity-members"],
  ["Approvals", "/admin/approvals"],
  ["Email Settings", "/admin/email-settings"],
  ["Admin Audit Log", "/admin/audit-log"],
] as const;
const memberLinks = [["My Dashboard", "/member/dashboard"]] as const;

export default function Header() {
  const { uid, name, signedIn, loading, role, signOut } = useAuth();
  const { config: registrationConfig } = useRegistrationConfig();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [imgError, setImgError] = useState(false);
  const inPortal = pathname.startsWith("/admin") || pathname.startsWith("/member");
  const portalLinks = role === "admin" || role === "super_admin" ? adminLinks : memberLinks;
  const closeMenu = () => setIsMobileMenuOpen(false);
  useEffect(() => {
    document.body.style.overflow = "";
  }, []);
  useEffect(() => {
    if (isMobileMenuOpen) {
      setMenuVisible(true);
      return;
    }
    if (!menuVisible) return;
    const hide = window.setTimeout(() => setMenuVisible(false), 200);
    return () => window.clearTimeout(hide);
  }, [isMobileMenuOpen, menuVisible]);
  useEffect(() => {
    closeMenu();
  }, [pathname]);
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    let startY = 0;
    const onTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? 0;
      if (Math.abs(y - startY) > 12) closeMenu();
    };
    const onScrollAway = () => closeMenu();

    window.addEventListener("scroll", onScrollAway, { passive: true });
    window.addEventListener("wheel", onScrollAway, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScrollAway);
      window.removeEventListener("wheel", onScrollAway);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [isMobileMenuOpen]);
  const handleSignOut = async () => {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    closeMenu();
    try {
      await signOut();
    } finally {
      router.replace("/");
    }
  };
  const dashboardPath =
    role === "admin" || role === "super_admin" ? "/admin/dashboard" : "/member/dashboard";
  const trackMenu = (menuLabel: string, menuTarget: string, source: string) => {
    void recordSiteAnalyticsEvent(
      { eventType: "menu_click", menuLabel, menuTarget, source },
      { uid, name, role, signedIn },
    );
  };
  const scrollToSection = (label: string, id: string, source: string) => {
    trackMenu(label, `#${id}`, source);
    const menuWasOpen = isMobileMenuOpen;
    closeMenu();
    const run = () => {
      if (smoothScrollToId(id)) return;
      router.push(`/#${id}`);
    };
    if (menuWasOpen) window.setTimeout(run, 180);
    else run();
  };
  const instagramIcon = (
    <a
      href={COLONY_BOIS_CONTACT.instagram.url}
      target="_blank"
      rel="noreferrer"
      aria-label="Colony Bois on Instagram"
      onClick={() =>
        void recordSiteAnalyticsEvent(
          {
            eventType: "external_click",
            menuLabel: "Instagram",
            menuTarget: COLONY_BOIS_CONTACT.instagram.url,
            source: "header_social",
          },
          { uid, name, role, signedIn },
        )
      }
      className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:text-orange-600 transition"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    </a>
  );
  const brand = (
    <Link
      href="/"
      onClick={() => {
        trackMenu("Home", "/", "header_brand");
        closeMenu();
      }}
      className="flex items-center gap-3 text-left"
    >
      <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 border-amber-300 bg-gradient-to-br from-orange-50 to-amber-100 shadow-sm">
        {!imgError ? (
          <img
            src={COLONY_BOIS_ASSETS.logo.src}
            alt={COLONY_BOIS_ASSETS.logo.alt}
            width={44}
            height={44}
            className="h-full w-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-xs font-black text-orange-700">CB</span>
        )}
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-semibold tracking-tight text-slate-900">
          Colony <span className="text-orange-600">Bois</span>
        </span>
        <span className="hidden font-yatra text-[11px] leading-none text-amber-700 sm:block">
          Ganpati Bappa Morya
        </span>
      </span>
    </Link>
  );
  const portalNav = (
    <>
      {inPortal && (
        <Link
          href="/"
          onClick={() => {
            trackMenu("Home", "/", "portal_header");
            closeMenu();
          }}
          className="text-sm font-medium text-slate-700 hover:text-orange-600"
        >
          Home
        </Link>
      )}
      {portalLinks.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          onClick={() => {
            trackMenu(label, href, "portal_header");
            closeMenu();
          }}
          className={`text-sm font-medium hover:text-orange-600 ${pathname === href ? "font-bold text-orange-600" : "text-slate-700"}`}
        >
          {label}
        </Link>
      ))}
    </>
  );
  const authActions = loading ? (
    <span className="h-9 w-28 animate-pulse rounded-lg bg-orange-100" />
  ) : signedIn ? (
    <>
      {!inPortal && (
        <Link
          href={dashboardPath}
          onClick={() => trackMenu("Dashboard", dashboardPath, "header_auth")}
          className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-orange-600 hover:to-amber-600"
        >
          Dashboard
        </Link>
      )}
      <button
        onClick={() => void handleSignOut()}
        className="rounded-lg border border-orange-300 px-3 py-1.5 text-sm font-bold text-orange-700 hover:bg-orange-50"
      >
        Sign Out
      </button>
    </>
  ) : (
    <>
      {!registrationConfig.hideRegistrationUI && (
        <Link
          href="/register"
          onClick={() => trackMenu("Register", "/register", "header_auth")}
          className="text-sm font-bold text-orange-700 hover:text-orange-600"
        >
          Register
        </Link>
      )}
      <Link
        href="/login"
        onClick={() => trackMenu("Sign In", "/login", "header_auth")}
        className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-orange-600 hover:to-amber-600"
      >
        Sign In
      </Link>
    </>
  );
  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/70 bg-[#fffcf8]/95 shadow-sm">
      <div className="relative z-50 mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        {brand}
        <nav className="hidden items-center gap-5 md:flex">
          {inPortal
            ? portalNav
            : publicSections.map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(label, id, "public_header_desktop")}
                  className={`text-sm font-medium hover:text-orange-600 ${id === "donate" ? "font-bold text-orange-600" : "text-slate-700"}`}
                >
                  {label}
                </button>
              ))}
          {instagramIcon}
          {authActions}
        </nav>
        <div className="flex items-center gap-1 md:hidden">
          {instagramIcon}
          <button
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-amber-200 bg-orange-50 text-orange-800 touch-manipulation"
          >
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${isMobileMenuOpen ? "top-[7px] rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition-all duration-200 ${isMobileMenuOpen ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"}`}
              />
              <span
                className={`absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${isMobileMenuOpen ? "top-[7px] -rotate-45" : "top-[14px]"}`}
              />
            </span>
          </button>
        </div>
      </div>
      {menuVisible && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
            className={`mobile-menu-backdrop fixed inset-0 z-40 bg-stone-900/35 md:hidden ${isMobileMenuOpen ? "" : "is-closing"}`}
          />
          <div
            className={`mobile-menu-panel fixed inset-x-0 top-[calc(4rem+0.25rem)] z-50 flex max-h-[min(78dvh,calc(100dvh-4.5rem))] flex-col overflow-y-auto overscroll-contain border-b border-amber-200 bg-[#fffbf5] px-3 py-3 text-left shadow-xl md:hidden ${isMobileMenuOpen ? "" : "is-closing"}`}
          >
            <p className="mobile-menu-item px-2 pb-2 font-yatra text-sm text-orange-700">
              Ganpati Bappa Morya
            </p>
            {inPortal
              ? portalLinks.map(([label, href], index) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => {
                      trackMenu(label, href, "portal_header");
                      closeMenu();
                    }}
                    style={{ animationDelay: `${60 + index * 45}ms` }}
                    className={`mobile-menu-item mb-1 flex items-center gap-3 rounded-2xl border px-3 py-3 text-left font-medium transition ${pathname === href ? "border-orange-300 bg-orange-50 font-bold text-orange-700" : "border-amber-100 bg-white text-slate-800"}`}
                  >
                    {label}
                  </Link>
                ))
              : publicSections.map(([label, id], index) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(label, id, "public_header_mobile")}
                    style={{ animationDelay: `${60 + index * 45}ms` }}
                    className={`mobile-menu-item mb-1.5 flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition active:scale-[0.99] ${id === "donate" ? "border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 font-bold text-orange-700" : "border-amber-100 bg-white text-slate-800"}`}
                  >
                    <span
                      className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${id === "donate" ? "bg-gradient-to-br from-orange-500 to-amber-500 text-orange-50" : "bg-orange-50 text-orange-700"}`}
                    >
                      <MenuIcon id={id} />
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">{label}</span>
                    <span className="text-lg text-amber-400" aria-hidden>
                      ›
                    </span>
                  </button>
                ))}
            {loading ? (
              <span className="mx-2 mt-2 h-11 animate-pulse rounded-2xl bg-orange-100" />
            ) : signedIn ? (
              <div
                className="mobile-menu-item mt-2 flex gap-2 px-1 pt-1"
                style={{ animationDelay: `${60 + publicSections.length * 45}ms` }}
              >
                {!inPortal && (
                  <Link
                    href={dashboardPath}
                    onClick={() => {
                      trackMenu("Dashboard", dashboardPath, "mobile_header_auth");
                      closeMenu();
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-center font-bold text-white"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => void handleSignOut()}
                  className="rounded-xl border border-orange-300 px-3 py-2.5 text-sm font-bold text-orange-700"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div
                className="mobile-menu-item mt-2 flex gap-2 px-1 pt-1"
                style={{ animationDelay: `${60 + publicSections.length * 45}ms` }}
              >
                {!registrationConfig.hideRegistrationUI && (
                  <Link
                    href="/register"
                    onClick={() => {
                      trackMenu("Register", "/register", "mobile_header_auth");
                      closeMenu();
                    }}
                    className="flex-1 rounded-xl border border-orange-300 py-2.5 text-center font-bold text-orange-700"
                  >
                    Register
                  </Link>
                )}
                <Link
                  href="/login"
                  onClick={() => {
                    trackMenu("Sign In", "/login", "mobile_header_auth");
                    closeMenu();
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-center font-bold text-white"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
