"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { uploadImage, type StorageFolder } from "@/lib/storage";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { recordAudit } from "@/lib/audit";

type CollectionName = "flashback" | "events";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function UploadMemoryModal({
  open,
  onClose,
  collectionName = "flashback",
}: {
  open: boolean;
  onClose: () => void;
  collectionName?: CollectionName;
}) {
  const { uid, role, name } = useAuth();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [credit, setCredit] = useState("");
  const [relatedEvent, setRelatedEvent] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset all state whenever the modal opens/closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setCaption("");
      setYear(String(new Date().getFullYear()));
      setCredit("");
      setRelatedEvent("");
      setFeatured(false);
      setPublished(true);
      setFile(null);
      setPreview(null);
      setError("");
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const selectFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setPreview(null);
      setError("Please choose an image smaller than 5 MB.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("");
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((role !== "admin" && role !== "super_admin") || !uid) {
      setError("Only verified admins can upload memories.");
      return;
    }
    if (!file) {
      setError("Choose an image to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (
      !window.confirm(
        `Upload “${title.trim()}” to ${collectionName === "flashback" ? "the gallery" : "events"}?`,
      )
    )
      return;
    setUploading(true);
    setError("");
    try {
      const imageUrl = await uploadImage(file, collectionName as StorageFolder);
      if (collectionName === "flashback") {
        const added = await addDoc(collection(db, "flashback"), {
          title: title.trim(),
          caption: caption.trim(),
          year: Number(year),
          imageUrl,
          credit: credit.trim() || null,
          relatedEvent: relatedEvent.trim() || null,
          featured,
          slideOrderIndex: Date.now(),
          status: published ? "published" : "hidden",
          uploadedBy: uid,
          createdAt: serverTimestamp(),
        });
        await recordAudit({
          actorId: uid,
          actorName: name || "Admin",
          action: "Uploaded gallery image",
          module: "Gallery",
          targetId: added.id,
          newValue: { title: title.trim(), year: Number(year), featured, published },
          approvalStatus: "approved",
        });
      } else {
        await addDoc(collection(db, "events"), {
          title: title.trim(),
          caption: caption.trim(),
          year: Number(year),
          imageUrl,
          uploadedBy: uid,
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (reason) {
      console.error("[UploadMemoryModal] upload failed:", reason);
      setError(
        reason instanceof Error
          ? reason.message
          : "Upload failed. Check your admin access and try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={collectionName === "flashback" ? "Upload Utsav memory" : "Upload event poster"}
    >
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={uploading} className="space-y-4 disabled:opacity-60">
          {/* Title */}
          <label className="block text-sm font-semibold text-slate-700">
            Title *
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ganesh Chaturthi 2024"
              className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </label>

          {collectionName === "flashback" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Related event{" "}
                <input
                  value={relatedEvent}
                  onChange={(e) => setRelatedEvent(e.target.value)}
                  placeholder="Optional event name"
                  className="mt-1 w-full rounded-xl border border-saffron-200 p-3"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Photo credit{" "}
                <input
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  placeholder="Optional public credit"
                  className="mt-1 w-full rounded-xl border border-saffron-200 p-3"
                />
              </label>
            </div>
          )}
          {collectionName === "flashback" && (
            <div className="flex gap-5 text-sm font-semibold text-slate-700">
              <label>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="mr-2"
                />
                Featured memory
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="mr-2"
                />
                Publish now
              </label>
            </div>
          )}

          {/* Year — flashback only */}
          {collectionName === "flashback" && (
            <label className="block text-sm font-semibold text-slate-700">
              Celebration Year *
              <input
                required
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </label>
          )}

          {/* Caption */}
          <label className="block text-sm font-semibold text-slate-700">
            Caption <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Short description…"
              rows={2}
              className="mt-1 w-full rounded-xl border border-saffron-200 p-3 focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </label>

          {/* File picker */}
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="h-44 w-full rounded-xl object-cover border border-saffron-200"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold hover:bg-rose-600"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-saffron-200 bg-white py-6 text-sm font-semibold text-saffron-600 hover:border-saffron-400 hover:bg-white transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
              Choose photo (max 5 MB)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={selectFile}
          />
        </fieldset>

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
          >
            {error}
          </p>
        )}

        <Button disabled={uploading || !file} type="submit" className="w-full">
          {uploading ? "Uploading…" : "Upload photo"}
        </Button>
      </form>
    </Modal>
  );
}
