"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { recordSiteAnalyticsEvent } from "@/lib/site-analytics";
import { useChatPanel } from "@/components/chat/ChatPanelContext";

export default function ChatFab() {
  const pathname = usePathname();
  const { open, openChat } = useChatPanel();
  const { uid, name, role, signedIn } = useAuth();
  const hideOnPortal = pathname.startsWith("/admin") || pathname.startsWith("/member");

  if (hideOnPortal || open) return null;

  return (
    <button
      type="button"
      aria-label="Open chat"
      onClick={() => {
        void recordSiteAnalyticsEvent(
          {
            eventType: "menu_click",
            menuLabel: "Chat",
            menuTarget: "chat",
            source: "floating_chat_fab",
          },
          { uid, name, role, signedIn },
        );
        openChat();
      }}
      className="fixed bottom-3 right-3 z-[45] grid h-12 w-12 place-items-center rounded-full bg-primary text-on-primary shadow-md ring-1 ring-white/20 transition hover:bg-primary-dark active:scale-95 sm:bottom-4 sm:right-4"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path
          d="M5.5 18.5 4 21l3.2-1.2A8.7 8.7 0 0 0 12 21c4.7 0 8.5-3.4 8.5-7.5S16.7 6 12 6 3.5 9.4 3.5 13.5c0 1.8.7 3.4 1.9 4.7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 12.5h.01M12 12.5h.01M15.5 12.5h.01"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
