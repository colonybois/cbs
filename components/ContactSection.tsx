"use client";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";

export default function ContactSection() {
  const { phoneNumbers, pandalLocation } = COLONY_BOIS_CONTACT;

  return (
    <section aria-label="Contact Colony Bois">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Left: email + phone */}
        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-temple space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-orange-600">
              Email us
            </p>
            <div className="mt-2">
              <a
                href={`mailto:${COLONY_BOIS_CONTACT.email}`}
                className="font-bold text-slate-900 underline decoration-orange-300 underline-offset-4 hover:text-orange-600"
              >
                {COLONY_BOIS_CONTACT.email}
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-orange-600">
              Talk to us
            </p>
            <div className="mt-2 space-y-2">
              {phoneNumbers.map((contact) => (
                <a
                  key={contact.number}
                  href={`tel:${contact.number}`}
                  className="flex items-center rounded-xl bg-orange-50 p-3 hover:bg-orange-100 transition"
                >
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
        <div className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-temple">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-orange-600">
              Pandal location
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold text-slate-900">
              📍 {pandalLocation.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Find us at our Vinayaka pandal during the festival. Tap below for turn-by-turn
              directions.
            </p>
          </div>
          <a
            href={pandalLocation.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-center font-bold text-white shadow-temple hover:from-orange-600 hover:to-amber-600"
          >
            Navigate to Pandal →
          </a>
        </div>
      </div>
    </section>
  );
}
