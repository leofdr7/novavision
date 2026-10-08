import { MessagesSquare } from "lucide-react";
import type { Ref } from "react";

export function ChatLauncher({ open, onClick, buttonRef }: { open: boolean; onClick: () => void; buttonRef: Ref<HTMLButtonElement> }) {
  return <button ref={buttonRef} type="button" aria-expanded={open} aria-controls="novavision-chat" aria-label={open ? "Cerrar asistente" : "Consultar al asistente"}
    onClick={onClick} className="fixed right-6 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex h-12 items-center gap-2 rounded-full bg-ink px-4 font-display text-xs font-semibold text-paper shadow-lg transition-colors hover:bg-blue-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-dark">
    <MessagesSquare size={19} aria-hidden="true" /><span>Consultar al asistente</span>
  </button>;
}
