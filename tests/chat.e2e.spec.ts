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

for (const resizeLayout of [false, true]) {
test(`mobile keyboard preserves reading space when ${resizeLayout ? "both viewports resize" : "only the visual viewport resizes"}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/chat", route => route.request().method() === "GET"
    ? route.fulfill({ json: init })
    : route.fulfill({ contentType: "text/event-stream", body: 'event: delta\ndata: {"text":"Atendemos de lunes a viernes de 8:00 AM a 6:00 PM y los sábados de 8:00 AM a 2:00 PM."}\n\nevent: done\ndata: {}\n\n' }));
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.getByRole("button", { name: "Consultar al asistente" }).click();
  const dialog = page.getByRole("dialog");
  const input = dialog.getByLabel("Tu mensaje");
  await expect(input).toBeEnabled();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await expect(dialog.locator("#chat-notice")).not.toBeVisible();
  await expect(dialog.getByText("0/1000", { exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Horarios", exact: true }).click();
  await expect(dialog.getByText(/^Atendemos de lunes/).first()).toBeVisible();
  await expect(input).toBeEnabled();

  await input.focus();
  // Cover browsers that resize either the visual viewport or both viewports.
  if (resizeLayout) await page.setViewportSize({ width: 390, height: 360 });
  else await page.evaluate(() => {
      Object.defineProperty(window.visualViewport, "height", { configurable: true, value: 360 });
      Object.defineProperty(window.visualViewport, "offsetTop", { configurable: true, value: 44 });
      window.visualViewport!.dispatchEvent(new Event("resize"));
      window.visualViewport!.dispatchEvent(new Event("scroll"));
    });
  const viewportTop = resizeLayout ? 0 : 44;
  const whatsapp = page.getByRole("button", { name: "Agendar cita por WhatsApp", exact: true, includeHidden: true });
  const launcher = page.getByRole("button", { name: "Cerrar asistente", includeHidden: true });
  await expect(dialog).toHaveAttribute("data-keyboard-open", "true");
  await expect(whatsapp).toBeHidden();
  await expect(launcher).toBeHidden();
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.y).toBe(viewportTop);
  expect(bounds.height).toBe(360);
  expect(bounds.x).toBe(0);
  expect(bounds.width).toBe(390);
  const composer = (await input.boundingBox())!;
  expect(composer.y + composer.height).toBeLessThanOrEqual(viewportTop + 360);
  expect((await dialog.getByLabel("Conversación", { exact: true }).boundingBox())!.height).toBeGreaterThan(195);
  await expect(input).toBeFocused();
  await input.fill("Texto largo\n".repeat(10));
  expect((await input.boundingBox())!.height).toBeLessThanOrEqual(90);
  await input.fill("x".repeat(900));
  await expect(dialog.getByText("900/1000", { exact: true })).toBeVisible();
  await input.fill("");
  await expect.poll(() => dialog.getByLabel("Conversación", { exact: true }).evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(12);
  await expect(dialog.getByRole("button", { name: "Volver al último mensaje" })).toBeHidden();
  await page.screenshot({ path: `test-results/chat-keyboard-${resizeLayout ? "both" : "visual"}-${test.info().project.name}.png`, clip: bounds, animations: "disabled" });

  await dialog.locator("summary").focus(); await page.keyboard.press("Tab");
  await expect(dialog.getByLabel("Cerrar conversación")).toBeFocused();
  await page.keyboard.press("Shift+Tab"); await expect(dialog.locator("summary")).toBeFocused();
  if (resizeLayout) await page.setViewportSize({ width: 390, height: 844 });
  else await page.evaluate(() => {
    delete (window.visualViewport as unknown as Record<string, unknown>).height;
    delete (window.visualViewport as unknown as Record<string, unknown>).offsetTop;
    window.visualViewport!.dispatchEvent(new Event("resize"));
  });
  await expect(dialog).toHaveAttribute("data-keyboard-open", "false");
  await expect(whatsapp).toBeVisible();
  await expect(launcher).toBeVisible();
  await expect.poll(async () => (await dialog.boundingBox())!.height).toBeGreaterThan(bounds.height);
  const restored = (await dialog.boundingBox())!;
  expect(restored.y + restored.height).toBeLessThan((await whatsapp.boundingBox())!.y);
  await dialog.getByLabel("Cerrar conversación").click();
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await expect(page.getByRole("button", { name: "Consultar al asistente" })).toBeFocused();
});
}

for (const width of [360, 768, 1280]) {
  test(`glass chat keeps WhatsApp and the composer reachable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.route("**/api/chat", route => route.fulfill({ json: init }));
    await page.goto("/");
    await page.getByRole("button", { name: "Consultar al asistente" }).click();
    const dialog = page.getByRole("dialog");
    const input = dialog.getByLabel("Tu mensaje");
    await expect(input).toBeEnabled();
    const whatsapp = page.getByRole("button", { name: "Agendar cita por WhatsApp", exact: true });
    await expect.poll(async () => {
      const panel = (await dialog.boundingBox())!;
      return panel.y + panel.height < (await whatsapp.boundingBox())!.y;
    }).toBe(true);
    const panel = (await dialog.boundingBox())!;
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await input.fill("Horarios");
    await expect(input).toBeInViewport();
    await expect(dialog.getByLabel("Enviar mensaje")).toBeInViewport();
    expect(await dialog.evaluate(el => getComputedStyle(el).backdropFilter)).toContain("blur(");
    expect(await dialog.locator("*").evaluateAll(elements => elements.every(el => getComputedStyle(el).backdropFilter === "none"))).toBe(true);
    await expect(whatsapp).toHaveCSS("background-color", "rgb(37, 211, 102)");
    await page.screenshot({ path: `test-results/glass-chat-${width}-${test.info().project.name}.png`, animations: "disabled" });
    await whatsapp.click();
    await expect(dialog).not.toBeVisible();
  });
}

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

