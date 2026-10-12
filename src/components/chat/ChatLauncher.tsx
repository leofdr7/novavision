import type { Ref } from "react";
import { MessageSquare } from "lucide-react";

export function ChatLauncher({ open, onClick, buttonRef }: { open: boolean; onClick: () => void; buttonRef: Ref<HTMLButtonElement> }) {
  return <button ref={buttonRef} type="button" aria-expanded={open} aria-controls="novavision-chat" aria-label={open ? "Cerrar asistente" : "Consultar al asistente"}
    onClick={onClick} className="nv-agent-launcher">
    <MessageSquare className="nv-agent-icon" size={22} strokeWidth={1.7} aria-hidden="true" />
    <span><span className="nv-agent-name">NOVA</span><span className="nv-agent-caption">Asistente IA</span></span>
  </button>;
}
