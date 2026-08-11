import ContactSection from "@/components/ContactSection";

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
        We’re here to help
      </p>
      <h1 className="mt-2 text-4xl font-black text-slate-900">Contact Colony Bois</h1>
      <p className="mt-3 max-w-xl text-slate-600">
        For pandal information, volunteering or festival support, reach our organizers directly.
      </p>
      <div className="mt-8">
        <ContactSection />
      </div>
    </div>
  );
}
