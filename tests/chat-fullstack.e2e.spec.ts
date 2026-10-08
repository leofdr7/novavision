import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { test, expect } from "@playwright/test";
import { createChatHandler } from "../api/chat";
import { monthKey } from "../server/chat/budget";
import { closeServer, listen, redisHarness, testConfig } from "./helpers";
import type { AnswerPart } from "../server/chat/stream";

test.describe("browser → actual API → Redis → streamed answer", () => {
  test.skip(!process.env.TEST_REDIS_URL, "Requires a disposable Redis instance; OpenAI output is simulated.");
  let harness: Awaited<ReturnType<typeof redisHarness>>;
  const settings = testConfig();
  let base: string;
  let calls = 0;
  let oldOrigin: string | undefined;
  const root = resolve("dist");
  const types: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".jpeg": "image/jpeg", ".jpg": "image/jpeg" };
  const handler = createChatHandler({ readConfig: () => settings, makeRedis: () => harness.redis,
    streamAnswer: async function* (): AsyncGenerator<AnswerPart> {
      calls++;
      yield { text: "Lunes a viernes " };
      await new Promise(resolve => setTimeout(resolve, 80));
      yield { text: "de 8:00 AM a 6:00 PM." };
      yield { usage: { input: 100, cached: 0, output: 20 } }; yield { complete: true };
    },
  });
  const server = createServer(async (req, res) => {
    if (req.url === "/api/chat") { await handler(req, res); return; }
    const path = resolve(root, "." + new URL(req.url!, "http://localhost").pathname);
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const target = path === root ? resolve(root, "index.html") : path;
    try { res.setHeader("Content-Type", types[extname(target)] ?? "application/octet-stream"); res.end(await readFile(target)); }
    catch { res.writeHead(404); res.end(); }
  });
  test.beforeAll(async () => {
    harness = await redisHarness(); base = await listen(server);
    oldOrigin = process.env.ALLOWED_ORIGIN; process.env.ALLOWED_ORIGIN = base;
  });
  test.afterAll(async () => {
    if (!harness) return;
    await closeServer(server); await harness.close();
    if (oldOrigin === undefined) delete process.env.ALLOWED_ORIGIN; else process.env.ALLOWED_ORIGIN = oldOrigin;
  });
  test("uses a signed cookie, enforces the backend, and records consumption", async ({ page }) => {
    await page.goto(base); await page.getByRole("button", { name: "Consultar al asistente" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Tu mensaje")).toBeEnabled();
    expect((await page.context().cookies()).some(c => c.name === "nv_chat" && c.httpOnly && c.sameSite === "Strict")).toBe(true);
    await dialog.getByLabel("Tu mensaje").fill("¿Qué horario tienen?"); await dialog.getByLabel("Enviar mensaje").click();
    await expect(dialog.getByText("Lunes a viernes de 8:00 AM a 6:00 PM.", { exact: true }).first()).toBeVisible();
    await expect(dialog.getByLabel("Tu mensaje")).toBeEnabled();
    expect(calls).toBe(1);
    expect(Number(await harness.redis.hget(`${settings.namespace}:budget:${monthKey()}`, "used"))).toBe(72000);
    expect(Number(await harness.redis.hget(`${settings.namespace}:budget:${monthKey()}`, "reserved"))).toBe(0);
    await dialog.getByLabel("Tu mensaje").fill("Me duele el ojo"); await dialog.getByLabel("Enviar mensaje").click();
    await expect(dialog.getByText(/acude ahora a un servicio de emergencias o llama al 911/).first()).toBeVisible();
    expect(calls).toBe(1);
  });
});
