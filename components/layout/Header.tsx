"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { COLONY_BOIS_ASSETS } from "@/lib/constants";
import { recordSiteAnalyticsEvent } from "@/lib/site-analytics";
import { useRegistrationConfig } from "@/hooks/useRegistrationConfig";
import { useHomeSections, type HomeSectionId } from "@/hooks/useHomeSections";
import { smoothScrollToId } from "@/lib/smooth-scroll";
import { useChatPanel } from "@/components/chat/ChatPanelContext";
import "./mobile-menu.css";

const publicNavItems: readonly [string, HomeSectionId][] = [
  ["Home", "hero"],
  ["About", "about"],
  ["Events", "events"],
  ["Gallery", "gallery"],
  ["Festival", "festival"],
  ["Committee", "comity"],
  ["Sponsors", "supporters"],
  ["Contact", "contact"],
];

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
    case "festival":
      return (
        <svg {...common}>
          <path d="M12 3v18M8 7h8M7 11h10M8 15h8" />
          <circle cx="12" cy="5" r="1.5" />
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
    case "supporters":
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H12l-4 3.2V16H7.5A2.5 2.5 0 0 1 5 13.5z" />
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
  ["Hero Videos", "/admin/dashboard#hero-videos"],
  ["Analytics", "/admin/analytics"],
  ["Chanda Transactions", "/admin/chanda-transactions"],
  ["Payment Ledger", "/admin/payment-ledger"],
  ["Members", "/admin/members"],
  ["Events", "/admin/events"],
  ["Gallery", "/admin/gallery"],
  ["Festival Days", "/admin/festival-days"],
  ["Committee Members", "/admin/comity-members"],
  ["Chat Q&A", "/admin/chat"],
  ["Homepage Sections", "/admin/home-sections"],
  ["Approvals", "/admin/approvals"],
  ["Email Settings", "/admin/email-settings"],
  ["Admin Audit Log", "/admin/audit-log"],
] as const;
const memberLinks = [["My Dashboard", "/member/dashboard"]] as const;

