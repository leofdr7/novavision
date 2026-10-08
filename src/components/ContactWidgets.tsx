import { Component, lazy, Suspense, useRef, useState, type ReactNode } from "react";
import { ChatLauncher } from "./chat/ChatLauncher";
import { WhatsAppButton } from "./WhatsAppButton";

const ChatPanel = lazy(() => import("./chat/ChatPanel"));
class ChatLoadBoundary extends Component<{ children: ReactNode; open: boolean }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? (this.props.open ? <p role="alert" className="fixed right-6 bottom-40 z-[90] max-w-72 rounded-lg border border-ink/15 bg-paper p-4 text-sm shadow-lg">No pudimos abrir el asistente. Usa el botón verde de WhatsApp o recarga la página.</p> : null) : this.props.children; }
}

export function ContactWidgets() {
  const [active, setActive] = useState<"chat" | "whatsapp" | null>(null);
  const [loaded, setLoaded] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const closeChat = () => { setActive(null); launcher.current?.focus(); };
  return <>
    <WhatsAppButton open={active === "whatsapp"} onOpenChange={open => setActive(current => open ? "whatsapp" : current === "whatsapp" ? null : current)} />
    <ChatLauncher buttonRef={launcher} open={active === "chat"} onClick={() => { setLoaded(true); setActive(current => current === "chat" ? null : "chat"); }} />
    {loaded ? <ChatLoadBoundary open={active === "chat"}><Suspense fallback={active === "chat" ? <p role="status" className="fixed right-6 bottom-40 z-[90] rounded-lg bg-paper p-4 shadow-lg">Abriendo asistente…</p> : null}>
      <ChatPanel open={active === "chat"} onClose={closeChat} />
    </Suspense></ChatLoadBoundary> : null}
  </>;
}
