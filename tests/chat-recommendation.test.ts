import { expect, it } from "vitest";
import { CLINIC_RECOMMENDATION, knowledge } from "../server/chat/knowledge";
import { recommendationReply } from "../server/chat/recommendation";
import { conversationPrompt } from "../server/chat/prompt";

it.each([
  "¿Recomiendas Novavision?",
  "¿Me recomiendas Novavisión?",
  "¿Recomendarías la clínica Novavision?",
  "¿Recomienda Novavision?",
  "¿Recomiendas Novavision? ¿Por qué?",
  "¿Por qué recomiendas Novavision?",
  "¿Por qué elegir Novavision?",
  "¿Es recomendable Novavision?",
  "¿Vale la pena ir a Novavision?",
])("answers clinic recommendations warmly and affirmatively: %s", question => {
  expect(recommendationReply(question)).toBe(CLINIC_RECOMMENDATION);
});

it.each([
  "¿Recomiendas Novavision para cirugía de estrabismo?",
  "¿Recomiendas que me opere en Novavision?",
  "¿Novavision me garantiza recuperar la visión?",
  "¿Recomiendas Novavision? Tengo dolor intenso en el ojo",
  "¿Recomiendas Novavision? ¿Cuánto cobran?",
  "¿Recomiendas otra clínica?",
  "No recomiendes Novavision",
  "¿Dónde están?",
])("leaves qualified or unrelated requests to the existing rules: %s", question => {
  expect(recommendationReply(question)).toBeNull();
});

it("explains the recommendation with published specialties and services", () => {
  expect(CLINIC_RECOMMENDATION).toMatch(/^¡Sí! Te recomiendo Novavision/);
  for (const doctor of knowledge.doctores) {
    expect(CLINIC_RECOMMENDATION).toContain(doctor.nombre);
    expect(CLINIC_RECOMMENDATION).toContain(doctor.especialidad);
  }
  expect(CLINIC_RECOMMENDATION).toContain("lentes monofocales y progresivos");
  expect(CLINIC_RECOMMENDATION).toContain("Colonia Médica, San Salvador");
  expect(CLINIC_RECOMMENDATION.split(/\s+/).length).toBeLessThanOrEqual(120);
  expect(CLINIC_RECOMMENDATION).not.toMatch(/garantiz|la mejor|whatsapp|agendar|yo (fui|visité)/i);
});

it.each([false, true])("keeps the recommendation and tone guidance in both contact states: %s", mentioned => {
  const prompt = conversationPrompt(mentioned);
  expect(prompt).toContain(CLINIC_RECOMMENDATION);
  expect(prompt).toContain("tono cercano, cálido, profesional");
  expect(prompt).toContain("sin fingir ser paciente ni un evaluador independiente");
  expect(prompt).toContain("síntomas y urgencias siguen teniendo prioridad");
});
