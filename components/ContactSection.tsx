"use client";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";

export default function ContactSection() {
  const { phoneNumbers, pandalLocation } = COLONY_BOIS_CONTACT;

  return (
    <section aria-label="Contact Colony Bois">
      <div className="grid gap-5 md:grid-cols-2">

        {/* Left: email + phone */}
        <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-md shadow-orange-100/50 space-y-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Email us</p>
            <div className="mt-2">
              <a href={`mailto:${COLONY_BOIS_CONTACT.email}`}
                className="font-bold text-slate-900 underline decoration-orange-300 underline-offset-4 hover:text-orange-600">
                {COLONY_BOIS_CONTACT.email}
              </a>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Talk to us</p>
            <div className="mt-2 space-y-2">
              {phoneNumbers.map(contact => (
                <a key={contact.number} href={`tel:${contact.number}`} className="flex items-center rounded-xl bg-orange-50 p-3 hover:bg-orange-100 transition">
                  <div>
                    <p className="text-xs font-semibold text-slate-600">{contact.label}</p>
                    <p className="font-bold text-slate-900">{contact.display}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right: pandal location */}
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 flex flex-col justify-between shadow-md shadow-orange-100/50">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Pandal location</p>
            <h2 className="mt-2 font-bold text-slate-900">📍 {pandalLocation.title}</h2>
            <p className="mt-2 text-sm text-slate-600">Find us at our Vinayaka pandal during the festival. Tap below for turn-by-turn directions.</p>
          </div>
          <a href={pandalLocation.mapsUrl} target="_blank" rel="noreferrer"
            className="mt-5 inline-block rounded-lg bg-orange-500 px-6 py-3 font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 text-center">
            Navigate to Pandal →
          </a>
        </div>

      </div>
    </section>
  );
}
