"use client";

import { useState } from "react";
import PaymentModal from "@/components/PaymentModal";

export default function PaymentTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-orange-300 bg-white px-5 py-3 font-bold text-orange-700 shadow-sm hover:bg-orange-50"
      >
        Contribute via UPI
      </button>
      <PaymentModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
