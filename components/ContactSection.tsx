"use client";
import { useState } from "react";
import { COLONY_BOIS_CONTACT } from "@/lib/constants";

export default function ContactSection() {
  const { instagram, phoneNumbers, pandalLocation } = COLONY_BOIS_CONTACT;
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => { await navigator.clipboard.writeText(COLONY_BOIS_CONTACT.email); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };

  return <section className="space-y-5" aria-label="Contact Colony Bois">
    <a href={instagram.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-orange-300 bg-white p-5 shadow-md shadow-orange-100/50 transition hover:bg-orange-50">
      <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Follow the celebrations</p>
      <div className="mt-2 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-xl text-white">◎</span><div><h2 className="font-bold text-slate-900">Instagram</h2><p className="text-sm text-slate-600">{instagram.handle}</p></div><span className="ml-auto text-orange-600">↗</span></div>
    </a>

    <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-md shadow-orange-100/50">
      <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Email us</p>
      <div className="mt-3 flex flex-wrap items-center gap-2"><a href={`mailto:${COLONY_BOIS_CONTACT.email}`} className="font-bold text-slate-900 underline decoration-orange-300 underline-offset-4 hover:text-orange-600">{COLONY_BOIS_CONTACT.email}</a><button onClick={copyEmail} className="rounded-lg border border-orange-300 px-2.5 py-1 text-xs font-bold text-orange-700 hover:bg-orange-50">{copied ? "Copied!" : "Copy"}</button></div>
      <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Talk to the organizers</p>
      <div className="mt-4 space-y-3">{phoneNumbers.map(contact => <div key={contact.number} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-orange-50 p-3"><div><p className="text-xs font-semibold text-slate-600">{contact.label}</p><p className="font-bold text-slate-900">{contact.display}</p></div><div className="flex gap-2"><a href={`tel:${contact.number}`} className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-100">Call</a><a href={`https://wa.me/${contact.number.slice(1)}`} target="_blank" rel="noreferrer" className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white hover:bg-orange-600">WhatsApp</a></div></div>)}</div>
    </div>

    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
      <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Pandal location</p>
      <h2 className="mt-2 font-bold text-slate-900">📍 {pandalLocation.title}</h2>
      <a href={pandalLocation.mapsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-lg bg-orange-500 px-6 py-3 font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600">Navigate to Pandal →</a>
    </div>
  </section>;
}
