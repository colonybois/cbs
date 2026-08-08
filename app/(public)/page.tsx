import HeroSection from "@/components/HeroSection";
import FlashbackSection from "@/components/FlashbackSection";
import DonateSection from "@/components/DonateSection";
import EventsSection from "@/components/EventsSection";
import FestivalJourney from "@/components/FestivalJourney";
import ContactSection from "@/components/ContactSection";

export default function HomePage() {
  return (
    <div className="space-y-20 pb-8">
      <section id="hero" className="scroll-mt-24"><HeroSection /></section>
      <section id="gallery" className="scroll-mt-24"><FlashbackSection /></section>
      <section id="donate" className="scroll-mt-24"><DonateSection /></section>
      <section id="events" className="scroll-mt-24"><EventsSection /></section>
      <section id="festival" className="scroll-mt-24"><FestivalJourney /></section>
      <section id="contact" className="scroll-mt-24">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-600">We&apos;re here to help</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">Contact Colony Bois</h2>
        <p className="mt-3 max-w-xl text-slate-600">For pandal information, volunteering or festival support, reach our organizers directly.</p>
        <div className="mt-7 max-w-3xl"><ContactSection /></div>
      </section>
    </div>
  );
}
