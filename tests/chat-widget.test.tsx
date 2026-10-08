// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ChatPanel from "../src/components/chat/ChatPanel";
import { readChatStream } from "../src/lib/chatStream";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const init = { available: true, limits: { maxMessageChars: 1000, maxSessionMessages: 20, remainingMessages: 20 } };
function sse(text: string) {
  return new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(text)); c.close(); } }), { headers: { "content-type": "text/event-stream" } });
}
it("parses split UTF-8 and SSE frames", async () => {
  const events: unknown[] = [];
  const bytes = new TextEncoder().encode('event: delta\ndata: {"text":"visión 👁"}\n\nevent: done\ndata: {"requestId":"id"}\n\n');
  const body = new ReadableStream<Uint8Array>({ start(c) { for (const byte of bytes) c.enqueue(Uint8Array.of(byte)); c.close(); } });
  await readChatStream(body, e => events.push(e));
  expect(events[0]).toEqual({ event: "delta", data: { text: "visión 👁" } });
});
it("rejects a stream without a terminal event", async () => {
  await expect(readChatStream(sse('event: delta\ndata: {"text":"parcial"}\n\n').body!, () => undefined)).rejects.toThrow("interrumpió");
});
it("points to the floating button if initialization fails without rendering chat contacts", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  render(<ChatPanel open onClose={() => undefined} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("botón verde de WhatsApp del sitio");
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByText("Agendar por WhatsApp")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enviar mensaje" })).toBeDisabled();
});
it("renders streamed text safely and preserves it when hidden", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json(init)).mockResolvedValueOnce(sse('event: delta\ndata: {"text":"<script>alert(1)</script>"}\n\nevent: done\ndata: {"requestId":"id"}\n\n'));
  vi.stubGlobal("fetch", fetcher);
  const { rerender, container } = render(<ChatPanel open onClose={() => undefined} />);
  await waitFor(() => expect(screen.getByLabelText("Tu mensaje")).toBeEnabled());
  fireEvent.change(screen.getByLabelText("Tu mensaje"), { target: { value: "Horario" } }); fireEvent.click(screen.getByLabelText("Enviar mensaje"));
  await waitFor(() => expect(screen.getAllByText("<script>alert(1)</script>").length).toBeGreaterThan(0));
  expect(container.querySelector("script")).toBeNull();
  rerender(<ChatPanel open={false} onClose={() => undefined} />); rerender(<ChatPanel open onClose={() => undefined} />);
  expect(screen.getAllByText("<script>alert(1)</script>").length).toBeGreaterThan(0);
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it("does not replay partial messages to the model", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json(init))
    .mockResolvedValueOnce(sse('event: delta\ndata: {"text":"parcial"}\n\n'))
    .mockResolvedValueOnce(sse('event: delta\ndata: {"text":"completa"}\n\nevent: done\ndata: {}\n\n'));
  vi.stubGlobal("fetch", fetcher); render(<ChatPanel open onClose={() => undefined} />);
  await waitFor(() => expect(screen.getByLabelText("Tu mensaje")).toBeEnabled());
  fireEvent.change(screen.getByLabelText("Tu mensaje"), { target: { value: "Primera" } }); fireEvent.click(screen.getByLabelText("Enviar mensaje"));
  await screen.findByRole("alert");
  fireEvent.change(screen.getByLabelText("Tu mensaje"), { target: { value: "Segunda" } }); fireEvent.click(screen.getByLabelText("Enviar mensaje"));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
  const payload = JSON.parse(fetcher.mock.calls[2][1].body);
  expect(payload.messages).toEqual([{ role: "user", content: "Segunda" }]);
  expect(payload.contactMentioned).toBe(true); // The interruption error offered the floating button.
});

it("remembers contact mentions after history trimming and panel closure, until remount", async () => {
  let replies = 0;
  const fetcher = vi.fn(async (_url: unknown, options?: RequestInit) => {
    if (!options?.method) return Response.json(init);
    const text = replies++ === 0 ? "Usa el botón verde de WhatsApp del sitio." : "Horario aprobado.";
    return sse(`event: delta\ndata: ${JSON.stringify({ text })}\n\nevent: done\ndata: {}\n\n`);
  });
  vi.stubGlobal("fetch", fetcher);
  const { rerender, unmount } = render(<ChatPanel open onClose={() => undefined} />);
  async function send(question: string) {
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Tu mensaje"), { target: { value: question } });
    fireEvent.click(screen.getByLabelText("Enviar mensaje"));
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje")).toBeEnabled());
  }
  for (let i = 0; i < 6; i++) await send(`Pregunta ${i}`);
  rerender(<ChatPanel open={false} onClose={() => undefined} />);
  rerender(<ChatPanel open onClose={() => undefined} />);
  await send("Más horarios");
  const first = JSON.parse(fetcher.mock.calls[1][1]!.body as string);
  const last = JSON.parse(fetcher.mock.calls.at(-1)![1]!.body as string);
  expect(first.contactMentioned).toBe(false);
  expect(last.contactMentioned).toBe(true);
  expect(last.messages).toHaveLength(9);
  expect(JSON.stringify(last.messages)).not.toContain("WhatsApp");
  unmount(); render(<ChatPanel open onClose={() => undefined} />);
  await send("Nueva conversación");
  expect(JSON.parse(fetcher.mock.calls.at(-1)![1]!.body as string).contactMentioned).toBe(false);
});

