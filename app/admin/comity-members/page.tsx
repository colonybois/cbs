"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToStorage } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { recordAudit } from "@/lib/audit";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type { ComityDesignation, ComityMember } from "@/types";

const DESIGNATIONS: ComityDesignation[] = [
  "President", "Vice President", "Secretary", "Treasurer",
  "General Secretary", "Event Coordinator", "Decoration Coordinator",
  "Cultural Coordinator", "Chanda Coordinator", "Volunteer Coordinator",
  "Committee Member",
];

const DESIGNATION_GROUPS: Record<string, ComityDesignation[]> = {
  "President / Leadership": ["President", "Vice President", "Secretary", "Treasurer", "General Secretary"],
  "Coordinators": ["Event Coordinator", "Decoration Coordinator", "Cultural Coordinator", "Chanda Coordinator", "Volunteer Coordinator"],
  "Committee Members": ["Committee Member"],
};

type FilterType = "all" | "leadership" | "coordinators" | "committee" | "active" | "inactive" | "featured" | "public" | "hidden";

type FormState = {
  fullName: string; designation: ComityDesignation; memberSince: string;
  bio: string; publicContact: string; showContact: boolean;
  featured: boolean; active: boolean; publicVisible: boolean; displayOrder: string;
};

const EMPTY_FORM: FormState = {
  fullName: "", designation: "Committee Member", memberSince: "",
  bio: "", publicContact: "", showContact: false,
  featured: false, active: true, publicVisible: true, displayOrder: "0",
};

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[100] max-w-sm rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-xl ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
      {type === "success" ? "✓ " : "✕ "}{msg}
    </div>
  );
}

