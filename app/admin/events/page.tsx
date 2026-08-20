"use client";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { recordAudit } from "@/lib/audit";
import type { EventCategory, PandalEvent } from "@/types";
const categories: EventCategory[] = [
  "Pooja & Harathi",
  "Cultural Activities & Competitions",
  "Major Ceremonies",
];
const blank = {
  title: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  venue: "",
  description: "",
  category: "Pooja & Harathi" as EventCategory,
  prasadam: "",
  coordinator: "",
  sponsor: "",
  coHost: "",
  announcements: "",
  featured: false,
  published: true,
};
export default function AdminEvents() {
  const { uid, name } = useAuth();
  const [events, setEvents] = useState<PandalEvent[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<PandalEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(
    () =>
      onSnapshot(
        query(collection(db, "events"), orderBy("eventDate", "asc")),
        (snapshot) =>
          setEvents(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as PandalEvent)),
        () => setError("Unable to load events."),
      ),
    [],
  );
  const change = (key: keyof typeof blank, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const openNew = () => {
    setEditing(null);
    setForm(blank);
    setFile(null);
    setError("");
    setOpen(true);
  };
  const openEdit = (event: PandalEvent) => {
    setEditing(event);
    setForm({
      title: event.title || "",
      eventDate: event.eventDate || "",
      startTime: event.startTime || event.timeSlot || "",
      endTime: event.endTime || "",
      venue: event.venue || "",
      description: event.description || "",
      category: event.category || "Pooja & Harathi",
      prasadam: event.prasadam || "",
      coordinator: event.coordinator || "",
      sponsor: event.sponsor || "",
      coHost: event.coHost || "",
      announcements: event.announcements || "",
      featured: !!event.featured,
      published: event.published !== false,
    });
    setFile(null);
    setError("");
    setOpen(true);
  };
  const save = async () => {
    if (!uid || !name || !form.title || !form.eventDate || !form.startTime || !form.venue) {
      setError("Title, date, start time, and venue are required.");
      return;
    }
    setSaving(true);
    try {
      const imageUrl = file ? await uploadImage(file, "events") : editing?.imageUrl;
      const data = {
        ...form,
        imageUrl: imageUrl || null,
        timeSlot: form.startTime + (form.endTime ? ` – ${form.endTime}` : ""),
        updatedAt: new Date().toISOString(),
      };
      if (editing) {
        await updateDoc(doc(db, "events", editing.id), data);
        await recordAudit({
          actorId: uid,
          actorName: name,
          action:
            editing.eventDate !== form.eventDate || editing.startTime !== form.startTime
              ? "Rescheduled event"
              : "Edited event",
          module: "Events",
          targetId: editing.id,
          previousValue: {
            title: editing.title,
            eventDate: editing.eventDate,
            startTime: editing.startTime || editing.timeSlot,
          },
          newValue: { title: form.title, eventDate: form.eventDate, startTime: form.startTime },
          approvalStatus: "approved",
        });
      } else {
        const added = await addDoc(collection(db, "events"), {
          ...data,
          createdAt: new Date().toISOString(),
        });
        await recordAudit({
          actorId: uid,
          actorName: name,
          action: "Created event",
          module: "Events",
          targetId: added.id,
          newValue: { title: form.title, eventDate: form.eventDate, published: form.published },
          approvalStatus: "approved",
        });
      }
      setOpen(false);
    } catch {
      setError("Could not save the event. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (event: PandalEvent) => {
    if (!uid || !name || !window.confirm(`Delete “${event.title}”?`)) return;
    try {
      await deleteDoc(doc(db, "events", event.id));
      await recordAudit({
        actorId: uid,
        actorName: name,
        action: "Deleted event",
        module: "Events",
        targetId: event.id,
        previousValue: { title: event.title, eventDate: event.eventDate },
        approvalStatus: "approved",
      });
    } catch {
      setError("Could not delete the event.");
    }
  };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Events Management</h1>
          <p className="mt-2 text-slate-600">
            Create, publish, reschedule, and manage the live pandal schedule.
          </p>
        </div>
        <Button onClick={openNew}>+ Create event</Button>
      </div>
      {error && <p className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-slate-600">
            No events created yet.
          </Card>
        ) : (
          events.map((event) => (
            <Card className="overflow-hidden p-0" key={event.id}>
              {event.imageUrl && (
                <img src={event.imageUrl} alt="" className="h-32 w-full object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-saffron-600">
                    {event.eventDate}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold ${event.published === false ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}
                  >
                    {event.published === false ? "Unpublished" : "Published"}
                  </span>
                </div>
                <h2 className="mt-3 font-bold text-slate-900">{event.title}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {event.category || "Pooja & Harathi"}
                  <br />
                  {event.startTime || event.timeSlot} · {event.venue}
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => openEdit(event)}
                    className="text-xs font-bold text-saffron-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void remove(event)}
                    className="text-xs font-bold text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit festival event" : "Create festival event"}
      >
        <div className="space-y-3">
          <input
            value={form.title}
            onChange={(e) => change("title", e.target.value)}
            placeholder="Event title *"
            className="w-full rounded-xl border border-saffron-200 p-3"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.eventDate}
              onChange={(e) => change("eventDate", e.target.value)}
              type="date"
              className="w-full rounded-xl border border-saffron-200 p-3"
            />
            <select
              value={form.category}
              onChange={(e) => change("category", e.target.value)}
              className="w-full rounded-xl border border-saffron-200 p-3"
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <input
              value={form.startTime}
              onChange={(e) => change("startTime", e.target.value)}
              type="time"
              className="w-full rounded-xl border border-saffron-200 p-3"
            />
            <input
              value={form.endTime}
              onChange={(e) => change("endTime", e.target.value)}
              type="time"
              className="w-full rounded-xl border border-saffron-200 p-3"
            />
          </div>
          <input
            value={form.venue}
            onChange={(e) => change("venue", e.target.value)}
            placeholder="Venue *"
            className="w-full rounded-xl border border-saffron-200 p-3"
          />
          <textarea
            value={form.description}
            onChange={(e) => change("description", e.target.value)}
            placeholder="Full description"
            className="min-h-24 w-full rounded-xl border border-saffron-200 p-3"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.prasadam}
              onChange={(e) => change("prasadam", e.target.value)}
              placeholder="Prasadam details"
              className="w-full rounded-xl border border-saffron-200 p-3"
            />
            <input
              value={form.coordinator}
              onChange={(e) => change("coordinator", e.target.value)}
              placeholder="Coordinator"
              className="w-full rounded-xl border border-saffron-200 p-3"
            />
            <input
              value={form.sponsor}
              onChange={(e) => change("sponsor", e.target.value)}
              placeholder="Sponsor"
              className="w-full rounded-xl border border-saffron-200 p-3"
            />
            <input
              value={form.coHost}
              onChange={(e) => change("coHost", e.target.value)}
              placeholder="Co-host"
              className="w-full rounded-xl border border-saffron-200 p-3"
            />
          </div>
          <textarea
            value={form.announcements}
            onChange={(e) => change("announcements", e.target.value)}
            placeholder="Important announcement"
            className="min-h-20 w-full rounded-xl border border-saffron-200 p-3"
          />
          <label className="block text-sm font-semibold text-slate-700">
            Event poster{" "}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-xs"
            />
          </label>
          <div className="flex gap-5 text-sm font-semibold text-slate-700">
            <label>
              <input
                checked={form.featured}
                onChange={(e) => change("featured", e.target.checked)}
                type="checkbox"
                className="mr-2"
              />
              Featured
            </label>
            <label>
              <input
                checked={form.published}
                onChange={(e) => change("published", e.target.checked)}
                type="checkbox"
                className="mr-2"
              />
              Published
            </label>
          </div>
          <Button disabled={saving} onClick={() => void save()} className="w-full">
            {saving ? "Saving…" : editing ? "Save event" : "Create event"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
