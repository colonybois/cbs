"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useChatPanel } from "@/components/chat/ChatPanelContext";
import type { ChatFaq } from "@/types";
import "./chat-panel.css";

type ChatLine = {
  id: string;
  from: "bot" | "you";
  text: string;
};

const welcome: ChatLine = {
  id: "welcome",
  from: "bot",
  text: "Ganpati Bappa Morya. Pick a question below and I’ll share the answer.",
};

const VISIBLE_QUESTIONS = 3;

function nextVisibleIds(all: ChatFaq[], current: string[]) {
  const valid = current.filter((id) => all.some((faq) => faq.id === id));
  const limit = Math.min(VISIBLE_QUESTIONS, all.length);
  if (valid.length >= limit) return valid.slice(0, limit);
  const used = new Set(valid);
  const fill = all.filter((faq) => !used.has(faq.id)).slice(0, limit - valid.length);
  return [...valid, ...fill.map((faq) => faq.id)];
}

export default function PublicFaqChat() {
  const pathname = usePathname();
  const { open, closeChat } = useChatPanel();
  const [faqs, setFaqs] = useState<ChatFaq[]>([]);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<ChatLine[]>([welcome]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const askedIds = useRef<Set<string>>(new Set());
  const hideOnPortal = pathname.startsWith("/admin") || pathname.startsWith("/member");

  useEffect(() => {
    if (hideOnPortal) return;
    const unsubscribe = onSnapshot(
      query(collection(db, "chat_faqs"), where("published", "==", true)),
      (snapshot) => {
        const next = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as ChatFaq)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setFaqs(next);
        setVisibleIds((current) => nextVisibleIds(next, current));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [hideOnPortal]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeChat]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [lines, pendingId, open]);

  const visibleFaqs = visibleIds
    .map((id) => faqs.find((faq) => faq.id === id))
    .filter((faq): faq is ChatFaq => Boolean(faq));

  const ask = (faq: ChatFaq) => {
    if (pendingId) return;
    askedIds.current.add(faq.id);
    setLines((current) => [
      ...current,
      { id: `q-${faq.id}-${current.length}`, from: "you", text: faq.question },
    ]);
    setPendingId(faq.id);
    setVisibleIds((current) => {
      const replacement =
        faqs.find(
          (item) =>
            item.id !== faq.id &&
            !current.includes(item.id) &&
            !askedIds.current.has(item.id),
        ) ?? faqs.find((item) => item.id !== faq.id && !current.includes(item.id));
      if (!replacement) return current;
      return current.map((id) => (id === faq.id ? replacement.id : id));
    });
    window.setTimeout(() => {
      setLines((current) => [
        ...current,
        { id: `a-${faq.id}-${current.length}`, from: "bot", text: faq.answer },
      ]);
      setPendingId(null);
    }, 900);
  };

  if (hideOnPortal || !open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        type="button"
        aria-label="Close chat"
        onClick={closeChat}
        className="chat-backdrop absolute inset-0 bg-primary-dark/40 backdrop-blur-[2px]"
      />
      <aside className="chat-panel relative flex h-full w-full max-w-[26.5rem] flex-col border-l border-gold/40 bg-[var(--background)] shadow-2xl">
        <header className="flex items-center gap-3 border-b border-gold/35 bg-white px-4 py-3.5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-lg text-on-primary">
            ॐ
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-yatra text-lg leading-tight text-primary">Ask Colony Bois</p>
            <p className="text-xs font-medium text-[var(--text-muted)]">Questions & answers</p>
          </div>
          <button
            type="button"
            onClick={closeChat}
            className="grid h-10 w-10 place-items-center rounded-xl border border-gold/40 text-primary hover:bg-[var(--background-warm)]"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div ref={threadRef} className="chat-thread flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {lines.map((line) => (
            <div
              key={line.id}
              className={`chat-bubble flex ${line.from === "you" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
                  line.from === "you"
                    ? "rounded-br-md bg-primary text-on-primary"
                    : "rounded-bl-md border border-gold/35 bg-white text-[var(--text)]"
                }`}
              >
                {line.text}
              </div>
            </div>
          ))}
          {pendingId && (
            <div className="chat-bubble flex justify-start">
              <div className="chat-typing flex max-w-[92%] items-center gap-2.5 rounded-2xl rounded-bl-md border border-gold/35 bg-white px-3 py-2.5 shadow-sm">
                <img
                  src="/assets/logo.png"
                  alt=""
                  className="h-8 w-8 flex-none rounded-full object-cover ring-1 ring-gold/40"
                />
                <p className="text-sm font-medium text-[var(--text-muted)]">
                  Colony Bois{" "}
                  <span className="chat-typing-label text-primary">Typing</span>
                  <span className="chat-typing-dots" aria-hidden="true">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gold/35 bg-[var(--background-warm)] px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-navy">
            Tap a question
          </p>
          <div className="flex flex-col gap-2">
            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading questions…</p>
            ) : visibleFaqs.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                Questions will appear here once an admin adds them.
              </p>
            ) : (
              visibleFaqs.map((faq) => (
                <button
                  key={faq.id}
                  type="button"
                  onClick={() => ask(faq)}
                  disabled={!!pendingId}
                  className="rounded-xl border border-gold/40 bg-white px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:border-primary/40 hover:bg-[var(--background-warm)] disabled:opacity-60"
                >
                  {faq.question}
                </button>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
