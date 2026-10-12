import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, Square, X } from "lucide-react";
import { CHAT_CONTACT_HELP, CHAT_WELCOME } from "../../../shared/chat";
import { useChat } from "../../hooks/useChat";
import { useMobileScrollLock } from "../../hooks/useMobileScrollLock";
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
  const [viewport, setViewport] = useState({ height: window.innerHeight, offset: 0, top: 0, mobile: window.innerWidth < 640 });
  const panel = useRef<HTMLElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const touchY = useRef<number | null>(null);
  const [awayFromLatest, setAwayFromLatest] = useState(false);
  useMobileScrollLock(open && viewport.mobile);
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
    const maxHeight = Math.min(136, Math.max(44, viewport.height * 0.25));
    el.style.height = `${Math.min(maxHeight, Math.max(44, height))}px`;
    el.style.overflowY = height > maxHeight ? "auto" : "hidden";
  }, [draft, open, viewport.height]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const vv = window.visualViewport;
      setViewport({ height: vv?.height ?? window.innerHeight, offset: vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0, top: vv?.offsetTop ?? 0, mobile: window.innerWidth < 640 });
    };
    update(); window.addEventListener("resize", update); window.visualViewport?.addEventListener("resize", update); window.visualViewport?.addEventListener("scroll", update);
    close.current?.focus({ preventScroll: true });
    return () => { window.removeEventListener("resize", update); window.visualViewport?.removeEventListener("resize", update); window.visualViewport?.removeEventListener("scroll", update); };
  }, [open]);
  function scrollToLatest(smooth = false) {
    const el = log.current;
    if (!el || !follow.current) return;
    el.scrollTo?.({ top: el.scrollHeight, behavior: smooth && !reducedMotion() ? "smooth" : "instant" });
  }

  useLayoutEffect(() => {
    if (open) scrollToLatest();
  }, [chat.messages, chat.busy, chat.error, draft, viewport.height, open]);

  useEffect(() => {
    const el = log.current;
    if (!open || !el || typeof ResizeObserver === "undefined") return;
    // Privacy disclosures, fonts and the keyboard can resize the reading area.
    const observer = new ResizeObserver(() => { scrollToLatest(); });
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  function pauseFollow() {
    follow.current = false;
    const el = log.current;
    if (el) el.scrollTo?.({ top: el.scrollTop, behavior: "instant" });
  }

  function submit(text = draft) {
    if (!text.trim() || !available || chat.busy || chat.initializing) return;
    follow.current = true; void chat.send(text); setDraft("");
  }

  return <section ref={panel} id="novavision-chat" hidden={!open && !present} inert={!open} aria-hidden={!open} data-open={open} role="dialog" aria-modal={viewport.mobile || undefined} aria-labelledby="chat-title"
    onKeyDown={event => {
      if (event.key === "Escape") { event.stopPropagation(); onClose(); }
      if (event.key === "Tab" && viewport.mobile) {
        const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]') ?? []).filter(el => el.getClientRects().length > 0);
        const first = controls[0]; const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}
    style={viewport.mobile ? { top: viewport.top, height: viewport.height, maxHeight: viewport.height } : { bottom: `calc(${viewport.offset + (viewport.height < 500 ? 12 : 92)}px + env(safe-area-inset-bottom))`, maxHeight: `calc(${Math.max(180, viewport.height - (viewport.height < 500 ? 24 : 108))}px - env(safe-area-inset-bottom))` }}
    className="nv-chat fixed right-3 z-[90] h-[560px] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-ink/15 bg-paper text-ink sm:right-6 sm:w-[380px]">
    <header className="nv-chat-header flex shrink-0 items-center gap-3 border-b border-ink/10 bg-white px-4 py-2 text-ink">
      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center text-teal-dark"><Eye size={23} /></span>
      <div className="min-w-0 flex-1"><h2 id="chat-title" className="font-display text-sm font-bold tracking-[.16em]">NOVA</h2><p className="flex items-center gap-1.5 text-xs text-ink-soft"><span aria-hidden="true" data-active={available} className="nv-chat-status" />Asistente de Novavision</p></div>
      <button ref={close} type="button" onClick={onClose} aria-label="Cerrar conversación" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-paper focus-visible:outline-2 focus-visible:outline-blue-dark"><X size={18} /></button>
    </header>
    <div ref={log} tabIndex={0} onWheel={event => { if (event.deltaY < 0) pauseFollow(); }} onPointerDown={event => { if (event.pointerType === "mouse") pauseFollow(); }}
      onTouchStart={event => { touchY.current = event.touches[0]?.clientY ?? null; }}
      onTouchMove={event => {
        const y = event.touches[0]?.clientY;
        if (y !== undefined && touchY.current !== null && y > touchY.current) pauseFollow();
        touchY.current = y ?? null;
      }} onTouchEnd={() => { touchY.current = null; }}
      onKeyDown={event => { if (["ArrowUp", "PageUp", "Home"].includes(event.key)) pauseFollow(); }}
      onScroll={() => {
        const el = log.current; if (!el) return;
        // Resizing the keyboard/composer can clamp scrollTop without a reader scrolling up.
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 12;
        setAwayFromLatest(!atBottom);
        if (atBottom) follow.current = true;
      }}
      aria-label="Conversación" className="nv-chat-log min-h-12 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 text-[15px] leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-dark">
      <p className="nv-chat-bubble mr-3 rounded-2xl rounded-bl-sm bg-white p-3.5">{CHAT_WELCOME}</p>
      {chat.messages.length === 0 ? <div aria-label="Preguntas sugeridas" className="grid grid-cols-2 gap-2">
        {suggestions.map(([label, question]) => <button key={label} type="button" disabled={!available || chat.initializing} onClick={() => submit(question)}
          className="nv-chat-suggestion min-h-10 rounded-full border border-blue-dark/25 bg-white px-3 py-2 font-display text-xs font-semibold text-blue-dark hover:bg-paper-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-dark disabled:cursor-not-allowed disabled:opacity-45">{label}</button>)}
      </div> : null}
      {chat.messages.map((m, index) => {
        const streaming = chat.busy && m.role === "assistant" && !m.complete && index === chat.messages.length - 1;
        return <div key={m.id} className={`nv-chat-bubble whitespace-pre-wrap break-words rounded-2xl p-3.5 ${m.role === "user" ? "ml-7 rounded-br-sm bg-ink text-paper" : "mr-3 rounded-bl-sm bg-white"}`}>
        <span className="sr-only">{m.role === "user" ? "Tú" : "Asistente"}</span>
        {streaming && !m.content ? <span className="nv-chat-typing" aria-hidden="true"><span /><span /><span /></span>
          : <p>{m.content || "Respuesta no completada."}{streaming ? <span aria-hidden="true" className="nv-chat-cursor" /> : null}</p>}
        {m.role === "assistant" && !m.complete && m.content && !chat.busy ? <span className="mt-1 block text-xs text-ink-soft">Respuesta incompleta</span> : null}
      </div>; })}
      {chat.initializing ? <p role="status" className="text-sm text-ink-soft">Conectando con el asistente…</p> : null}
      {chat.error ? <p role="alert" className="rounded-xl border border-ink/25 bg-white p-3 text-sm">{chat.error}</p> : null}
      {chat.init?.limits.remainingMessages === 0 ? <p className="text-sm">Llegaste al límite de esta sesión. {CHAT_CONTACT_HELP}</p> : null}
    </div>
    {awayFromLatest ? <button type="button" className="nv-chat-latest" onClick={() => { follow.current = true; scrollToLatest(true); }}>
      <ArrowDown size={14} aria-hidden="true" /> Volver al último mensaje
    </button> : null}
    <div aria-live={open ? "polite" : "off"} aria-atomic="true" className="sr-only">{chat.busy ? "El asistente está escribiendo" : latest}</div>
    <footer className="nv-chat-footer min-h-0 max-h-[50%] shrink-0 overflow-y-auto overscroll-contain border-t border-ink/10 bg-white px-4 py-3">
      <form onSubmit={event => { event.preventDefault(); submit(); }}>
        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="chat-message">Tu mensaje</label>
          <textarea ref={input} id="chat-message" rows={1} value={draft} maxLength={maxLength} disabled={!available || chat.initializing} readOnly={chat.busy} aria-busy={chat.busy}
            onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }}
            placeholder="Escribe tu pregunta…" className="min-h-11 max-h-[136px] min-w-0 flex-1 resize-none rounded-xl border border-ink/25 bg-paper px-3 py-2.5 text-base leading-snug placeholder:text-ink-soft focus-visible:outline-2 focus-visible:outline-blue-dark disabled:opacity-60" />
          <button onPointerDown={event => { if (document.activeElement === input.current) event.preventDefault(); }} type={chat.busy ? "button" : "submit"} onClick={chat.busy ? chat.stop : undefined} disabled={!chat.busy && (!available || !draft.trim() || chat.initializing)} aria-label={chat.busy ? "Detener respuesta" : "Enviar mensaje"}
            className={`nv-chat-send flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-dark disabled:cursor-not-allowed disabled:bg-ink-soft disabled:opacity-35 ${chat.busy ? "bg-ink" : "bg-blue-dark"}`}>
            {chat.busy ? <Square size={16} aria-hidden="true" /> : <ArrowUp size={20} aria-hidden="true" />}
          </button>
        </div>
        {draft.length >= maxLength * 0.9 ? <p className="mt-1 text-right text-[11px] text-ink-soft" role="status">{draft.length}/{maxLength}</p> : null}
      </form>
      <details className="mt-2 text-xs leading-relaxed text-ink-soft"><summary className="cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-dark">Sobre este asistente y tus datos</summary>
        <p id="chat-notice" className="mt-2">No sustituye una consulta médica. No compartas información personal ni datos médicos sensibles.</p>
        <p className="mt-2">El texto se procesa con OpenAI. Novavision no guarda conversaciones; el proveedor puede conservar registros de seguridad hasta 30 días, salvo excepciones. El historial se borra al recargar. Usamos una cookie temporal para limitar el uso.</p>
      </details>
    </footer>
  </section>;
}
