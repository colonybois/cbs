"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ChatPanelState = {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
};

const ChatPanelContext = createContext<ChatPanelState | undefined>(undefined);

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(
    () => ({
      open,
      openChat: () => setOpen(true),
      closeChat: () => setOpen(false),
    }),
    [open],
  );

  return <ChatPanelContext.Provider value={value}>{children}</ChatPanelContext.Provider>;
}

export function useChatPanel() {
  const context = useContext(ChatPanelContext);
  if (!context) throw new Error("useChatPanel must be used inside ChatPanelProvider.");
  return context;
}
