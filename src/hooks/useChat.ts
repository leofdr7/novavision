import { useEffect, useRef, useState } from "react";
import { CHAT_CONTACT_HELP, CHAT_UNAVAILABLE, type ChatInit, type ChatMessage } from "../../shared/chat";
import { readChatStream } from "../lib/chatStream";

export type DisplayMessage = ChatMessage & { id: string; complete: boolean };

export function useChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [init, setInit] = useState<ChatInit | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  // Survives history trimming and panel closure, but never leaves tab memory as storage.
  const contactMentioned = useRef(false);

  useEffect(() => {
    const abort = new AbortController();
    void fetch("/api/chat", { credentials: "same-origin", signal: AbortSignal.any([abort.signal, AbortSignal.timeout(15_000)]) })
      .then(async response => {
        if (!response.ok) throw new Error(CHAT_UNAVAILABLE);
        const data = await response.json() as ChatInit;
        if (!data.limits || typeof data.available !== "boolean") throw new Error(CHAT_UNAVAILABLE);
        setInit(data);
        if (!data.available) { contactMentioned.current = true; setError(CHAT_UNAVAILABLE); }
      }).catch(() => { if (!abort.signal.aborted) { contactMentioned.current = true; setError(CHAT_UNAVAILABLE); } })
      .finally(() => { if (!abort.signal.aborted) setInitializing(false); });
    return () => { abort.abort(); controller.current?.abort(); };
  }, []);

  async function send(content: string) {
    content = content.trim();
    if (!content || controller.current || !init?.available || content.length > init.limits.maxMessageChars || init.limits.remainingMessages <= 0) return;
    const abort = new AbortController(); controller.current = abort;
    const id = crypto.randomUUID();
    // Only complete pairs are eligible for replay; interrupted answers are never model history.
    const history: ChatMessage[] = [];
    for (let i = 0; i < messages.length - 1; i += 2) {
      if (messages[i + 1].complete) history.push({ role: "user", content: messages[i].content }, { role: "assistant", content: messages[i + 1].content });
    }
    setMessages(current => [...current, { id, role: "user", content, complete: true }, { id: `${id}-answer`, role: "assistant", content: "", complete: false }]);
    setBusy(true); setError(null);
    let answer = "";
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; abort.abort(); }, 55_000);
    try {
      const response = await fetch("/api/chat", { method: "POST", credentials: "same-origin", signal: abort.signal,
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: id, contactMentioned: contactMentioned.current, messages: [...history.slice(-8), { role: "user", content }] }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (["budget_exceeded", "session_limit", "session_expired", "chat_unavailable"].includes(data?.error?.code)) setInit(current => current ? { ...current, available: false } : current);
        throw new Error(data?.error?.message || CHAT_UNAVAILABLE);
      }
      if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) throw new Error(CHAT_UNAVAILABLE);
      await readChatStream(response.body, event => {
        if (event.event === "meta") setInit(current => current ? { ...current, limits: { ...current.limits, remainingMessages: event.data.remainingMessages } } : current);
        if (event.event === "delta") {
          answer += event.data.text;
          if (/whatsapp/i.test(answer)) contactMentioned.current = true;
          if (answer.length > 4000) throw new Error(`La respuesta es demasiado larga. ${CHAT_CONTACT_HELP}`);
          const text = answer;
          setMessages(current => current.map(m => m.id === `${id}-answer` ? { ...m, content: text } : m));
        }
        if (event.event === "done") {
          if (!answer.trim()) throw new Error(CHAT_UNAVAILABLE);
          setMessages(current => current.map(m => m.id === `${id}-answer` ? { ...m, complete: true } : m));
        }
      });
    } catch (failure) {
      if (abort.signal.aborted && !timedOut) setError("Respuesta detenida. Puedes enviar otro mensaje.");
      else {
        const message = timedOut ? "La respuesta tardó demasiado. Inténtalo de nuevo." : failure instanceof Error && !(failure instanceof TypeError) ? failure.message : CHAT_UNAVAILABLE;
        contactMentioned.current = true;
        setError(/whatsapp/i.test(message) ? message : `${message} ${CHAT_CONTACT_HELP}`);
      }
    } finally {
      clearTimeout(timeout); abort.abort(); controller.current = null; setBusy(false);
    }
  }
  return { messages, init, initializing, busy, error, send, stop: () => controller.current?.abort() };
}
