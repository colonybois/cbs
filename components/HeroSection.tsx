"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import HeroVideoCarousel, { type HeroVideo } from "@/components/hero/HeroVideoCarousel";
import { GoldDivider, GoldFlourish, HangingToran, HeroMandala } from "@/components/hero/HeroOrnaments";
import { useRegistrationConfig } from "@/hooks/useRegistrationConfig";
import { smoothScrollToId } from "@/lib/smooth-scroll";

export default function HeroSection() {
  const { loading, signedIn, role } = useAuth();
  const { config: registrationConfig } = useRegistrationConfig();
  const [videos, setVideos] = useState<HeroVideo[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadVideos = async () => {
      try {
        const response = await fetch("/api/hero-videos", { cache: "no-store" });
        const payload = (await response.json()) as {
          ok: boolean;
          videos?: HeroVideo[];
        };
        if (!cancelled && response.ok && payload.ok) {
          setVideos(payload.videos ?? []);
        }
      } catch {
        if (!cancelled) setVideos([]);
      }
    };

    void loadVideos();
    return () => {
      cancelled = true;
    };
  }, []);

  const dashboardHref =
    role === "admin" || role === "super_admin" ? "/admin/dashboard" : "/member/dashboard";
  const hasHeroVideos = videos.length > 0;

  const actions = (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <a
        href="#events"
        onClick={(event) => {
          event.preventDefault();
          smoothScrollToId("events");
        }}
        className="btn-festive px-8 py-3.5 text-sm sm:text-[15px]"
      >
        Join Celebration
      </a>
      {loading ? (
        <span className="h-12 w-40 animate-pulse rounded-full bg-[var(--background-warm)]" />
      ) : signedIn ? (
        <Link
          href={dashboardHref}
          className={`rounded-full border px-6 py-3 text-sm font-semibold tracking-wide transition ${
            hasHeroVideos
              ? "border-[#FFF8E8]/70 text-[#FFF8E8] hover:bg-[#FFF8E8]/10"
              : "border-gold text-primary hover:bg-[var(--background-warm)]"
          }`}
        >
          Go to Dashboard
        </Link>
      ) : !registrationConfig.hideRegistrationUI ? (
        <Link
          href="/register"
          className={`rounded-full border px-6 py-3 text-sm font-semibold tracking-wide transition ${
            hasHeroVideos
              ? "border-[#FFF8E8]/70 text-[#FFF8E8] hover:bg-[#FFF8E8]/10"
              : "border-gold text-primary hover:bg-[var(--background-warm)]"
          }`}
        >
          Join the volunteer team
        </Link>
      ) : null}
    </div>
  );

  if (hasHeroVideos) {
    return (
      <section className="relative isolate min-h-[32rem] overflow-hidden sm:min-h-[38rem] lg:min-h-[44rem]">
        <HeroVideoCarousel videos={videos} />
        <div className="relative z-10 mx-auto flex min-h-[32rem] w-full max-w-3xl flex-col items-center justify-center px-5 py-16 text-center sm:min-h-[38rem] sm:px-8 sm:py-20 lg:min-h-[44rem]">
          <p className="font-cinzel text-lg font-semibold uppercase tracking-[0.22em] text-[#FFF8E8] sm:text-2xl lg:text-3xl">
            Colony Bois
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-tight text-[#E5A51A] sm:text-6xl lg:text-7xl">
            Committee
          </h1>
          <p className="mt-5 text-lg text-[#FFF8E8] sm:text-xl">
            Celebrate together. Serve with heart.
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#FFF8E8]/80 sm:text-[15px] sm:leading-7">
            Join festival events or support the committee — every offering keeps the celebration
            glowing.
          </p>
          {actions}
        </div>
      </section>
    );
  }

  return (
    <section className="relative isolate overflow-hidden bg-[#FFFFFF] px-5 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
      <HangingToran className="pointer-events-none absolute left-3 top-0 hidden h-36 w-16 opacity-80 sm:block" />
      <HangingToran className="pointer-events-none absolute right-4 top-0 h-40 w-[4.5rem] -scale-x-100 opacity-90" />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-6">
        <div className="order-2 flex flex-col items-center text-center lg:order-1">
          <h1 className="font-display text-[2.35rem] font-bold leading-[1.15] text-ink sm:text-5xl lg:text-[3.4rem]">
            Happy Vinayaka Chavithi
          </h1>
          <GoldDivider className="mt-5 h-7 w-56 sm:w-64" />
          <p className="mt-4 font-cinzel text-sm font-semibold tracking-[0.28em] text-accent sm:text-base">
            || GANAPATI BAPPA MORYA ||
          </p>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-[var(--text-muted)] sm:text-base sm:leading-8">
            Celebrating Vinayaka Chavithi with devotion, tradition, unity, community, and the spirit
            of Lord Ganesha at the Colony Bois pandal.
          </p>
          {actions}
          <GoldFlourish className="mt-7 h-8 w-44 opacity-90" />
        </div>

        <div className="relative order-1 mx-auto flex min-h-[20rem] w-full max-w-lg items-end justify-center sm:min-h-[26rem] lg:order-2 lg:max-w-none lg:min-h-[32rem]">
          <HeroMandala className="pointer-events-none absolute left-1/2 top-[42%] h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-70" />
          <img
            src="/assets/hero-ganesha.png"
            alt="Lord Ganesha seated on a golden throne with diyas and marigolds"
            className="relative z-10 w-full max-w-md object-contain sm:max-w-lg lg:max-w-xl"
          />
        </div>
      </div>
    </section>
  );
}
