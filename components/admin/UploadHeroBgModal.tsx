"use client";

import { useEffect, useState, type FormEvent } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function UploadHeroBgModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) { setPreviewUrl(""); return; }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  const selectFile = (selected: File | null) => {
    if (selected && selected.size > MAX_FILE_SIZE) { setFile(null); setError("Please choose an image smaller than 10 MB."); return; }
    setFile(selected); setError("");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role !== "admin" && role !== "super_admin") { setError("Only verified admins can change the hero background."); return; }
    if (!file) { setError("Choose a background image first."); return; }
    if (!window.confirm("Save this hero background image?")) return;
    setUploading(true); setError("");
    try {
      const heroBgUrl = await uploadImage(file, "site-assets");
      await setDoc(doc(db, "site_settings", "hero"), { heroBgUrl, updatedAt: serverTimestamp() }, { merge: true });
      setFile(null); onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update the hero background."); }
    finally { setUploading(false); }
  };
  return <Modal open={open} onClose={onClose} title="Update hero background"><form onSubmit={submit} className="space-y-4"><fieldset disabled={uploading} className="space-y-4 disabled:opacity-60"><label className="block rounded-xl border border-dashed border-orange-300 bg-orange-50 p-3 text-sm font-semibold text-slate-700">Choose image (max 10 MB)<input required type="file" accept="image/*" onChange={event => selectFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs"/></label>{previewUrl && <div className="relative aspect-[16/8] overflow-hidden rounded-xl border border-orange-200"><img src={previewUrl} alt="New hero background preview" className="h-full w-full object-cover"/><span className="absolute right-3 top-3 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-bold text-white">Hero overlay preview</span></div>}</fieldset>{error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}<Button disabled={uploading} type="submit" className="w-full">{uploading ? "Uploading background..." : "Save hero background"}</Button></form></Modal>;
}
