import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, Eye, Square, X } from "lucide-react";
import { CHAT_CONTACT_HELP, CHAT_WELCOME } from "../../../shared/chat";
import { useChat } from "../../hooks/useChat";
import "./chat-panel.css";

const suggestions = [
  ["Horarios", "¿Cuál es el horario de atención?"],
  ["Ubicación", "¿Dónde está ubicada la clínica?"],
  ["Servicios", "¿Qué servicios ofrecen?"],
  ["¿Cómo agendar?", "¿Cómo puedo agendar una cita?"],
] as const;
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const chat = useChat();
  const [draft, setDraft] = useState("");
  const [present, setPresent] = useState(open);
  const [viewport, setViewport] = useState({ height: window.innerHeight, offset: 0 });
  const panel = useRef<HTMLElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const lastScrollTop = useRef(0);
  const available = !!chat.init?.available && chat.init.limits.remainingMessages > 0;
  const maxLength = chat.init?.limits.maxMessageChars ?? 1000;
  const latest = chat.messages.filter(m => m.role === "assistant" && m.complete).at(-1)?.content ?? "";

  useEffect(() => {
    if (open) { setPresent(true); return; }
    const timer = setTimeout(() => setPresent(false), reducedMotion() ? 0 : 180);
    return () => clearTimeout(timer);
  }, [open]);

  useLayoutEffect(() => {
    const el = input.current;
    if (!open || !el) return;
    el.style.height = "auto";
    const height = el.scrollHeight + 2;
    el.style.height = `${Math.min(136, Math.max(44, height))}px`;
    el.style.overflowY = height > 136 ? "auto" : "hidden";
  }, [draft, open]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const vv = window.visualViewport;
      setViewport({ height: vv?.height ?? window.innerHeight, offset: vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0 });
    };
    update(); window.visualViewport?.addEventListener("resize", update); window.visualViewport?.addEventListener("scroll", update);
    close.current?.focus();
    return () => { window.visualViewport?.removeEventListener("resize", update); window.visualViewport?.removeEventListener("scroll", update); };
  }, [open]);
  useEffect(() => {
    if (!open || !follow.current) return;
    const frame = requestAnimationFrame(() => {
      const el = log.current;
      if (el && follow.current) el.scrollTo?.({ top: el.scrollHeight, behavior: reducedMotion() ? "instant" : "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [chat.messages, chat.busy, chat.error, draft, viewport, open]);

  function pauseFollow() {
    follow.current = false;
    const el = log.current;
    if (el) el.scrollTo?.({ top: el.scrollTop, behavior: "instant" });
  }

  function submit(text = draft) {
    if (!text.trim() || !available || chat.busy || chat.initializing) return;
    follow.current = true; void chat.send(text); setDraft("");
  }

  return <section ref={panel} id="novavision-chat" hidden={!open && !present} inert={!open} aria-hidden={!open} data-open={open} role="dialog" aria-labelledby="chat-title" aria-describedby="chat-notice"
    onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}
    style={{ bottom: `calc(${viewport.offset + (viewport.height < 500 ? 12 : 156)}px + env(safe-area-inset-bottom))`, maxHeight: `calc(${Math.max(180, viewport.height - (viewport.height < 500 ? 24 : 172))}px - env(safe-area-inset-bottom))` }}
    className="nv-chat fixed right-3 z-[90] h-[560px] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-ink/15 bg-paper font-body text-ink sm:right-6 sm:w-[380px]">
    <header className="flex shrink-0 items-center gap-3 border-b border-ink/10 bg-ink px-4 py-3 text-paper">
      <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal/50 bg-teal/10 text-teal"><Eye size={23} /></span>
      <div className="min-w-0 flex-1"><p className="mb-1 font-display text-[10px] font-semibold uppercase tracking-widest text-paper/80">Novavision · Asistente</p><h2 id="chat-title" className="flex items-center gap-2 font-display text-[13px] font-semibold"><span aria-hidden="true" data-active={available} className="nv-chat-status" />¿Cómo podemos ayudarte?</h2></div>
      <button ref={close} type="button" onClick={onClose} aria-label="Cerrar conversación" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-paper"><X size={18} /></button>
    </header>
    <div ref={log} tabIndex={0} onWheel={event => { if (event.deltaY < 0) pauseFollow(); }} onTouchStart={pauseFollow}
      onKeyDown={event => { if (["ArrowUp", "PageUp", "Home"].includes(event.key)) pauseFollow(); }}
      onScroll={() => {
        const el = log.current; if (!el) return;
        if (el.scrollTop < lastScrollTop.current - 1) follow.current = false;
        else if (el.scrollHeight - el.scrollTop - el.clientHeight < 12) follow.current = true;
        lastScrollTop.current = el.scrollTop;
      }}
      aria-label="Conversación" className="nv-chat-log min-h-12 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 text-base leading-[1.65] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-dark">
      <p className="nv-chat-bubble mr-3 rounded-2xl rounded-bl-sm border border-ink/10 bg-white p-3.5">{CHAT_WELCOME}</p>
      {chat.messages.length === 0 ? <div aria-label="Preguntas sugeridas" className="grid grid-cols-2 gap-2">
        {suggestions.map(([label, question]) => <button key={label} type="button" disabled={!available || chat.initializing} onClick={() => submit(question)}
          className="nv-chat-suggestion min-h-10 rounded-full border border-blue-dark/25 bg-white px-3 py-2 font-display text-xs font-semibold text-blue-dark hover:bg-paper-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-dark disabled:cursor-not-allowed disabled:opacity-45">{label}</button>)}
      </div> : null}
      {chat.messages.map((m, index) => {
        const streaming = chat.busy && m.role === "assistant" && !m.complete && index === chat.messages.length - 1;
        return <div key={m.id} className={`nv-chat-bubble whitespace-pre-wrap break-words rounded-2xl p-3.5 ${m.role === "user" ? "ml-7 rounded-br-sm bg-ink text-paper" : "mr-3 rounded-bl-sm border border-ink/10 bg-white"}`}>
        <span className={`mb-1 block font-display text-[11px] font-semibold ${m.role === "user" ? "text-paper/75" : "text-ink-soft"}`}>{m.role === "user" ? "Tú" : "Asistente"}</span>
        {streaming && !m.content ? <span className="nv-chat-typing" aria-hidden="true"><span /><span /><span /></span>
          : <p>{m.content || "Respuesta no completada."}{streaming ? <span aria-hidden="true" className="nv-chat-cursor" /> : null}</p>}
        {m.role === "assistant" && !m.complete && m.content && !chat.busy ? <span className="mt-1 block text-xs text-ink-soft">Respuesta incompleta</span> : null}
      </div>; })}
      {chat.initializing ? <p role="status" className="text-sm text-ink-soft">Conectando con el asistente…</p> : null}
      {chat.error ? <p role="alert" className="rounded-xl border border-ink/25 bg-white p-3 text-sm">{chat.error}</p> : null}
      {chat.init?.limits.remainingMessages === 0 ? <p className="text-sm">Llegaste al límite de esta sesión. {CHAT_CONTACT_HELP}</p> : null}
    </div>
    <div aria-live={open ? "polite" : "off"} aria-atomic="true" className="sr-only">{chat.busy ? "El asistente está escribiendo" : latest}</div>
    <footer className="min-h-0 shrink overflow-y-auto overscroll-contain border-t border-ink/10 bg-white px-4 py-3">
      <p id="chat-notice" className="mb-2 text-xs leading-snug text-ink-soft">No sustituye una consulta médica. No compartas información personal ni datos médicos sensibles.</p>
      <form onSubmit={event => { event.preventDefault(); submit(); }}>
        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="chat-message">Tu mensaje</label>
          <textarea ref={input} id="chat-message" rows={1} value={draft} maxLength={maxLength} disabled={!available || chat.initializing || chat.busy}
            onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }}
            placeholder="Escribe tu pregunta…" className="min-h-11 max-h-[136px] min-w-0 flex-1 resize-none rounded-xl border border-ink/25 bg-paper px-3 py-2.5 text-base leading-snug placeholder:text-ink-soft focus-visible:outline-2 focus-visible:outline-blue-dark disabled:opacity-60" />
          <button type={chat.busy ? "button" : "submit"} onClick={chat.busy ? chat.stop : undefined} disabled={!chat.busy && (!available || !draft.trim() || chat.initializing)} aria-label={chat.busy ? "Detener respuesta" : "Enviar mensaje"}
            className={`nv-chat-send flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-dark disabled:cursor-not-allowed disabled:bg-ink-soft disabled:opacity-35 ${chat.busy ? "bg-ink" : "bg-blue-dark"}`}>
            {chat.busy ? <Square size={16} aria-hidden="true" /> : <ArrowUp size={20} aria-hidden="true" />}
          </button>
        </div>
        <p className="mt-1 text-right font-display text-[10px] text-ink-soft">{draft.length}/{maxLength}</p>
      </form>
      <details className="mt-2 text-[11px] leading-snug text-ink-soft"><summary className="cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-dark">Sobre este asistente y tus datos</summary>
        <p className="mt-1">El texto se procesa con OpenAI. Novavision no guarda conversaciones; el proveedor puede conservar registros de seguridad hasta 30 días, salvo excepciones. El historial se borra al recargar. Usamos una cookie temporal para limitar el uso.</p>
      </details>
    </footer>
  </section>;
}