it("offers the floating button after a failed POST even if already mentioned", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json(init))
    .mockResolvedValueOnce(sse('event: delta\ndata: {"text":"Usa el botón verde de WhatsApp del sitio."}\n\nevent: done\ndata: {}\n\n'))
    .mockRejectedValueOnce(new TypeError("Failed to fetch"));
  vi.stubGlobal("fetch", fetcher); render(<ChatPanel open onClose={() => undefined} />);
  for (const question of ["¿Cómo agendar?", "Horarios"]) {
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Tu mensaje"), { target: { value: question } });
    fireEvent.click(screen.getByLabelText("Enviar mensaje"));
  }
  expect(await screen.findByRole("alert")).toHaveTextContent("botón verde de WhatsApp del sitio");
});

it("sends suggestions once and shows accessible typing dots, then a streaming cursor", async () => {
  let stream!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(controller) { stream = controller; } });
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json(init))
    .mockResolvedValueOnce(new Response(body, { headers: { "content-type": "text/event-stream" } }));
  vi.stubGlobal("fetch", fetcher);
  const { container } = render(<ChatPanel open onClose={() => undefined} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Horarios" })).toBeEnabled());
  expect(screen.getByLabelText("Preguntas sugeridas").querySelectorAll("button")).toHaveLength(4);
  fireEvent.click(screen.getByRole("button", { name: "Horarios" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  expect(JSON.parse(fetcher.mock.calls[1][1].body).messages).toEqual([{ role: "user", content: "¿Cuál es el horario de atención?" }]);
  expect(screen.queryByLabelText("Preguntas sugeridas")).not.toBeInTheDocument();
  expect(container.querySelectorAll(".nv-chat-typing span")).toHaveLength(3);
  expect(screen.getByText("El asistente está escribiendo")).toHaveAttribute("aria-live", "polite");
  expect(screen.getByLabelText("Detener respuesta")).toBeEnabled();
  await act(async () => { stream.enqueue(new TextEncoder().encode('event: delta\ndata: {"text":"Horario aprobado."}\n\n')); });
  expect(container.querySelector(".nv-chat-typing")).toBeNull();
  expect(container.querySelector(".nv-chat-cursor")).toHaveAttribute("aria-hidden", "true");
  await act(async () => { stream.enqueue(new TextEncoder().encode('event: done\ndata: {}\n\n')); stream.close(); });
  expect(container.querySelector(".nv-chat-cursor")).toBeNull();
  expect(screen.queryByLabelText("Detener respuesta")).not.toBeInTheDocument();
});

it("makes a closing panel inert immediately and hides it after the exit transition", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(init)));
  const { rerender, container } = render(<ChatPanel open onClose={() => undefined} />);
  await waitFor(() => expect(screen.getByLabelText("Tu mensaje")).toBeEnabled());
  rerender(<ChatPanel open={false} onClose={() => undefined} />);
  const panel = container.querySelector("#novavision-chat")!;
  expect(panel).toHaveAttribute("inert"); expect(panel).toHaveAttribute("aria-hidden", "true");
  await waitFor(() => expect(panel).toHaveAttribute("hidden"));
  rerender(<ChatPanel open onClose={() => undefined} />);
  expect(panel).not.toHaveAttribute("inert"); expect(panel).not.toHaveAttribute("hidden");
  expect(screen.getByLabelText("Cerrar conversación")).toHaveFocus();
});

it("stops a pending response from the composer and removes the typing indicator", async () => {
  const fetcher = vi.fn(async (_url: unknown, options?: RequestInit) => {
    if (!options?.method) return Response.json(init);
    return new Response(new ReadableStream({ start(controller) {
      options.signal?.addEventListener("abort", () => controller.error(new DOMException("Stopped", "AbortError")), { once: true });
    } }), { headers: { "content-type": "text/event-stream" } });
  });
  vi.stubGlobal("fetch", fetcher);
  const { container } = render(<ChatPanel open onClose={() => undefined} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Ubicación" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Ubicación" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  fireEvent.click(screen.getByLabelText("Detener respuesta"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Respuesta detenida");
  expect(screen.getByLabelText("Tu mensaje")).toBeEnabled();
  expect(container.querySelector(".nv-chat-typing")).toBeNull();
  expect(container.querySelector(".nv-chat-cursor")).toBeNull();
});
