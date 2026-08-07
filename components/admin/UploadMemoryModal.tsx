"use client";

import { useState, type FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { uploadImage, type StorageFolder } from "@/lib/storage";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

type CollectionName = "flashback" | "events";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function UploadMemoryModal({ open, onClose, collectionName = "flashback" }: { open: boolean; onClose: () => void; collectionName?: CollectionName }) {
  const { uid, role } = useAuth();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const selectFile = (selected: File | null) => {
    if (selected && selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("Please choose an image smaller than 5 MB.");
      return;
    }
    setFile(selected);
    setError("");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role !== "admin" || !uid) { setError("Only verified admins can upload memories."); return; }
    if (!file) { setError("Choose an image to upload."); return; }
    setUploading(true);
    setError("");
    try {
      const imageUrl = await uploadImage(file, collectionName as StorageFolder);
      await addDoc(collection(db, collectionName), collectionName === "flashback" ? {
        title: title.trim(),
        caption: caption.trim(),
        year: Number(year),
        imageUrl,
        slideOrderIndex: Date.now(),
        status: "published",
        uploadedBy: uid,
        createdAt: serverTimestamp(),
      } : {
        title: title.trim(), year: Number(year), imageUrl, caption: caption.trim(), uploadedBy: uid, createdAt: serverTimestamp(),
      });
      setTitle(""); setCaption(""); setFile(null); onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed. Check your admin access and try again.");
    } finally { setUploading(false); }
  };

  return <Modal open={open} onClose={onClose} title={collectionName === "flashback" ? "Upload Utsav memory" : "Upload event poster"}><form onSubmit={submit} className="space-y-3"><fieldset disabled={uploading} className="space-y-3 disabled:opacity-60"><input required value={title} onChange={event => setTitle(event.target.value)} placeholder="Memory title" className="w-full rounded-xl border border-orange-200 p-3"/>{collectionName === "flashback" && <input required value={year} onChange={event => setYear(event.target.value)} min="2000" max="2100" type="number" placeholder="Celebration year" className="w-full rounded-xl border border-orange-200 p-3"/>}<textarea value={caption} onChange={event => setCaption(event.target.value)} placeholder="Caption / description" className="min-h-24 w-full rounded-xl border border-orange-200 p-3"/><label className="block rounded-xl border border-dashed border-orange-300 bg-orange-50 p-3 text-sm font-semibold text-slate-700">Choose photo (max 5 MB)<input required type="file" accept="image/*" onChange={event => selectFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs"/>{file && <span className="mt-2 block text-xs text-orange-700">{file.name}</span>}</label></fieldset>{error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}<Button disabled={uploading} type="submit" className="w-full">{uploading ? "Uploading Photo..." : "Upload photo"}</Button></form></Modal>;
}
