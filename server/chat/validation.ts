import { z } from "zod";
import { getEncoding } from "js-tiktoken";
import type { ChatMessage } from "../../shared/chat.js";
import { LIMITS, type ChatConfig } from "./config.js";
import { ChatError } from "./errors.js";

const message = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), content: z.string().trim().min(1).max(LIMITS.messageChars) }).strict(),
  z.object({ role: z.literal("assistant"), content: z.string().trim().min(1).max(LIMITS.assistantChars) }).strict(),
]);
const request = z.object({ requestId: z.uuid(), contactMentioned: z.boolean().default(false), messages: z.array(message).min(1).max(LIMITS.messages) }).strict();

export function validateRequest(body: unknown) {
  const parsed = request.safeParse(body);
  if (!parsed.success) throw new ChatError(400, "invalid_request", "Revisa el mensaje e inténtalo de nuevo.");
  const { messages } = parsed.data;
  if (messages.length % 2 !== 1 || messages.some((m, i) => m.role !== (i % 2 ? "assistant" : "user"))) {
    throw new ChatError(400, "invalid_history", "La conversación no es válida. Recarga la página.");
  }
  for (const m of messages) m.content = m.content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  if (messages.some(m => !m.content.trim())) throw new ChatError(400, "invalid_request");
  return parsed.data;
}

export function fitHistory(messages: ChatMessage[], prompt: string, config: ChatConfig): ChatMessage[] {
  const tokenizer = getEncoding(config.OPENAI_TOKEN_ENCODING);
  const history = [...messages];
  // Bound tokenizer work for pathological repeated input. Independent chunks deliberately
  // overestimate normal text; framing and chunk-boundary allowances are included as well.
  const countText = (text: string) => {
    const points = Array.from(text); let tokens = 0;
    for (let i = 0; i < points.length; i += 128) tokens += tokenizer.encode(points.slice(i, i + 128).join(""), [], []).length + 4;
    return tokens;
  };
  const costs = history.map(m => countText(m.content) + 16);
  let count = countText(prompt) + 256 + costs.reduce((sum, cost) => sum + cost, 0);
  while (count > LIMITS.inputTokens && history.length > 1) { history.splice(0, 2); count -= costs.shift()! + costs.shift()!; }
  if (count > LIMITS.inputTokens) throw new ChatError(413, "context_too_large", "El mensaje es demasiado largo. Intenta resumirlo.");
  return history;
}
