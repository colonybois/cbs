"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToStorage } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

// ── types ─────────────────────────────────────────────────────────────────────
type FestivalDay = {
  id: string;
  dayLabel: string;
  heading: string;
  shortDesc: string;
  detailedDesc: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  coverImageUrl: string;
  galleryUrls: string[];
  videoUrl?: string;
  featured: boolean;
  status: "published" | "draft";
  displayOrder: number;
  createdBy: string;
  createdAt: { toDate?: () => Date } | null;
  updatedAt: { toDate?: () => Date } | null;
};

type FormState = {
  dayLabel: string;
  heading: string;
  shortDesc: string;
  detailedDesc: string;
  eventDate: string;
  eventTime: string;
  location: string;
  videoUrl: string;
  featured: boolean;
  status: "published" | "draft";
  displayOrder: string;
};

const EMPTY_FORM: FormState = {
  dayLabel: "",
  heading: "",
  shortDesc: "",
  detailedDesc: "",
  eventDate: "",
  eventTime: "",
  location: "",
  videoUrl: "",
  featured: false,
  status: "published",
  displayOrder: "0",
};

function fmt(v: FestivalDay["createdAt"]) {
  if (!v) return "—";
  if (typeof v === "string") return new Date(v).toLocaleDateString("en-IN");
  return v.toDate?.().toLocaleDateString("en-IN") ?? "—";
}

// ── toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-xl transition-all ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}
    >
      {type === "success" ? "✓ " : "✕ "}
      {msg}
    </div>
  );
}