function Avatar({ src, name, size = "lg" }: { src?: string; name: string; size?: "sm" | "lg" }) {
  const [err, setErr] = useState(false);
  const cls = size === "sm" ? "h-10 w-10 text-sm" : "h-20 w-20 text-xl";
  if (src && !err) return <img src={src} alt={name} onError={() => setErr(true)} className={`${cls} rounded-full object-cover border-2 border-orange-200`} />;
  return (
    <div className={`${cls} flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 font-black text-white`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AdminComityMembers() {
  const { uid, name: adminName, role } = useAuth();
  const [members, setMembers] = useState<ComityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ComityMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ComityMember | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => onSnapshot(
    query(collection(db, "comity_members"), orderBy("displayOrder", "asc")),
    snap => { setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as ComityMember))); setLoading(false); },
    () => setLoading(false)
  ), []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, displayOrder: String(members.length + 1) });
    setPhotoFile(null); setPhotoPreview(null);
    setModalOpen(true);
  };

  const openEdit = (m: ComityMember) => {
    setEditTarget(m);
    setForm({
      fullName: m.fullName, designation: m.designation, memberSince: m.memberSince ?? "",
      bio: m.bio ?? "", publicContact: m.publicContact ?? "", showContact: m.showContact,
      featured: m.featured, active: m.active, publicVisible: m.publicVisible,
      displayOrder: String(m.displayOrder),
    });
    setPhotoFile(null); setPhotoPreview(m.photoUrl || null);
    setModalOpen(true);
  };

  const f = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  const toggle = (key: "showContact" | "featured" | "active" | "publicVisible") =>
    setForm(p => ({ ...p, [key]: !p[key] }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if ((role !== "admin" && role !== "super_admin") || !uid) { showToast("Admin access required.", "error"); return; }
    if (!form.fullName.trim()) { showToast("Full name is required.", "error"); return; }
    setSaving(true);
    try {
      let photoUrl = editTarget?.photoUrl ?? "";
      if (photoFile) photoUrl = await uploadImageToStorage(photoFile, "comity-members" as never);

      const payload = {
        fullName: form.fullName.trim(),
        designation: form.designation,
        memberSince: form.memberSince,
        bio: form.bio.trim(),
        publicContact: form.publicContact.trim(),
        showContact: form.showContact,
        featured: form.featured,
        active: form.active,
        publicVisible: form.publicVisible,
        displayOrder: Number(form.displayOrder) || 0,
        photoUrl,
        updatedAt: serverTimestamp(),
      };

      if (editTarget) {
        await updateDoc(doc(db, "comity_members", editTarget.id), payload);
        // Audit readable diff
        const changes: Record<string, string> = {};
        if (editTarget.designation !== form.designation) changes["Designation"] = `${editTarget.designation} → ${form.designation}`;
        if (editTarget.publicVisible !== form.publicVisible) changes["Visibility"] = `${editTarget.publicVisible ? "Public" : "Hidden"} → ${form.publicVisible ? "Public" : "Hidden"}`;
        if (editTarget.featured !== form.featured) changes["Featured"] = `${editTarget.featured ? "Yes" : "No"} → ${form.featured ? "Yes" : "No"}`;
        if (editTarget.active !== form.active) changes["Status"] = `${editTarget.active ? "Active" : "Inactive"} → ${form.active ? "Active" : "Inactive"}`;
        await recordAudit({ actorId: uid, actorName: adminName || uid, action: "Comity member updated", module: "Comity Members", targetId: editTarget.id, previousValue: { name: editTarget.fullName }, newValue: { name: form.fullName, changes } });
        showToast("Comity member updated.", "success");
      } else {
        const ref = await addDoc(collection(db, "comity_members"), { ...payload, createdBy: adminName || uid, createdAt: serverTimestamp() });
        await recordAudit({ actorId: uid, actorName: adminName || uid, action: "Comity member created", module: "Comity Members", targetId: ref.id, newValue: { name: form.fullName, designation: form.designation } });
        showToast("Comity member added.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Save failed.", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !uid) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "comity_members", deleteTarget.id));
      await recordAudit({ actorId: uid, actorName: adminName || uid, action: "Comity member deleted", module: "Comity Members", targetId: deleteTarget.id, previousValue: { name: deleteTarget.fullName, designation: deleteTarget.designation } });
      showToast("Member deleted.", "success");
    } catch { showToast("Delete failed.", "error"); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  const moveOrder = async (member: ComityMember, dir: "up" | "down") => {
    const sorted = [...members].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex(m => m.id === member.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap = sorted[swapIdx];
    await Promise.all([
      updateDoc(doc(db, "comity_members", member.id), { displayOrder: swap.displayOrder }),
      updateDoc(doc(db, "comity_members", swap.id), { displayOrder: member.displayOrder }),
    ]);
    if (uid) await recordAudit({ actorId: uid, actorName: adminName || uid, action: "Comity member order changed", module: "Comity Members", targetId: member.id, newValue: { name: member.fullName, direction: dir } });
  };

  const filtered = members
    .filter(m => !search || m.fullName.toLowerCase().includes(search.toLowerCase()))
    .filter(m => {
      if (filter === "all") return true;
      if (filter === "active") return m.active;
      if (filter === "inactive") return !m.active;
      if (filter === "featured") return m.featured;
      if (filter === "public") return m.publicVisible;
      if (filter === "hidden") return !m.publicVisible;
      if (filter === "leadership") return DESIGNATION_GROUPS["President / Leadership"].includes(m.designation);
      if (filter === "coordinators") return DESIGNATION_GROUPS["Coordinators"].includes(m.designation);
      if (filter === "committee") return DESIGNATION_GROUPS["Committee Members"].includes(m.designation);
      return true;
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const FILTERS: [FilterType, string][] = [
    ["all", "All"], ["leadership", "Leadership"], ["coordinators", "Coordinators"],
    ["committee", "Committee"], ["active", "Active"], ["inactive", "Inactive"],
    ["featured", "Featured"], ["public", "Public"], ["hidden", "Hidden"],
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Administration</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Comity Members</h1>
          <p className="mt-1 text-slate-500">Manage the Colony Bois Ganesh Utsav committee members.</p>
        </div>
        <Button onClick={openCreate}>+ Add Comity Member</Button>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
            className="flex-1 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          {(search || filter !== "all") && (
            <button onClick={() => { setSearch(""); setFilter("all"); }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Clear Filters
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === val ? "bg-orange-500 text-white" : "border border-orange-200 bg-white text-slate-600 hover:bg-orange-50"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-orange-50" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">👥</p>
            <h3 className="mt-3 font-bold text-slate-900">No members found</h3>
            <p className="mt-1 text-sm text-slate-500">Add the first Comity member to get started.</p>
            <Button onClick={openCreate} className="mt-5">+ Add Comity Member</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-orange-100 bg-orange-50/60">
                <tr>{["Photo", "Name & Designation", "Since", "Status", "Visibility", "Order", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-orange-50/40 transition">
                    <td className="px-4 py-3"><Avatar src={m.photoUrl} name={m.fullName} size="sm" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-bold text-slate-900">{m.fullName}</p>
                          <p className="text-xs text-orange-600">{m.designation}</p>
                        </div>
                        {m.featured && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-black text-white">★ Featured</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{m.memberSince || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${m.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {m.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${m.publicVisible ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                        {m.publicVisible ? "Public" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => moveOrder(m, "up")} className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">↑</button>
                        <button onClick={() => moveOrder(m, "down")} className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">↓</button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(m)} className="rounded-lg border border-orange-200 px-2.5 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-50">Edit</button>
                        <button onClick={() => setDeleteTarget(m)} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Comity Member" : "Add Comity Member"}>
        <form onSubmit={submit} className="max-h-[72vh] overflow-y-auto pr-1 space-y-4">
          <fieldset disabled={saving} className="space-y-4 disabled:opacity-60">

            {/* Photo */}
            <div>
              <p className="text-sm font-semibold text-slate-700">Profile Photo</p>
              {photoPreview ? (
                <div className="relative mt-2 inline-block">
                  <img src={photoPreview} alt="Preview" className="h-24 w-24 rounded-full object-cover border-2 border-orange-200" />
                  <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(editTarget?.photoUrl || null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs hover:bg-rose-600">✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex items-center gap-2 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600 hover:border-orange-400 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4 4 4"/></svg>
                  Upload photo
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); } }} />
            </div>

            {/* Name + Designation */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Full Name *
                <input required {...f("fullName")} placeholder="e.g. Ravi Kumar" className="mt-1 w-full rounded-xl border border-orange-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Designation *
                <select value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value as ComityDesignation }))}
                  className="mt-1 w-full rounded-xl border border-orange-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400">
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Member Since
                <input {...f("memberSince")} placeholder="e.g. 2020" className="mt-1 w-full rounded-xl border border-orange-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Display Order
                <input type="number" {...f("displayOrder")} min="0" className="mt-1 w-full rounded-xl border border-orange-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">Short Bio
              <textarea {...f("bio")} rows={3} placeholder="Brief introduction…" className="mt-1 w-full rounded-xl border border-orange-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Public Contact <span className="font-normal text-slate-400">(phone/Instagram, shown only if enabled)</span>
              <input {...f("publicContact")} placeholder="e.g. +91 98765 43210" className="mt-1 w-full rounded-xl border border-orange-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </label>

            {/* Toggles */}
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ["showContact", "Show contact publicly"],
                ["featured", "Featured member ★"],
                ["active", "Active"],
                ["publicVisible", "Visible on website"],
              ] as [keyof FormState, string][]).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/40 p-3">
                  <input type="checkbox" checked={form[key] as boolean} onChange={() => toggle(key as "showContact" | "featured" | "active" | "publicVisible")} className="h-4 w-4 accent-orange-500" />
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                </label>
              ))}
            </div>

          </fieldset>

          <div className="flex gap-3 pt-1">
            <Button disabled={saving} type="submit" className="flex-1">{saving ? "Saving…" : editTarget ? "Update Member" : "Save Comity Member"}</Button>
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900">Remove this Comity member?</h3>
            <div className="mt-3 flex items-center gap-3">
              <Avatar src={deleteTarget.photoUrl} name={deleteTarget.fullName} size="sm" />
              <div>
                <p className="font-bold text-slate-900">{deleteTarget.fullName}</p>
                <p className="text-sm text-orange-600">{deleteTarget.designation}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">This will permanently remove them from the public website and admin dashboard.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-50">
                {deleting ? "Removing…" : "Yes, remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
