import HeroSection from "@/components/HeroSection";
import FlashbackSection from "@/components/FlashbackSection";
import DonateSection from "@/components/DonateSection";
import EventsSection from "@/components/EventsSection";
import FestivalJourney from "@/components/FestivalJourney";
import ContactSection from "@/components/ContactSection";
import SupportersSection from "@/components/SupportersSection";
import ComityMembersSection from "@/components/ComityMembersSection";

export default function HomePage() {
  return (
    <div className="space-y-20 pb-8">
      <section id="hero" className="scroll-mt-24"><HeroSection /></section>
      <section id="gallery" className="scroll-mt-24"><FlashbackSection /></section>
      <section id="events" className="scroll-mt-24"><EventsSection /></section>
      <section id="festival" className="scroll-mt-24"><FestivalJourney /></section>
      <section id="comity" className="scroll-mt-24"><ComityMembersSection /></section>
      <section id="supporters" className="scroll-mt-24"><SupportersSection /></section>
      <section id="donate" className="scroll-mt-24"><DonateSection /></section>
      <section id="about" className="scroll-mt-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-orange-200 bg-orange-50/50 p-6 shadow-md shadow-orange-100/50 sm:p-10">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Our story</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">About Us</h2>
          <div className="mt-6 space-y-5 text-base leading-8 text-slate-700 sm:text-lg">
            <p>Colony Bois began in <strong className="font-bold text-slate-900">2020</strong> as a small group of friends from <strong className="font-bold text-slate-900">SC Colony, Rampuram</strong>, with a simple idea — to come together and celebrate <strong className="font-bold text-slate-900">Ganesh Chaturthi</strong> in our own unique way.</p>
            <p>What started as a group of friends has grown into a beautiful community celebration, thanks to the immense <strong className="font-bold text-slate-900">love, encouragement, and support from the families and people of our colony</strong>. Their participation and support have been the driving force behind our journey.</p>
            <p>Every year, we come together with the same enthusiasm and devotion to welcome <strong className="font-bold text-slate-900">Lord Ganesha</strong>. We also bring a new touch of creativity to our celebrations by creating a <strong className="font-bold text-slate-900">different theme for our Ganesh Mandapam every year</strong>, making each celebration unique and memorable.</p>
            <p>For us, Ganesh Chaturthi is more than just a festival. It is about <strong className="font-bold text-slate-900">friendship, unity, devotion, creativity, and bringing our entire colony together</strong> to create memories that we can cherish for years to come.</p>
            <p>From a small group of friends in 2020 to a celebration supported by an entire community, <strong className="font-bold text-slate-900">Colony Bois continues to grow with the blessings of Lord Ganesha and the love of our colony.</strong></p>
          </div>
          <div className="mt-7 rounded-2xl border border-orange-200 bg-white px-5 py-4 text-center text-base font-bold leading-7 text-slate-900 sm:text-lg"><p>🙏 Ganpati Bappa Morya!</p><p className="text-orange-700">❤️ One Colony. One Family. One Celebration.</p></div>
        </div>
      </section>
      <section id="contact" className="scroll-mt-24">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-600">We&apos;re here to help</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">Contact Colony Bois</h2>
        <p className="mt-3 max-w-xl text-slate-600">For pandal information, volunteering or festival support, reach our organizers directly.</p>
        <div className="mt-7 max-w-3xl"><ContactSection /></div>
      </section>
    </div>
  );
}
