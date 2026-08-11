"use client";

import { useEffect, useRef, useState } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

function WifiIcon({ offline = false }: { offline?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 flex-none ${offline ? "animate-pulse" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M2.5 8.5a15 15 0 0 1 19 0" />
      <path d="M5.5 12a10 10 0 0 1 13 0" />
      <path d="M8.8 15.5a5 5 0 0 1 6.4 0" />
      <path d="M12 20h.01" />
      {offline && <path d="M3 3l18 18" />}
    </svg>
  );
}

export default function NetworkBanner() {
  const isOnline = useNetworkStatus();
  const wasOffline = useRef(!isOnline);
  const [showRestored, setShowRestored] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      setShowRestored(false);
      setIsDismissing(false);
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    setShowRestored(true);
    setIsDismissing(false);
    const dismissTimer = window.setTimeout(() => setIsDismissing(true), 2500);
    const hideTimer = window.setTimeout(() => setShowRestored(false), 2800);
    return () => {
      window.clearTimeout(dismissTimer);
      window.clearTimeout(hideTimer);
    };
  }, [isOnline]);

  if (isOnline && !showRestored) return null;
  const offline = !isOnline;
  return (
    <div
      role="status"
      className={`sticky left-0 right-0 top-0 z-50 shadow-md transition-all duration-300 ${isDismissing ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"} ${offline ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"}`}
    >
      <div className="flex min-h-10 items-center justify-center gap-2 px-4 py-2 text-center text-sm font-semibold">
        <WifiIcon offline={offline} />
        <span>
          {offline
            ? "Network Disconnected — You are offline. Actions will sync when reconnected."
            : "Connection Restored — Back online!"}
        </span>
      </div>
    </div>
  );
}