// ── image drop zone ───────────────────────────────────────────────────────────
function DropZone({
  label,
  multiple,
  onChange,
}: {
  label: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onChange(Array.from(e.dataTransfer.files));
      }}
      onClick={() => ref.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 text-sm font-semibold transition ${dragging ? "border-saffron bg-white" : "border-saffron-200 bg-white hover:border-saffron-400 hover:bg-white"} text-saffron-600`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4 4 4"
        />
      </svg>
      {label}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => onChange(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}

// ── progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white">
      <div
        className="h-full rounded-full bg-saffron transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function AdminFestivalDays() {
  const { uid, name, role } = useAuth();
  const [days, setDays] = useState<FestivalDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FestivalDay | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FestivalDay | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "order">("order");

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "festival_days"), orderBy("displayOrder", "asc")),
      (snap) => {
        setDays(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FestivalDay));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, displayOrder: String(days.length + 1) });
    setCoverFile(null);
    setCoverPreview(null);
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setProgress(0);
    setModalOpen(true);
  };

  const openEdit = (day: FestivalDay) => {
    setEditTarget(day);
    setForm({
      dayLabel: day.dayLabel,
      heading: day.heading,
      shortDesc: day.shortDesc,
      detailedDesc: day.detailedDesc,
      eventDate: day.eventDate,
      eventTime: day.eventTime ?? "",
      location: day.location ?? "",
      videoUrl: day.videoUrl ?? "",
      featured: day.featured,
      status: day.status,
      displayOrder: String(day.displayOrder),
    });
    setCoverFile(null);
    setCoverPreview(day.coverImageUrl);
    setGalleryFiles([]);
    setGalleryPreviews(day.galleryUrls ?? []);
    setProgress(0);
    setModalOpen(true);
  };

  const handleCover = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const handleGallery = (files: File[]) => {
    setGalleryFiles((prev) => [...prev, ...files]);
    setGalleryPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeGalleryItem = (i: number) => {
    setGalleryFiles((prev) => prev.filter((_, idx) => idx !== i));
    setGalleryPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if ((role !== "admin" && role !== "super_admin") || !uid) {
      showToast("Admin access required.", "error");
      return;
    }
    if (!form.heading.trim()) {
      showToast("Please enter a heading.", "error");
      return;
    }
    if (!editTarget && !coverFile) {
      showToast("Please upload a cover image.", "error");
      return;
    }
    if (!window.confirm(`${editTarget ? "Update" : "Publish"} this festive journey entry?`)) return;
    setSaving(true);
    setProgress(10);
    try {
      // Upload cover
      let coverImageUrl = editTarget?.coverImageUrl ?? "";
      if (coverFile) {
        setProgress(30);
        coverImageUrl = await uploadImageToStorage(coverFile, "festival-days" as never);
      }
      setProgress(60);
      // Upload gallery
      const existingGallery = editTarget
        ? (editTarget.galleryUrls ?? []).filter(
            (_, i) => i < galleryPreviews.length - galleryFiles.length,
          )
        : [];
      const newGalleryUrls = await Promise.all(
        galleryFiles.map((f) => uploadImageToStorage(f, "festival-days" as never)),
      );
      const galleryUrls = [...existingGallery, ...newGalleryUrls];
      setProgress(85);
      const payload = {
        dayLabel: form.dayLabel.trim() || `Day ${form.displayOrder}`,
        heading: form.heading.trim(),
        shortDesc: form.shortDesc.trim(),
        detailedDesc: form.detailedDesc.trim(),
        eventDate: form.eventDate,
        eventTime: form.eventTime.trim(),
        location: form.location.trim(),
        videoUrl: form.videoUrl.trim(),
        coverImageUrl,
        galleryUrls,
        featured: form.featured,
        status: form.status,
        displayOrder: Number(form.displayOrder) || 0,
        updatedAt: serverTimestamp(),
      };
      if (editTarget) {
        await updateDoc(doc(db, "festival_days", editTarget.id), payload);
        showToast("Festival day updated.", "success");
      } else {
        await addDoc(collection(db, "festival_days"), {
          ...payload,
          createdBy: name || uid,
          createdAt: serverTimestamp(),
        });
        showToast("Festival day created.", "success");
      }
      setProgress(100);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "festival_days", deleteTarget.id));
      showToast("Deleted.", "success");
    } catch {
      showToast("Delete failed.", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filtered = days
    .filter(
      (d) =>
        !search ||
        d.heading.toLowerCase().includes(search.toLowerCase()) ||
        d.dayLabel.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sortBy === "date" ? a.eventDate.localeCompare(b.eventDate) : a.displayOrder - b.displayOrder,
    );

  // ── form field helper
  const field = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-saffron-600">
            Content Management
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Festival Days</h1>
          <p className="mt-1 text-slate-500">
            Manage daily festival updates visible on the public Festival Journey timeline.
          </p>
        </div>
        <Button onClick={openCreate}>+ Add Festival Day</Button>
      </div>

      {/* Search + sort */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or day…"
          className="flex-1 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "order")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
        >
          <option value="order">Sort by display order</option>
          <option value="date">Sort by date</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-white" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">🎪</p>
            <h3 className="mt-3 font-bold text-slate-900">No festival days yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Add the first day to start building the Festival Journey.
            </p>
            <Button onClick={openCreate} className="mt-5">
              + Add Festival Day
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-saffron-100 bg-white">
                <tr>
                  {[
                    "Cover",
                    "Day",
                    "Title",
                    "Date",
                    "Status",
                    "Created By",
                    "Updated",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-50">
                {filtered.map((day) => (
                  <tr key={day.id} className="hover:bg-white transition">
                    <td className="px-4 py-3">
                      <img
                        src={day.coverImageUrl}
                        alt={day.heading}
                        className="h-12 w-16 rounded-lg object-cover border border-saffron-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-saffron px-2 py-0.5 text-xs font-black text-white">
                          {day.dayLabel}
                        </span>
                        {day.featured && (
                          <span className="rounded-lg bg-saffron-400 px-2 py-0.5 text-xs font-black text-white">
                            ★
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 max-w-48 truncate">
                      {day.heading}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {day.eventDate ? new Date(day.eventDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${day.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {day.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{day.createdBy || "—"}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {fmt(day.updatedAt ?? day.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a
                          href={`/festival/${day.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                          Preview
                        </a>
                        <button
                          onClick={() => openEdit(day)}
                          className="rounded-lg border border-saffron-200 px-2.5 py-1.5 text-xs font-bold text-saffron-600 hover:bg-white transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(day)}
                          className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Upload / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Edit Festival Day" : "Add Festival Day"}
      >
        <form onSubmit={submit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <fieldset disabled={saving} className="space-y-4 disabled:opacity-60">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Day Label
                <input
                  {...field("dayLabel")}
                  placeholder="Day 1, Opening Ceremony…"
                  className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Display Order
                <input
                  type="number"
                  {...field("displayOrder")}
                  min="0"
                  className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Official Heading *
              <input
                required
                {...field("heading")}
                placeholder="e.g. Grand Ganesh Puja & Procession"
                className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Short Description
              <textarea
                {...field("shortDesc")}
                rows={2}
                placeholder="Brief summary shown on the timeline card…"
                className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Detailed Description
              <textarea
                {...field("detailedDesc")}
                rows={4}
                placeholder="Full story of the day…"
                className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-semibold text-slate-700">
                Event Date
                <input
                  type="date"
                  {...field("eventDate")}
                  className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Event Time
                <input
                  type="time"
                  {...field("eventTime")}
                  className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Location
                <input
                  {...field("location")}
                  placeholder="Pandal, Rampuram"
                  className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </label>
            </div>

            {/* Cover image */}
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Cover Image {!editTarget && "*"}
              </p>
              {coverPreview ? (
                <div className="relative mt-2">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-40 w-full rounded-xl object-cover border border-saffron-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(editTarget?.coverImageUrl ?? null);
                    }}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white text-xs hover:bg-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <DropZone label="Drop or click to upload cover image" onChange={handleCover} />
                </div>
              )}
            </div>

            {/* Gallery */}
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Gallery Images{" "}
                <span className="font-normal text-slate-400">(optional, multiple)</span>
              </p>
              <div className="mt-2">
                <DropZone
                  label="Drop or click to add gallery images"
                  multiple
                  onChange={handleGallery}
                />
              </div>
              {galleryPreviews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {galleryPreviews.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        alt={`Gallery ${i + 1}`}
                        className="h-20 w-20 rounded-xl object-cover border border-saffron-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryItem(i)}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs hover:bg-rose-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video URL */}
            <label className="block text-sm font-semibold text-slate-700">
              Video URL <span className="font-normal text-slate-400">(YouTube / any embed)</span>
              <input
                {...field("videoUrl")}
                placeholder="https://youtube.com/embed/…"
                className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Publish Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value as "published" | "draft" }))
                  }
                  className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-saffron-200 p-3 cursor-pointer mt-6">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                  className="h-4 w-4 accent-saffron"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Featured / Highlight this day
                </span>
              </label>
            </div>
          </fieldset>

          {saving && <ProgressBar value={progress} />}

          <Button disabled={saving} type="submit" className="w-full">
            {saving ? "Saving…" : editTarget ? "Update Festival Day" : "Create Festival Day"}
          </Button>
        </form>
      </Modal>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-slate-900">Delete festival day?</h3>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-semibold">
                {deleteTarget.dayLabel} · {deleteTarget.heading}
              </span>{" "}
              will be permanently removed.
            </p>
            {deleteTarget.coverImageUrl && (
              <img
                src={deleteTarget.coverImageUrl}
                alt={deleteTarget.heading}
                className="mt-3 h-32 w-full rounded-xl object-cover"
              />
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
