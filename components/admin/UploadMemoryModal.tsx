"use client";

import { useState, type FormEvent } from "react";
import { addDoc, collection } from "firebase/firestore";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { uploadImage, type StorageFolder } from "@/lib/storage";
import { db } from "@/lib/firebase";

type CollectionName = "flashback" | "events";
export default function UploadMemoryModal({ open, onClose, collectionName = "flashback" }: { open: boolean; onClose: () => void; collectionName?: CollectionName }) {
  const [title, setTitle] = useState(""); const [year, setYear] = useState(String(new Date().getFullYear())); const [file, setFile] = useState<File | null>(null); const [error, setError] = useState(""); const [uploading, setUploading] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!file) { setError("Choose an image to upload."); return; } setUploading(true); setError(""); try { const imageUrl = await uploadImage(file, collectionName as StorageFolder); await addDoc(collection(db, collectionName), { title: title.trim(), year: Number(year), imageUrl, uploadedAt: new Date().toISOString(), uploadedBy: "admin" }); setTitle(""); setFile(null); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Upload failed. Check your admin access and try again."); } finally { setUploading(false); } };
  return <Modal open={open} onClose={onClose} title={collectionName === "flashback" ? "Upload Utsav memory" : "Upload event poster"}><form onSubmit={submit} className="space-y-3"><input required value={title} onChange={event => setTitle(event.target.value)} placeholder="Image title" className="w-full rounded-xl border border-orange-200 p-3"/>{collectionName === "flashback" && <input required value={year} onChange={event => setYear(event.target.value)} min="2000" max="2100" type="number" placeholder="Celebration year" className="w-full rounded-xl border border-orange-200 p-3"/>}<label className="block rounded-xl border border-dashed border-orange-300 bg-orange-50 p-3 text-sm font-semibold text-slate-700">Choose image<input required type="file" accept="image/*" onChange={event => setFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs"/>{file && <span className="mt-2 block text-xs text-orange-700">{file.name}</span>}</label>{error && <p className="text-sm text-rose-600">{error}</p>}<Button disabled={uploading} type="submit" className="w-full">{uploading ? "Uploading…" : "Upload image"}</Button></form></Modal>;
}
