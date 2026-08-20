import ContactSection from "@/components/ContactSection";

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="font-cinzel text-sm font-semibold uppercase tracking-widest text-primary">
        We’re here to help
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Contact Colony Bois</h1>
      <p className="section-lede">
        For pandal information, volunteering or festival support, reach our organizers directly.
      </p>
      <div className="mt-8">
        <ContactSection />
      </div>
    </div>
  );
}
