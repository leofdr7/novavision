import { CHAT_CONTACT_HELP } from "../../shared/chat";
import type { ChatEvent } from "../../shared/chat";

export async function readChatStream(body: ReadableStream<Uint8Array>, onEvent: (event: ChatEvent) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let complete = false;
  try {
    while (!complete) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      buffer = buffer.replace(/\r\n/g, "\n");
      let end: number;
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, end); buffer = buffer.slice(end + 2);
        const lines = block.split("\n");
        const event = lines.find(l => l.startsWith("event:"))?.slice(6).trim();
        const data = lines.filter(l => l.startsWith("data:")).map(l => l.slice(5).trimStart()).join("\n");
        if (!event || !data) continue;
        const parsed: unknown = JSON.parse(data);
        if (typeof parsed !== "object" || parsed === null) throw new Error("Respuesta inválida.");
        if (event === "delta" && !("text" in parsed && typeof parsed.text === "string")) throw new Error("Respuesta inválida.");
        if (event === "meta" && !("remainingMessages" in parsed && typeof parsed.remainingMessages === "number")) throw new Error("Respuesta inválida.");
        if (!["meta", "delta", "done", "error"].includes(event)) continue;
        onEvent({ event, data: parsed } as ChatEvent);
        if (event === "error") throw new Error(`La respuesta se interrumpió. ${CHAT_CONTACT_HELP}`);
        if (event === "done") { complete = true; break; }
      }
      if (buffer.length > 32_768) throw new Error("Respuesta demasiado larga.");
      if (done) break;
    }
    if (!complete) throw new Error(`La respuesta se interrumpió. Inténtalo de nuevo. ${CHAT_CONTACT_HELP}`);
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
