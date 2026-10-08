import { afterEach, expect, it, vi } from "vitest";
import { streamAnswer } from "../server/chat/stream";
import { testConfig } from "./helpers";
import { conversationPrompt } from "../server/chat/prompt";
afterEach(() => vi.unstubAllGlobals());

it("calls Responses with the configured model, no storage, streaming and a token cap", async () => {
  let payload: Record<string, unknown> | undefined;
  vi.stubGlobal("fetch", vi.fn(async (_url: unknown, options: RequestInit) => {
    payload = JSON.parse(options.body as string);
    return new Response([
      'data: {"type":"response.output_text.delta","delta":"Horario aprobado."}\n\n',
      'data: {"type":"response.completed","response":{"usage":{"input_tokens":100,"input_tokens_details":{"cached_tokens":20},"output_tokens":30}}}\n\n',
      'data: [DONE]\n\n',
    ].join(""), { headers: { "content-type": "text/event-stream" } });
  }));
  const events = [];
  const prompt = conversationPrompt(true);
  for await (const event of streamAnswer(testConfig(), [{ role: "user", content: "Horario" }], new AbortController().signal, prompt)) events.push(event);
  expect(payload).toMatchObject({ model: "configured-test-model", store: false, stream: true, max_output_tokens: 400 });
  expect(payload).not.toHaveProperty("previous_response_id"); expect(payload).not.toHaveProperty("tools");
  expect(payload?.instructions).toBe(prompt);
  expect(events).toEqual([{ text: "Horario aprobado." }, { usage: { input: 100, cached: 20, output: 30 } }, { complete: true }]);
});
it("accounts incomplete responses but never marks them complete", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response('data: {"type":"response.incomplete","response":{"usage":{"input_tokens":100,"input_tokens_details":{"cached_tokens":0},"output_tokens":400}}}\n\n', { headers: { "content-type": "text/event-stream" } })));
  const generator = streamAnswer(testConfig(), [{ role: "user", content: "Horario" }], new AbortController().signal);
  expect((await generator.next()).value).toEqual({ usage: { input: 100, cached: 0, output: 400 } });
  await expect(generator.next()).rejects.toMatchObject({ code: "incomplete_response" });
});
