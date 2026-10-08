import { expect, test } from "@playwright/test";

const init = { available: true, limits: { maxMessageChars: 1000, maxSessionMessages: 20, remainingMessages: 20 } };
test("lazy chat, streaming, panel coordination, keyboard and memory", async ({ page }) => {
  const chunks: string[] = [];
  page.on("request", req => { if (/ChatPanel.*\.js/.test(req.url())) chunks.push(req.url()); });
  await page.route("**/api/chat", async route => {
    if (route.request().method() === "GET") await route.fulfill({ json: init });
    else await route.fulfill({ contentType: "text/event-stream", body: 'event: meta\ndata: {"requestId":"test","remainingMessages":19}\n\nevent: delta\ndata: {"text":"Lunes a viernes de 8:00 AM a 6:00 PM."}\n\nevent: done\ndata: {"requestId":"test"}\n\n' });
  });
  await page.goto("/"); expect(chunks).toHaveLength(0);
  await page.getByRole("button", { name: "Consultar al asistente" }).click();
  const dialog = page.getByRole("dialog"); await expect(dialog).toBeVisible(); expect(chunks).toHaveLength(1);
  await expect(dialog.getByRole("link")).toHaveCount(0);
  await expect(dialog.getByText("Agendar por WhatsApp")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Cerrar conversación" })).toBeFocused();
  await dialog.getByLabel("Tu mensaje").fill("¿Cuál es el horario?"); await dialog.getByLabel("Tu mensaje").press("Enter");
  await expect(dialog.getByText("Lunes a viernes de 8:00 AM a 6:00 PM.", { exact: true }).first()).toBeVisible();
  await dialog.getByRole("button", { name: "Cerrar conversación" }).focus(); await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible(); await expect(page.getByRole("button", { name: "Consultar al asistente" })).toBeFocused();
  await page.getByRole("button", { name: "Agendar cita por WhatsApp", exact: true }).click();
  await expect(page.getByText("¿Con quién deseas agendar?", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Consultar al asistente" }).click();
  await expect(page.getByText("¿Con quién deseas agendar?", { exact: true })).not.toBeVisible();
  await expect(dialog.getByText("¿Cuál es el horario?", { exact: true })).toBeVisible();
  const box = await dialog.boundingBox(); const vp = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width); expect(box!.y).toBeGreaterThanOrEqual(0);
  await page.screenshot({ path: `test-results/chat-${vp.width}.png`, animations: "disabled" });
  await page.reload(); await page.getByRole("button", { name: "Consultar al asistente" }).click();
  await expect(page.getByRole("dialog").getByText("¿Cuál es el horario?", { exact: true })).not.toBeVisible();
});

test("keeps WhatsApp reachable during service failure with no chat Ads event", async ({ page }) => {
  await page.route("**/api/chat", route => route.fulfill({ status: 503, json: { error: { message: "No disponible" } } }));
  await page.goto("/");
  await page.evaluate(() => { window.gtag = (...args: unknown[]) => { window.dataLayer!.push(args); }; window.dataLayer = []; });
  await page.getByRole("button", { name: "Consultar al asistente" }).click();
  const dialog = page.getByRole("dialog"); await expect(dialog.getByRole("alert")).toContainText("botón verde de WhatsApp del sitio");
  await expect(dialog.getByRole("link")).toHaveCount(0);
  expect(await page.evaluate(() => window.dataLayer)).toEqual([]);
  await page.getByRole("button", { name: "Agendar cita por WhatsApp", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("link", { name: /^Dr\. Andy Alvarenga/ })).toHaveAttribute("href", /wa.me\/50370681751/);
  await expect(page.getByRole("link", { name: /^Dra\. Karla Vides/ })).toHaveAttribute("href", /wa.me\/50379893654/);
});

test("keeps controls reachable with a short viewport and expanded privacy notice", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 350 });
  await page.route("**/api/chat", route => route.fulfill({ json: init }));
  await page.goto("/"); await page.getByRole("button", { name: "Consultar al asistente" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tu mensaje").fill("Horarios");
  await dialog.getByText("Sobre este asistente y tus datos", { exact: true }).click();
  const send = dialog.getByRole("button", { name: "Enviar mensaje" });
  await send.scrollIntoViewIfNeeded();
  const box = await send.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0); expect(box!.y + box!.height).toBeLessThanOrEqual(350);
  await dialog.getByLabel("Tu mensaje").scrollIntoViewIfNeeded();
  await expect(dialog.getByLabel("Tu mensaje")).toBeVisible();
  await dialog.getByLabel("Cerrar conversación").click();
  await expect(dialog).not.toBeVisible();
});

test("grows the composer, preserves Shift+Enter, and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let question = "";
  await page.route("**/api/chat", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: init });
    question = route.request().postDataJSON().messages.at(-1).content;
    await route.fulfill({ contentType: "text/event-stream", body: 'event: delta\ndata: {"text":"Horario aprobado."}\n\nevent: done\ndata: {}\n\n' });
  });
  await page.goto("/"); await page.getByRole("button", { name: "Consultar al asistente" }).click();
  const dialog = page.getByRole("dialog");
  const input = dialog.getByLabel("Tu mensaje");
  await expect(input).toBeEnabled();
  await page.screenshot({ path: `test-results/chat-initial-${page.viewportSize()!.width}.png`, animations: "disabled" });
  const initialHeight = (await input.boundingBox())!.height;
  await expect(dialog.getByLabel("Enviar mensaje")).toBeDisabled();
  await input.fill("Horarios"); await input.press("Shift+Enter"); await input.press("x");
  await expect(input).toHaveValue("Horarios\nx"); expect(question).toBe("");
  expect((await input.boundingBox())!.height).toBeGreaterThan(initialHeight);
  await input.fill("Más información\n".repeat(20));
  expect((await input.boundingBox())!.height).toBeLessThanOrEqual(136);
  expect(await input.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  await input.fill("Horarios\ny ubicación"); await input.press("Enter");
  await expect.poll(() => question).toBe("Horarios\ny ubicación");
  await expect(input).toHaveValue(""); await expect(input).toBeEnabled();
  expect((await input.boundingBox())!.height).toBe(initialHeight);
  expect(await dialog.evaluate(el => getComputedStyle(el).transitionDuration)).toBe("0s");
  for (const selector of [".nv-chat-bubble", ".nv-chat-status"]) {
    expect(await dialog.locator(selector).first().evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  }
});

