import { CHAT_CONTACT_HELP } from "../../shared/chat.js";
import OpenAI from "openai";
import type { ChatMessage } from "../../shared/chat.js";
import type { Usage } from "./budget.js";
import { LIMITS, type ChatConfig } from "./config.js";
import { ChatError } from "./errors.js";
import { SYSTEM_PROMPT } from "./prompt.js";

export type AnswerPart = { text: string } | { usage: Usage } | { complete: true };
export async function* streamAnswer(config: ChatConfig, messages: ChatMessage[], signal: AbortSignal, prompt = SYSTEM_PROMPT): AsyncGenerator<AnswerPart> {
  const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY, maxRetries: 0, timeout: LIMITS.timeoutMs });
  const stream = await openai.responses.create({
    model: config.OPENAI_MODEL, instructions: prompt, input: messages,
    stream: true, store: false, max_output_tokens: LIMITS.outputTokens,
  }, { signal });
  for await (const event of stream) {
    if (event.type === "response.output_text.delta") yield { text: event.delta };
    if (event.type === "response.completed" || event.type === "response.incomplete" || event.type === "response.failed") {
      const usage = event.response.usage;
      if (usage) yield { usage: { input: usage.input_tokens, cached: usage.input_tokens_details.cached_tokens, output: usage.output_tokens } };
      if (event.type !== "response.completed" || !usage) throw new ChatError(502, "incomplete_response", `La respuesta se interrumpió. Puedes intentarlo de nuevo. ${CHAT_CONTACT_HELP}`);
      yield { complete: true };
      return;
    }
    if (event.type === "error") throw new ChatError(502, "provider_error");
  }
  throw new ChatError(502, "incomplete_response");
}
