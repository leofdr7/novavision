import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import type { Redis } from "@upstash/redis";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createChatHandler } from "../api/chat";
import { clinic, servicios } from "../src/data/clinic";
import { knowledge, MEDICAL_REPLIES, SERVICES_SUMMARY, UNKNOWN_SERVICE_REPLY } from "../server/chat/knowledge";
import { serviceReply } from "../server/chat/services";
import { createSession } from "../server/chat/session";
import { testConfig } from "./helpers";

const cases = [
  ["¿qué servicios ofrecen?", SERVICES_SUMMARY],
  ["¿quién opera la retina?", "Dr. Andy Alvarenga (Oftalmólogo · Retinólogo): Cirugía para desprendimiento de retina; Cirugía láser para retinopatía diabética; Cirugía de mácula."],
  ["¿hacen cirugía de pterigión?", "Dr. Andy Alvarenga (Oftalmólogo · Retinólogo): Cirugía de pterigión (carnosidad).\nDra. Karla Vides (Oftalmóloga · Segmento anterior): Cirugía de pterigión con autoinjerto."],
  ["¿tienen óptica?", "Sí. Óptica: Graduación de lentes monofocales y progresivos, con amplia variedad de aros."],
  ["¿Hacen cirugía de estrabismo?", "No tengo información sobre ese procedimiento en los servicios publicados del sitio."],
] as const;

it("uses exactly the services displayed on each doctor card, with their specialty", () => {
  expect(knowledge.doctores).toEqual(clinic.oftalmologos.map(doctor => ({
    nombre: doctor.nombre,
    especialidad: doctor.especialidad,
    servicios: doctor.serviciosGrupos?.flatMap(group => group.items) ?? doctor.servicios,
  })));
  expect(knowledge.doctores[0].servicios).toContain("Chequeo visual anual");
  for (const doctor of knowledge.doctores) {
    expect(doctor.servicios).toContain("Graduación de lentes monofocales y progresivos, con amplia variedad de aros");
  }
  expect(knowledge.servicios).toEqual(servicios.map(service => ({ nombre: service.titulo, descripcion: service.descripcion })));
});

it("summarizes five categories using only published service names, including optics", () => {
  const published = new Set([...knowledge.doctores.flatMap(doctor => doctor.servicios), ...servicios.map(service => service.titulo)]);
  expect(knowledge.categoriasServicios.map(category => category.nombre)).toEqual([
    "Cirugía", "Córnea y refractiva", "Retina", "Óptica", "Chequeo anual",
  ]);
  for (const category of knowledge.categoriasServicios) {
    expect(SERVICES_SUMMARY).toContain(`${category.nombre}:`);
    for (const service of category.servicios) expect(published.has(service)).toBe(true);
  }
  expect(SERVICES_SUMMARY).toContain("Graduación de lentes monofocales y progresivos");
  expect(SERVICES_SUMMARY).toContain("Puedo detallar los servicios por doctor y su especialidad.");
  expect(SERVICES_SUMMARY.split(/\s+/).length).toBeLessThanOrEqual(120);
  expect(SERVICES_SUMMARY).not.toMatch(/whatsapp|agendar/i);
});

it.each(cases)("answers from the catalog: %s", (question, expected) => {
  expect(serviceReply(question)).toBe(expected);
});

it.each(["QUE SERVICIOS OFRECEN", "¿Cuáles son sus servicios?", "servicios", "  ¿Qué servicios tienen?  "])("recognizes general catalog questions: %s", question => {
  expect(serviceReply(question)).toBe(SERVICES_SUMMARY);
});

it("keeps a published technique tied to the correct doctor", () => {
  expect(serviceReply("¿Quién hace cirugía de pterigión con autoinjerto?")).toBe(
    "Dra. Karla Vides (Oftalmóloga · Segmento anterior): Cirugía de pterigión con autoinjerto.",
  );
  expect(serviceReply("¿Quién hace crosslinking para queratocono?")).toBe(
    "Dra. Karla Vides (Oftalmóloga · Segmento anterior): Crosslinking para queratocono.",
  );
  expect(serviceReply("¿Quién hace cirugía refractiva?")).toBe(
    "Dra. Karla Vides (Oftalmóloga · Segmento anterior): Cirugía refractiva con láser.",
  );
});

it.each([
  "¿Quién hace cirugía de estrabismo?",
  "¿Hacen cirugía de pterigión con láser?",
  "¿Hacen cirugía de retina robótica?",
  "¿Hacen cirugía refractiva con una técnica no publicada?",
  "¿Tienen lentes de contacto?",
  "¿Quién hace evaluación visual?", // The general section does not establish a doctor association.
])("does not infer an unpublished service, technique or doctor association: %s", question => {
  expect(serviceReply(question)).toBe(UNKNOWN_SERVICE_REPLY);
});

it.each(["¿Qué horario tienen?", "¿Dónde están?", "¿Tienen citas mañana?", "¿Cuánto cuesta la cirugía de catarata?"])("leaves other intents to the grounded prompt: %s", question => {
  expect(serviceReply(question)).toBeNull();
});

describe("catalog answers through the API (Redis admission and provider mocked)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ...cases,
    ["¿Qué servicios ofrecen? Tengo dolor intenso en el ojo", MEDICAL_REPLIES.urgent],
    ["¿Tienen óptica? Veo borroso", MEDICAL_REPLIES.nonUrgent],
  ] as const)("returns grounded SSE without generation and preserves medical priority: %s", async (question, expected) => {
    const settings = testConfig();
    vi.stubEnv("ALLOWED_ORIGIN", settings.ALLOWED_ORIGIN);
    const requestId = randomUUID();
    const req = {
      method: "POST", socket: { remoteAddress: "127.0.0.1" },
      headers: { origin: settings.ALLOWED_ORIGIN, cookie: createSession(settings).cookie, "content-type": "application/json" },
      body: { requestId, messages: [{ role: "user", content: question }] },
    } as unknown as IncomingMessage;
    let body = "";
    const res = Object.assign(new EventEmitter(), {
      statusCode: 200, destroyed: false, writableEnded: false,
      setHeader: vi.fn(), flushHeaders: vi.fn(),
      write(chunk: string) { body += chunk; },
      end(chunk = "") { body += chunk; this.writableEnded = true; },
    });
    const release = vi.fn(async () => undefined);
    const admitSession = vi.fn(async () => ({ remaining: 19, release }));
    const enforceIp = vi.fn(async () => undefined);
    const streamAnswer = vi.fn();
    // No budget operation is needed for a catalog answer; fail if one is attempted.
    const evalBudget = vi.fn(() => { throw new Error("Unexpected budget reservation"); });
    await createChatHandler({
      readConfig: () => settings, makeRedis: () => ({ eval: evalBudget }) as unknown as Redis,
      admitSession, enforceIp, streamAnswer,
    })(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const frames = body.trim().split("\n\n").map(frame => ({
      event: frame.split("\n")[0].slice(7),
      data: JSON.parse(frame.split("\ndata: ")[1]),
    }));
    expect(frames).toEqual([
      { event: "meta", data: { requestId, remainingMessages: 19 } },
      { event: "delta", data: { text: expected } },
      { event: "done", data: { requestId } },
    ]);
    expect(enforceIp).toHaveBeenCalledOnce();
    expect(admitSession).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
    expect(streamAnswer).not.toHaveBeenCalled();
    expect(evalBudget).not.toHaveBeenCalled();
  });
});
