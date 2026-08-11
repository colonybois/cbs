"use client";

import { useEffect, useState } from "react";

/** Tracks the browser's current network connection state. */
export function useNetworkStatus() {
  // Start online so server and client render the same initial markup, then
  // immediately synchronize with the browser after hydration.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  return isOnline;
}