test("follows replies without moving readers away from their chosen scroll position", async ({ page }) => {
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
  await log.dispatchEvent("pointerdown", { pointerType: "mouse" });
  await log.evaluate(el => el.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => log.evaluate(el => el.scrollTop)).toBe(0);
  releaseReply();
  await expect(dialog.getByLabel("Tu mensaje")).toHaveAttribute("aria-busy", "false");
  // Let any incorrectly scheduled smooth scroll finish before checking the reader's position.
  await page.waitForTimeout(350);
  expect(await log.evaluate(el => el.scrollTop)).toBe(0);
  await dialog.getByRole("button", { name: "Volver al último mensaje" }).click();
  await expect.poll(() => log.evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(12);
  await page.screenshot({ path: `test-results/chat-reading-${page.viewportSize()!.width}.png`, animations: "disabled" });
});

test("contact dock stays separate from WhatsApp and contains its scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 260 });
  await page.goto("/");
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
  const start = await page.evaluate(() => window.scrollY);
  const agent = page.getByRole("button", { name: "Consultar al asistente" });
  const whatsapp = page.getByRole("button", { name: "Agendar cita por WhatsApp", exact: true });
  const agentBox = (await agent.boundingBox())!;
  const whatsappBox = (await whatsapp.boundingBox())!;
  expect(agentBox.x + agentBox.width).toBeLessThan(whatsappBox.x);
  expect(agentBox.y).toBe(whatsappBox.y);
  await whatsapp.click();
  const options = page.getByRole("region", { name: "Especialistas disponibles por WhatsApp" });
  const box = (await options.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThan(agentBox.y);
  expect(await options.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  await options.hover();
  await page.mouse.wheel(0, 600);
  await expect.poll(() => options.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(start);
  await options.getByRole("link", { name: /^Dra\. Karla Vides/ }).click({ trial: true });
  await page.keyboard.press("Escape");
  await expect(options).not.toBeVisible();
  await expect(whatsapp).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(start);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `test-results/contact-dock-${test.info().project.name}.png`, animations: "disabled" });
});

test("mobile chat restores page position and keeps keyboard focus during replies", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release!: () => void;
  const reply = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/chat", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: init });
    await reply;
    await route.fulfill({ contentType: "text/event-stream", body: 'event: delta\ndata: {"text":"Estamos en Colonia Médica, San Salvador."}\n\nevent: done\ndata: {}\n\n' });
  });
  await page.goto("/");
  await page.evaluate(() => window.scrollTo({ top: 1100, behavior: "instant" }));
  const start = await page.evaluate(() => window.scrollY);
  const launcher = page.getByRole("button", { name: "Consultar al asistente" });
  await launcher.click();
  const dialog = page.getByRole("dialog");
  const input = dialog.getByLabel("Tu mensaje");
  await input.fill("¿Dónde están?");
  await dialog.getByLabel("Enviar mensaje").click();
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("readonly");
  await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe("fixed");
  release();
  await expect(input).not.toHaveAttribute("readonly");
  await expect(input).toBeFocused();
  await dialog.getByLabel("Cerrar conversación").click();
  await expect(dialog).not.toBeVisible();
  await expect(launcher).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(start);
  expect(await page.evaluate(() => document.body.style.position)).toBe("");
  await launcher.click();
  await expect(dialog.getByText("Estamos en Colonia Médica, San Salvador.", { exact: true }).first()).toBeVisible();
  await dialog.getByLabel("Cerrar conversación").click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(start);
});
