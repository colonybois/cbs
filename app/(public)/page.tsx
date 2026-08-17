import HeroSection from "@/components/HeroSection";
import FlashbackSection from "@/components/FlashbackSection";
import DonateSection from "@/components/DonateSection";
import EventsSection from "@/components/EventsSection";
import FestivalJourney from "@/components/FestivalJourney";
import ContactSection from "@/components/ContactSection";
import SupportersSection from "@/components/SupportersSection";
import ComityMembersSection from "@/components/ComityMembersSection";
import ScrollReveal from "@/components/ScrollReveal";

export default function HomePage() {
  return (
    <div className="space-y-12 pb-8 sm:space-y-20">
      <section id="hero" className="scroll-mt-24">
        <HeroSection />
      </section>
      <ScrollReveal as="section" id="gallery" className="scroll-mt-24" variant="up">
        <FlashbackSection />
      </ScrollReveal>
      <ScrollReveal as="section" id="events" className="scroll-mt-24" variant="up" delay={40}>
        <EventsSection />
      </ScrollReveal>
      <ScrollReveal as="section" id="festival" className="scroll-mt-24" variant="scale" delay={60}>
        <FestivalJourney />
      </ScrollReveal>
      <ScrollReveal as="section" id="comity" className="scroll-mt-24" variant="up" delay={40}>
        <ComityMembersSection />
      </ScrollReveal>
      <ScrollReveal as="section" id="supporters" className="scroll-mt-24" variant="fade" delay={40}>
        <SupportersSection />
      </ScrollReveal>
      <ScrollReveal as="section" id="donate" className="scroll-mt-24" variant="scale" delay={60}>
        <DonateSection />
      </ScrollReveal>
      <ScrollReveal as="section" id="about" className="scroll-mt-24" variant="up" delay={40}>
        <div className="temple-frame mx-auto max-w-4xl rounded-[2rem] border border-amber-200/80 bg-gradient-to-br from-[#fffcf8] via-[#fffaf4] to-[#f7efe2] p-6 sm:p-10">
          <p className="font-yatra text-xl text-orange-700">Ganpati Bappa Morya</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[.22em] text-orange-600">
            Our story
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
            About Us
          </h2>
          <div className="mt-6 space-y-5 text-base leading-8 text-slate-700 sm:text-lg">
            <p>
              Colony Bois began in <strong className="font-bold text-slate-900">2019</strong> as a
              small group of friends from{" "}
              <strong className="font-bold text-slate-900">SC Colony, Rampuram</strong>, with a
              simple idea — to come together and celebrate{" "}
              <strong className="font-bold text-slate-900">Ganesh Chaturthi</strong> in our own
              unique way.
            </p>
            <p>
              What started as a group of friends has grown into a beautiful community celebration,
              thanks to the immense{" "}
              <strong className="font-bold text-slate-900">
                love, encouragement, and support from the families and people of our colony
              </strong>
              . Their participation and support have been the driving force behind our journey.
            </p>
            <p>
              Every year, we come together with the same enthusiasm and devotion to welcome{" "}
              <strong className="font-bold text-slate-900">Lord Ganesha</strong>. We also bring a
              new touch of creativity to our celebrations by creating a{" "}
              <strong className="font-bold text-slate-900">
                different theme for our Ganesh Mandapam every year
              </strong>
              , making each celebration unique and memorable.
            </p>
            <p>
              For us, Ganesh Chaturthi is more than just a festival. It is about{" "}
              <strong className="font-bold text-slate-900">
                friendship, unity, devotion, creativity, and bringing our entire colony together
              </strong>{" "}
              to create memories that we can cherish for years to come.
            </p>
            <p>
              From a small group of friends in 2019 to a celebration supported by an entire
              community,{" "}
              <strong className="font-bold text-slate-900">
                Colony Bois continues to grow with the blessings of Lord Ganesha and the love of our
                colony.
              </strong>
            </p>
          </div>
          <div className="mt-7 rounded-2xl border border-amber-200 bg-white/80 px-5 py-5 text-center leading-7 shadow-sm">
            <p className="font-yatra text-2xl text-orange-700">Ganpati Bappa Morya</p>
            <p className="mt-1 font-display text-lg font-medium text-slate-900">
              One Colony. One Family. One Celebration.
            </p>
          </div>
        </div>
      </ScrollReveal>
      <ScrollReveal as="section" id="contact" className="scroll-mt-24" variant="up" delay={40} stagger>
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-orange-600">
          We&apos;re here to help
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900">
          Contact Colony Bois
        </h2>
        <p className="mt-3 max-w-xl text-slate-600">
          For pandal information, volunteering or festival support, reach our organizers directly.
        </p>
        <div className="mt-7 max-w-3xl">
          <ContactSection />
        </div>
      </ScrollReveal>
    </div>
  );
}
