"use client";
import type { ReactNode } from "react";
export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-saffron-900/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gold/40 bg-[var(--background)] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-content-main">{title}</h2>
          <button onClick={onClose} className="text-content-muted hover:text-saffron">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