test("follows replies smoothly but leaves readers at their chosen scroll position", async ({ page }) => {
  let releaseReply!: () => void;
  const pending = new Promise<void>(resolve => { releaseReply = resolve; });
  let count = 0;
  const longAnswer = "Información sobre nuestros servicios. ".repeat(45);
  await page.route("**/api/chat", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: init });
    if (++count === 2) await pending;
    await route.fulfill({ contentType: "text/event-stream", body: `event: delta\ndata: ${JSON.stringify({ text: count === 1 ? longAnswer : "Segunda respuesta disponible." })}\n\nevent: done\ndata: {}\n\n` });
  });
  await page.goto("/"); await page.getByRole("button", { name: "Consultar al asistente" }).click();
  const dialog = page.getByRole("dialog"); const log = dialog.getByLabel("Conversación", { exact: true });
  await dialog.getByRole("button", { name: "Servicios", exact: true }).click();
  await expect(dialog.getByLabel("Tu mensaje")).toBeEnabled();
  await expect.poll(() => log.evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(12);
  await dialog.getByLabel("Tu mensaje").fill("Más información"); await dialog.getByLabel("Enviar mensaje").click();
  await expect(dialog.locator(".nv-chat-typing span")).toHaveCount(3);
  await expect.poll(() => log.evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(12);
  await log.evaluate(el => el.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => log.evaluate(el => el.scrollTop)).toBe(0);
  releaseReply();
  await expect(dialog.getByLabel("Tu mensaje")).toBeEnabled();
  // Let any incorrectly scheduled smooth scroll finish before checking the reader's position.
  await page.waitForTimeout(350);
  expect(await log.evaluate(el => el.scrollTop)).toBe(0);
  await page.screenshot({ path: `test-results/chat-reading-${page.viewportSize()!.width}.png`, animations: "disabled" });
});
