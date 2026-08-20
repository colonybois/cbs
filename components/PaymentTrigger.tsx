"use client";

import { useState } from "react";
import PaymentModal from "@/components/PaymentModal";

export default function PaymentTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
      className="btn-festive px-5 py-3 font-bold shadow-sm"
      >
        Contribute via UPI
      </button>
      <PaymentModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
