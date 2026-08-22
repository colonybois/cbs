"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import UploadMemoryModal, {
  type FlashbackEditItem,
} from "@/components/admin/UploadMemoryModal";
import { useAuth } from "@/lib/auth-context";
import { recordAudit } from "@/lib/audit";

type Memory = FlashbackEditItem;

function IconEdit() {
  return (
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
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function IconDelete() {
  return (
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
        d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18"
      />
    </svg>
  );
}

function ActionDialog({
  item,
  onEdit,
  onDelete,
  onCancel,
  deleting,
}: {
  item: Memory;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={item.imageUrl} alt={item.title} className="h-40 w-full rounded-xl object-cover" />
        <p className="mt-3 truncate font-bold text-slate-900">{item.title}</p>
        <p className="text-xs text-slate-400">{item.year}</p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-white"
          >
            <IconEdit /> Edit details
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
          >
            <IconDelete /> {deleting ? "Deleting…" : "Delete image"}
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function AdminGallery() {
  const { uid, name } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<Memory | null>(null);
  const [editTarget, setEditTarget] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "flashback"), orderBy("year", "desc")),
      (snap) => {
        setMemories(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Memory));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  const sorted = [...memories].sort((a, b) => b.year - a.year);

  const handleDelete = async () => {
    if (!actionTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "flashback", actionTarget.id));
      if (uid && name)
        await recordAudit({
          actorId: uid,
          actorName: name,
          action: "Deleted gallery image",
          module: "Gallery",
          targetId: actionTarget.id,
          previousValue: { title: actionTarget.title, year: actionTarget.year },
          approvalStatus: "approved",
        });
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setDeleting(false);
      setActionTarget(null);
    }
  };

  const handleEdit = () => {
    if (!actionTarget) return;
    setEditTarget(actionTarget);
    setActionTarget(null);
  };

  const toggle = async (item: Memory, field: "featured" | "status") => {
    if (!uid || !name) return;
    const next =
      field === "featured" ? !item.featured : item.status === "hidden" ? "published" : "hidden";
    await updateDoc(doc(db, "flashback", item.id), { [field]: next });
    await recordAudit({
      actorId: uid,
      actorName: name,
      action:
        field === "featured"
          ? `${next ? "Featured" : "Unfeatured"} gallery image`
          : `${next === "published" ? "Published" : "Unpublished"} gallery image`,
      module: "Gallery",
      targetId: item.id,
      previousValue: {
        [field]: field === "featured" ? !!item.featured : item.status || "published",
      },
      newValue: { [field]: next },
      approvalStatus: "approved",
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Utsav Flashback</h1>
          <p className="mt-1 text-slate-500">
            Sorted by year, newest first. Click any card to edit or delete.
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>+ Upload memory</Button>
      </div>

      {loading && (
        <div className="mt-8 flex flex-wrap gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 w-40 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-saffron-200 bg-white p-12 text-center">
          <div className="text-4xl">📸</div>
          <h2 className="mt-3 font-bold text-slate-900">No memories yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload the first flashback image to get started.
          </p>
          <Button onClick={() => setUploadOpen(true)} className="mt-5">
            Upload a flashback image
          </Button>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-4">
          {sorted.map((item) => (
            <button
              key={item.id}
              onClick={() => setActionTarget(item)}
              className="group relative h-52 w-40 overflow-hidden rounded-2xl border-2 border-saffron-100 bg-white shadow-sm transition hover:border-saffron-400 hover:shadow-md"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover transition duration-200 group-hover:brightness-75"
              />
              <span className="absolute left-2 top-2 rounded-lg bg-saffron/90 px-2 py-0.5 text-xs font-black text-white shadow">
                {item.year}
              </span>
              {item.featured && (
                <span className="absolute right-2 top-2 rounded-lg bg-saffron-400 px-2 py-0.5 text-xs font-black text-slate-900">
                  Featured
                </span>
              )}
              {item.status === "hidden" && (
                <span className="absolute right-2 bottom-10 rounded-lg bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Hidden
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-full bg-white/90 p-2 text-slate-700">
                  <IconEdit />
                </span>
                <span className="rounded-full bg-rose-500/90 p-2 text-white">
                  <IconDelete />
                </span>
              </div>
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-slate-950/70 to-transparent px-2 pb-2 pt-6 text-xs font-bold text-white">
                {item.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {sorted.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-saffron-100 bg-white px-3 py-2 text-xs"
            >
              <span className="max-w-32 truncate font-semibold text-slate-700">{item.title}</span>
              <button
                onClick={() => setEditTarget(item)}
                className="font-bold text-slate-700"
              >
                Edit
              </button>
              <button
                onClick={() => void toggle(item, "featured")}
                className="font-bold text-saffron-700"
              >
                {item.featured ? "Unfeature" : "Feature"}
              </button>
              <button
                onClick={() => void toggle(item, "status")}
                className="font-bold text-slate-600"
              >
                {item.status === "hidden" ? "Publish" : "Hide"}
              </button>
            </div>
          ))}
        </div>
      )}

      {actionTarget && (
        <ActionDialog
          item={actionTarget}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCancel={() => setActionTarget(null)}
          deleting={deleting}
        />
      )}

      <UploadMemoryModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

      <UploadMemoryModal
        open={editTarget !== null}
        editItem={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
}
