"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { db } from "@/lib/firebase";
import type { EventCategory, PandalEvent } from "@/types";

const categories: EventCategory[] = ["Pooja & Harathi", "Cultural Activities & Competitions", "Major Ceremonies"];
const eventTimes = (event: PandalEvent) => event.startTime ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}` : event.timeSlot || "Time to be announced";
const eventState = (event: PandalEvent) => {
  const start = new Date(`${event.eventDate}T${event.startTime || "00:00"}`);
  const end = new Date(`${event.eventDate}T${event.endTime || event.startTime || "23:59"}`);
  const now = new Date();
  if (now >= start && now <= end) return "live";
  return now < start ? "upcoming" : "completed";
};

export default function EventsSection() {
  const [events, setEvents] = useState<PandalEvent[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [selected, setSelected] = useState<PandalEvent | null>(null);
  useEffect(() => onSnapshot(query(collection(db, "events"), orderBy("eventDate", "asc")), snapshot => { setEvents(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as PandalEvent)).filter(event => event.published !== false)); setLoading(false); }, () => { setError("Unable to load the festival schedule right now."); setLoading(false); }), []);
  const grouped = useMemo(() => categories.map(category => [category, events.filter(event => (event.category || "Pooja & Harathi") === category)] as const), [events]);
  return <div><p className="text-sm font-bold uppercase tracking-widest text-orange-600">Vinayaka Chavathi</p><h2 className="mt-2 text-3xl font-black text-slate-900">Pandal events &amp; schedule</h2><p className="mt-3 max-w-2xl text-slate-600">Poojas, cultural programs, and major Colony Bois celebrations published live by organizers.</p>
    {loading && <Card className="mt-7 p-8 text-center text-slate-500">Loading festival schedule…</Card>}{error && <Card className="mt-7 border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</Card>}
    {!loading && !error && events.length === 0 && <Card className="mt-7 p-8 text-center"><div className="text-3xl">🪔</div><h3 className="mt-3 font-bold text-slate-900">No events published yet</h3><p className="mt-2 text-sm text-slate-600">Please check back soon for the festival schedule.</p></Card>}
    <div className="mt-7 space-y-9">{grouped.map(([category, items]) => items.length > 0 && <section key={category}><h3 className="mb-3 text-lg font-black text-slate-900">{category}</h3><div className="grid gap-4 lg:grid-cols-2">{items.map(event => { const state = eventState(event); return <button key={event.id} onClick={() => setSelected(event)} className={`text-left ${state === "live" ? "rounded-2xl ring-2 ring-rose-400 ring-offset-2" : ""}`}><Card className="h-full overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex">{event.imageUrl && <img src={event.imageUrl} alt="" className="hidden h-40 w-32 object-cover sm:block"/>}<div className="min-w-0 flex-1 p-5"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wider text-orange-600">{event.eventDate}</span><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${state === "live" ? "bg-rose-100 text-rose-700" : state === "upcoming" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{state === "live" ? "🔴 Live Now" : state === "upcoming" ? "🟡 Upcoming" : "⚪ Completed"}</span></div><h4 className="mt-2 font-bold text-slate-900">{event.title}</h4><p className="mt-1 text-sm font-semibold text-orange-700">🕐 {eventTimes(event)} · {event.venue}</p><p className="mt-2 line-clamp-2 text-sm text-slate-600">{event.description}</p>{event.prasadam && <p className="mt-3 text-xs font-semibold text-slate-600">🍚 Prasadam: {event.prasadam}</p>}{event.coordinator && <p className="mt-1 text-xs text-slate-500">Coordinator: {event.coordinator}</p>}</div></div></Card></button>; })}</div></section>)}</div>
    <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title || "Event details"}>{selected && <div className="space-y-4"><>{selected.imageUrl && <img src={selected.imageUrl} alt={selected.title} className="max-h-72 w-full rounded-xl object-cover"/>}</><p className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-bold text-orange-800">{selected.category || "Pooja & Harathi"} · {selected.eventDate} · {eventTimes(selected)}</p><p className="leading-7 text-slate-700">{selected.description}</p><div className="grid gap-3 text-sm sm:grid-cols-2"><p><b>Venue:</b> {selected.venue}</p>{selected.prasadam && <p><b>Prasadam:</b> {selected.prasadam}</p>}{selected.coordinator && <p><b>Coordinator:</b> {selected.coordinator}</p>}{selected.sponsor && <p><b>Sponsor:</b> {selected.sponsor}</p>}{selected.coHost && <p><b>Co-host:</b> {selected.coHost}</p>}</div>{selected.announcements && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><b>Announcement:</b> {selected.announcements}</div>}</div>}</Modal>
  </div>;
}
