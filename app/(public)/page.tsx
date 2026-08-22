"use client";

import HeroSection from "@/components/HeroSection";
import FlashbackSection from "@/components/FlashbackSection";
import DonateSection from "@/components/DonateSection";
import EventsSection from "@/components/EventsSection";
import FestivalJourney from "@/components/FestivalJourney";
import ContactSection from "@/components/ContactSection";
import SupportersSection from "@/components/SupportersSection";
import ComityMembersSection from "@/components/ComityMembersSection";
import ScrollReveal from "@/components/ScrollReveal";
import SectionHeading from "@/components/SectionHeading";
import { useHomeSections } from "@/hooks/useHomeSections";

export default function HomePage() {
  const { isEnabled } = useHomeSections();

  return (
    <div className="bg-[#FFFFFF] pb-8">
      {isEnabled("hero") && (
        <div className="full-bleed">
          <section id="hero" className="scroll-mt-24">
            <HeroSection />
          </section>
        </div>
      )}
      <div className="mt-12 space-y-16 sm:mt-16 sm:space-y-20">
        {isEnabled("gallery") && (
          <section id="gallery" className="scroll-mt-24">
            <FlashbackSection />
          </section>
        )}
        {isEnabled("events") && (
          <section id="events" className="scroll-mt-24">
            <EventsSection />
          </section>
        )}
        {isEnabled("festival") && (
          <section id="festival" className="scroll-mt-24">
            <FestivalJourney />
          </section>
        )}
        {isEnabled("comity") && (
          <section id="comity" className="scroll-mt-24">
            <ComityMembersSection />
          </section>
        )}
        {isEnabled("supporters") && (
          <section id="supporters" className="scroll-mt-24">
            <SupportersSection />
          </section>
        )}
        {isEnabled("donate") && (
          <section id="donate" className="scroll-mt-24">
            <DonateSection />
          </section>
        )}
        {isEnabled("about") && (
          <section id="about" className="scroll-mt-24">
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <ScrollReveal variant="fade" className="text-center">
                  <p className="font-yatra text-2xl text-primary sm:text-3xl">
                    ॐ &nbsp;|| श्री गणेशाय नमः ||&nbsp; ॐ
                  </p>
                </ScrollReveal>
                <div className="mt-5">
                  <SectionHeading
                    align="center"
                    kicker="About Us"
                    title="Our Journey"
                    symbol="॥"
                    tone="gold"
                  />
                </div>
              </div>

              <div className="mt-8 space-y-6 sm:mt-10 sm:space-y-7">
                <ScrollReveal variant="left" delay={80}>
                  <p className="text-[15px] leading-8 text-[var(--text)] sm:text-base sm:leading-8">
                    Colony Bois, Rampuram began in{" "}
                    <strong className="font-semibold text-ink">2019</strong> as a small group of
                    friends from{" "}
                    <strong className="font-semibold text-ink">SC Colony, Rampuram</strong>, united
                    by a simple idea — to come together and celebrate{" "}
                    <strong className="font-semibold text-ink">Ganesh Chaturthi</strong> with
                    devotion, creativity, and togetherness.
                  </p>
                </ScrollReveal>

                <div
                  className="flex items-center justify-center gap-3 py-1"
                  aria-hidden="true"
                >
                  <span className="h-px w-10 bg-primary/20 sm:w-14" />
                  <span className="font-yatra text-xl leading-none text-primary/75">ॐ</span>
                  <span className="h-px w-10 bg-primary/20 sm:w-14" />
                </div>

                <ScrollReveal variant="right" delay={160}>
                  <p className="text-[15px] leading-8 text-[var(--text)] sm:text-base sm:leading-8">
                    What started as a gathering of friends has grown into a community celebration, made
                    possible by the constant love, encouragement, and support of the families and
                    people of our colony. Their trust and participation have been the foundation of our
                    journey and continue to inspire us every year.
                  </p>
                </ScrollReveal>

                <div
                  className="flex items-center justify-center gap-3 py-1"
                  aria-hidden="true"
                >
                  <span className="h-px w-10 bg-primary/20 sm:w-14" />
                  <span className="font-yatra text-lg leading-none tracking-[0.18em] text-primary/70">
                    ॥ श्री ॥
                  </span>
                  <span className="h-px w-10 bg-primary/20 sm:w-14" />
                </div>

                <ScrollReveal variant="left" delay={80}>
                  <p className="text-[15px] leading-8 text-[var(--text)] sm:text-base sm:leading-8">
                    With the blessings of Lord Ganesha, we come together each year with the same
                    enthusiasm and devotion, while adding something new to every celebration. One of
                    our traditions is creating a unique theme for our Ganesh Mandapam each year,
                    bringing fresh ideas and creativity to the festival and making every celebration
                    special.
                  </p>
                </ScrollReveal>

                <div
                  className="flex items-center justify-center gap-3 py-1"
                  aria-hidden="true"
                >
                  <span className="h-px w-10 bg-primary/20 sm:w-14" />
                  <span className="font-yatra text-xl leading-none text-primary/75">ॐ</span>
                  <span className="h-px w-10 bg-primary/20 sm:w-14" />
                </div>

                <ScrollReveal variant="right" delay={160}>
                  <p className="text-[15px] leading-8 text-[var(--text)] sm:text-base sm:leading-8">
                    For us, Ganesh Chaturthi is more than a festival. It is a celebration of
                    friendship, unity, devotion, creativity, and community spirit. It is about bringing
                    people together, creating unforgettable moments, and building memories that remain
                    with us for years to come.
                  </p>
                </ScrollReveal>

                <div
                  className="flex items-center justify-center gap-3 py-1"
                  aria-hidden="true"
                >
                  <span className="h-px w-10 bg-primary/20 sm:w-14" />
                  <span className="font-yatra text-lg leading-none tracking-[0.18em] text-primary/70">
                    ॥ श्री ॥
                  </span>
                  <span className="h-px w-10 bg-primary/20 sm:w-14" />
                </div>

                <ScrollReveal variant="up" delay={120}>
                  <p className="text-[15px] leading-8 text-[var(--text)] sm:text-base sm:leading-8">
                    From a small group of friends in{" "}
                    <strong className="font-semibold text-ink">2019</strong> to a celebration
                    embraced and supported by our entire community, Colony Bois continues to grow with
                    the blessings of Lord Ganesha and the unwavering support of the people of Rampuram.
                  </p>
                </ScrollReveal>
              </div>

              <ScrollReveal variant="scale" delay={80} className="mt-10 text-center">
                <p className="font-display text-xl font-semibold text-ink sm:text-2xl">
                  Our Story. Our Tradition. Our Community.
                </p>
                <p className="mt-3 font-yatra text-xl text-primary sm:text-2xl">
                  गणपति बप्पा मोरया
                </p>
                <p className="mt-1 text-lg tracking-[0.2em] text-primary">॥ ॐ ॥</p>
                <p className="mt-3 text-sm font-medium tracking-wide text-[var(--text-muted)]">
                  Colony Bois • Rampuram
                </p>
              </ScrollReveal>
            </div>
          </section>
        )}
        {isEnabled("contact") && (
          <section id="contact" className="scroll-mt-24">
            <SectionHeading
              kicker="We're here to help"
              title="Contact Colony Bois"
              symbol="ॐ"
              tone="accent"
              lede="For pandal information, volunteering or festival support, reach our organizers directly."
            />
            <ScrollReveal variant="up" delay={80} className="mt-7 max-w-3xl">
              <ContactSection />
            </ScrollReveal>
          </section>
        )}
      </div>
    </div>
  );
}