export default function Header() {
  const { uid, name, signedIn, loading, role, signOut } = useAuth();
  const { openChat } = useChatPanel();
  const { config: registrationConfig } = useRegistrationConfig();
  const { isEnabled } = useHomeSections();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const inPortal = pathname.startsWith("/admin") || pathname.startsWith("/member");
  const portalLinks = role === "admin" || role === "super_admin" ? adminLinks : memberLinks;
  const visiblePublicNav = publicNavItems.filter(([, id]) => isEnabled(id));
  const showDonate = isEnabled("donate");
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
    setActiveSection(id);
    const menuWasOpen = isMobileMenuOpen;
    closeMenu();
    const run = () => {
      if (smoothScrollToId(id)) return;
      router.push(`/#${id}`);
    };
    if (menuWasOpen) window.setTimeout(run, 180);
    else run();
  };
  const openPublicChat = (source: string) => {
    trackMenu("Chat", "chat", source);
    closeMenu();
    window.setTimeout(openChat, isMobileMenuOpen ? 180 : 0);
  };
  const brand = (
    <Link
      href="/"
      onClick={() => {
        trackMenu("Home", "/", "header_brand");
        setActiveSection("hero");
        closeMenu();
      }}
      className="flex items-center gap-2.5 text-left sm:gap-3"
    >
      <img
        src={COLONY_BOIS_ASSETS.logo.src}
        alt={COLONY_BOIS_ASSETS.logo.alt}
        className="h-10 w-10 rounded-full border-2 border-gold object-cover shadow-sm sm:h-11 sm:w-11"
      />
      <span className="min-w-0 leading-tight">
        <span className="block whitespace-nowrap font-yatra text-[13px] text-primary sm:text-lg">
          || श्री गणेशाय नमः ||
        </span>
        <span className="mt-0.5 block font-cinzel text-[10px] uppercase tracking-[0.18em] text-ink sm:text-[11px] sm:tracking-[0.22em]">
          Colony Bois
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
          className="text-sm font-medium uppercase tracking-[0.16em] text-primary hover:text-accent"
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
          className={`text-sm font-medium uppercase tracking-[0.12em] hover:text-accent ${pathname === href ? "font-semibold text-accent" : "text-primary"}`}
        >
          {label}
        </Link>
      ))}
    </>
  );
  const authActions = loading ? (
    <span className="h-9 w-28 animate-pulse rounded-full bg-[var(--background-warm)]" />
  ) : signedIn ? (
    <>
      {!inPortal && (
        <Link
          href={dashboardPath}
          onClick={() => trackMenu("Dashboard", dashboardPath, "header_auth")}
          className="hidden rounded-full border border-[#c9a8ae] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:bg-[var(--background-warm)] lg:inline-flex"
        >
          Dashboard
        </Link>
      )}
      <button
        onClick={() => void handleSignOut()}
        className="hidden rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary/80 hover:text-accent lg:inline-flex"
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
          className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:text-accent lg:inline"
        >
          Register
        </Link>
      )}
      <Link
        href="/login"
        onClick={() => trackMenu("Sign In", "/login", "header_auth")}
        className="hidden rounded-full border border-[#c9a8ae] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:bg-[var(--background-warm)] lg:inline-flex"
      >
        Sign In
      </Link>
    </>
  );
  const donateButton =
    !inPortal && showDonate ? (
      <button
        type="button"
        onClick={() => scrollToSection("Donate", "donate", "header_donate")}
        className="btn-festive px-5 py-2 text-xs sm:px-6 sm:text-[13px]"
      >
        Donate
      </button>
    ) : null;
  const mobileSections = [
    ...visiblePublicNav,
    ...(showDonate ? ([["Donate", "donate"]] as const) : []),
  ];

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#c9a8ae] bg-[var(--background)]">
      <div className="relative z-50 mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 lg:px-6">
        {brand}
        <nav className="hidden items-center gap-6 lg:flex xl:gap-7">
          {inPortal
            ? portalNav
            : visiblePublicNav.map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(label, id, "public_header_desktop")}
                  className={`relative pb-1 font-cinzel text-[12px] font-semibold uppercase tracking-[0.16em] transition ${
                    pathname === "/" && activeSection === id
                      ? "text-primary"
                      : "text-primary/80 hover:text-accent"
                  }`}
                >
                  {label}
                  {pathname === "/" && activeSection === id && (
                    <span className="absolute inset-x-1 -bottom-0.5 h-[3px] rounded-full bg-[#c9a8ae]" />
                  )}
                </button>
              ))}
          {!inPortal && (
            <button
              type="button"
              onClick={() => openPublicChat("public_header_desktop")}
              className="relative pb-1 font-cinzel text-[12px] font-semibold uppercase tracking-[0.16em] text-primary/80 transition hover:text-accent"
            >
              Chat
            </button>
          )}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {authActions}
          {donateButton}
          <button
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-[#c9a8ae] bg-[var(--background-warm)] text-primary touch-manipulation lg:hidden"
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
            className={`mobile-menu-backdrop fixed inset-0 z-40 bg-primary-dark/35 lg:hidden ${isMobileMenuOpen ? "" : "is-closing"}`}
          />
          <div
            className={`mobile-menu-panel fixed inset-x-0 top-[calc(4.25rem+0.25rem)] z-50 flex max-h-[min(78dvh,calc(100dvh-4.75rem))] flex-col overflow-y-auto overscroll-contain border-b border-[#c9a8ae] bg-[var(--background)] px-3 py-3 text-left shadow-xl lg:hidden ${isMobileMenuOpen ? "" : "is-closing"}`}
          >
            <p className="mobile-menu-item px-2 pb-2 font-yatra text-sm text-primary">
              गणपति बप्पा मोरया
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
                    className={`mobile-menu-item mb-1 flex items-center gap-3 rounded-2xl border px-3 py-3 text-left font-medium transition ${pathname === href ? "border-[#c9a8ae] bg-[var(--background-warm)] font-bold text-primary" : "border-[#c9a8ae] bg-white text-[var(--text)]"}`}
                  >
                    {label}
                  </Link>
                ))
              : (
                <>
                  {mobileSections.map(([label, id], index) => (
                    <button
                      key={id}
                      onClick={() => scrollToSection(label, id, "public_header_mobile")}
                      style={{ animationDelay: `${60 + index * 45}ms` }}
                      className={`mobile-menu-item mb-1.5 flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition active:scale-[0.99] ${id === "donate" ? "border-primary/30 bg-primary/5 font-bold text-primary" : "border-[#c9a8ae] bg-white text-[var(--text)]"}`}
                    >
                      <span
                        className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${id === "donate" ? "bg-primary text-on-primary" : "bg-[var(--background-warm)] text-primary"}`}
                      >
                        <MenuIcon id={id} />
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">{label}</span>
                      <span className="text-lg text-[#5a1725]" aria-hidden>
                        ›
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => openPublicChat("public_header_mobile")}
                    style={{ animationDelay: `${60 + mobileSections.length * 45}ms` }}
                    className="mobile-menu-item mb-1.5 flex w-full items-center gap-3 rounded-2xl border border-[#c9a8ae] bg-white px-3 py-3 text-left text-[var(--text)] transition active:scale-[0.99]"
                  >
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[var(--background-warm)] text-primary">
                      <MenuIcon id="chat" />
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">Chat</span>
                    <span className="text-lg text-[#5a1725]" aria-hidden>
                      ›
                    </span>
                  </button>
                </>
              )}
            {loading ? (
              <span className="mx-2 mt-2 h-11 animate-pulse rounded-2xl bg-[var(--background-warm)]" />
            ) : signedIn ? (
              <div
                className="mobile-menu-item mt-2 flex gap-2 px-1 pt-1"
                style={{ animationDelay: `${60 + mobileSections.length * 45}ms` }}
              >
                {!inPortal && (
                  <Link
                    href={dashboardPath}
                    onClick={() => {
                      trackMenu("Dashboard", dashboardPath, "mobile_header_auth");
                      closeMenu();
                    }}
                    className="btn-festive flex-1 py-2.5 text-center text-sm"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => void handleSignOut()}
                  className="rounded-full border border-[#c9a8ae] px-3 py-2.5 text-sm font-bold text-primary"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div
                className="mobile-menu-item mt-2 flex gap-2 px-1 pt-1"
                style={{ animationDelay: `${60 + mobileSections.length * 45}ms` }}
              >
                {!registrationConfig.hideRegistrationUI && (
                  <Link
                    href="/register"
                    onClick={() => {
                      trackMenu("Register", "/register", "mobile_header_auth");
                      closeMenu();
                    }}
                    className="flex-1 rounded-full border border-[#c9a8ae] py-2.5 text-center font-bold text-primary"
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
                  className="btn-festive flex-1 py-2.5 text-center text-sm"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </header>
    <div className="h-[4.25rem]" aria-hidden />
    </>
  );
}
