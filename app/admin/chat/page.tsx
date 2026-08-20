"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { recordAudit } from "@/lib/audit";
import type { ChatFaq } from "@/types";

const blank = { question: "", answer: "", displayOrder: "0", published: true };

export default function AdminChatFaqs() {
  const { uid, name } = useAuth();
  const [faqs, setFaqs] = useState<ChatFaq[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<ChatFaq | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () =>
      onSnapshot(
        collection(db, "chat_faqs"),
        (snapshot) =>
          setFaqs(
            snapshot.docs
              .map((item) => ({ id: item.id, ...item.data() }) as ChatFaq)
              .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
          ),
        () => setError("Unable to load chat questions."),
      ),
    [],
  );

  const openNew = () => {
    setEditing(null);
    setForm({
      ...blank,
      displayOrder: String(faqs.length + 1),
    });
    setError("");
    setOpen(true);
  };

  const openEdit = (faq: ChatFaq) => {
    setEditing(faq);
    setForm({
      question: faq.question || "",
      answer: faq.answer || "",
      displayOrder: String(faq.displayOrder ?? 0),
      published: faq.published !== false,
    });
    setError("");
    setOpen(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!uid || !name) return;
    const question = form.question.trim();
    const answer = form.answer.trim();
    if (!question || !answer) {
      setError("Question and answer are both required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        question,
        answer,
        displayOrder: Number(form.displayOrder) || 0,
        published: form.published,
        updatedAt: serverTimestamp(),
      };
      if (editing) {
        await updateDoc(doc(db, "chat_faqs", editing.id), payload);
        await recordAudit({
          actorId: uid,
          actorName: name,
          action: "Edited chat question",
          module: "Chat",
          targetId: editing.id,
          previousValue: { question: editing.question, published: editing.published },
          newValue: { question, published: form.published },
          approvalStatus: "approved",
        });
      } else {
        const added = await addDoc(collection(db, "chat_faqs"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        await recordAudit({
          actorId: uid,
          actorName: name,
          action: "Created chat question",
          module: "Chat",
          targetId: added.id,
          newValue: { question, published: form.published },
          approvalStatus: "approved",
        });
      }
      setOpen(false);
    } catch {
      setError("Could not save this question. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (faq: ChatFaq) => {
    if (!uid || !name || !window.confirm(`Delete “${faq.question}”?`)) return;
    try {
      await deleteDoc(doc(db, "chat_faqs", faq.id));
      await recordAudit({
        actorId: uid,
        actorName: name,
        action: "Deleted chat question",
        module: "Chat",
        targetId: faq.id,
        previousValue: { question: faq.question },
        approvalStatus: "approved",
      });
    } catch {
      setError("Could not delete the question.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Chat questions</h1>
          <p className="mt-2 text-slate-600">
            Add question and answer pairs. Published items appear in the public Chat panel from the
            sidenav — not as a homepage section.
          </p>
        </div>
        <Button onClick={openNew}>+ Add question</Button>
      </div>
      {error && <p className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="mt-7 space-y-3">
        {faqs.length === 0 ? (
          <Card className="p-8 text-center text-slate-600">No questions yet. Add the first pair.</Card>
        ) : (
          faqs.map((faq) => (
            <Card key={faq.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--background-warm)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-primary">
                      #{faq.displayOrder ?? 0}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${faq.published === false ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}
                    >
                      {faq.published === false ? "Draft" : "Published"}
                    </span>
                  </div>
                  <h2 className="mt-2 font-bold text-slate-900">{faq.question}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => openEdit(faq)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => void remove(faq)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit question" : "New question"}
      >
        <form onSubmit={(event) => void save(event)} className="space-y-3">
          <label className="block text-sm font-semibold text-ink">
            Question
            <input
              value={form.question}
              onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-gold/40 bg-white px-3 py-2.5 text-sm"
              placeholder="When is Ganesh Chaturthi this year?"
            />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Answer
            <textarea
              value={form.answer}
              onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
              rows={5}
              className="mt-1 w-full rounded-xl border border-gold/40 bg-white px-3 py-2.5 text-sm"
              placeholder="The answer visitors should see."
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-ink">
              Order
              <input
                type="number"
                value={form.displayOrder}
                onChange={(event) =>
                  setForm((current) => ({ ...current, displayOrder: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-gold/40 bg-white px-3 py-2.5 text-sm"
              />
            </label>
            <label className="mt-7 flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  setForm((current) => ({ ...current, published: event.target.checked }))
                }
              />
              Published
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
