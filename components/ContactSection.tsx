"use client";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12.04 2.2A9.8 9.8 0 0 0 2.2 11.9c0 1.73.45 3.42 1.3 4.9L2 22l5.36-1.4a9.8 9.8 0 0 0 4.68 1.2h.01A9.8 9.8 0 0 0 21.8 12 9.8 9.8 0 0 0 12.04 2.2Zm5.73 13.86c-.24.68-1.4 1.25-1.94 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.82-4.2-4.97-4.4-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.4.24-.28.64-.4 1.02-.4h.73c.23 0 .55-.1.86.66.32.8.82 2 .89 2.14.07.14.12.3.02.49-.1.2-.15.32-.3.5-.14.17-.3.38-.43.51-.14.14-.29.3-.12.58.16.28.73 1.2 1.56 1.94 1.07.96 1.97 1.26 2.25 1.4.28.14.44.12.6-.07.17-.2.7-.81.89-1.09.18-.28.37-.23.62-.14.26.1 1.63.77 1.91.91.28.14.46.21.53.33.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}

function EmailMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4.2 7.2 7.8 6.2 7.8-6.2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export default function ContactSection() {
  const { phoneNumbers, pandalLocation, instagram, whatsapp, email } = COLONY_BOIS_CONTACT;

  return (
    <section aria-label="Contact Colony Bois">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-primary">Talk to us</p>
          <div className="mt-3 space-y-2">
            {phoneNumbers.map((contact) => (
              <a
                key={contact.number}
                href={`tel:${contact.number}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-3 ring-1 ring-[#e8e0d4] transition hover:ring-navy/25"
              >
                <div>
                  {contact.label.trim() ? (
                    <p className="section-note">{contact.label}</p>
                  ) : null}
                  <p className="font-medium text-ink">{contact.display}</p>
                </div>
                <span className="text-sm font-semibold text-primary">Call</span>
              </a>
            ))}
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[.22em] text-primary">
            Follow us
          </p>
          <div className="mt-3 flex gap-3">
            <a
              href={instagram.url}
              target="_blank"
              rel="noreferrer"
              aria-label="Follow Colony Bois on Instagram"
              className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-white px-3 py-3.5 text-primary ring-1 ring-[#e8e0d4] transition hover:ring-primary/40"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-on-primary">
                <InstagramMark />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">Instagram</span>
            </a>
            <a
              href={whatsapp.url}
              target="_blank"
              rel="noreferrer"
              aria-label="Chat with Colony Bois on WhatsApp"
              className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-white px-3 py-3.5 text-[#128C7E] ring-1 ring-[#e8e0d4] transition hover:ring-[#128C7E]/40"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#128C7E] text-white">
                <WhatsAppMark />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">WhatsApp</span>
            </a>
            <a
              href={`mailto:${email}`}
              aria-label="Email Colony Bois"
              className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-white px-3 py-3.5 text-navy ring-1 ring-[#e8e0d4] transition hover:ring-navy/40"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-navy text-white">
                <EmailMark />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">Email</span>
            </a>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-primary">
            Pandal location
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-ink sm:text-2xl">
            {pandalLocation.title}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">{pandalLocation.address}</p>

          <div className="relative mt-4 -mx-4 overflow-hidden bg-navy/5 sm:mx-0 sm:rounded-2xl">
            <iframe
              title={`${pandalLocation.title} map`}
              src={pandalLocation.embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-64 w-full border-0 sm:h-72"
              allowFullScreen
            />
          </div>

          <a
            href={pandalLocation.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-festive mt-4 inline-flex w-full px-6 py-3 text-center sm:w-auto"
          >
            Navigate to Pandal →
          </a>
        </div>
      </div>
    </section>
  );
}
