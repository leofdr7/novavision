import { expect, it } from "vitest";
import { detectMedicalCase, medicalRedirect, SYSTEM_PROMPT } from "../server/chat/prompt";
import { MEDICAL_REPLIES, NON_URGENT_FOLLOWUP, knowledge } from "../server/chat/knowledge";

it.each([
  "perdí la visión de repente en un ojo",
  "me cayó un químico en el ojo",
  "Tengo dolor intenso en el ojo",
  "Tengo náuseas con dolor ocular",
  "Me golpeé el ojo",
  "Tengo un cuerpo extraño en el ojo",
  "Veo destellos de luz",
  "Veo una cortina en el campo visual",
  "Veo borroso de golpe",
  "Aparecieron muchas moscas volantes de repente",
  "Me duele el ojo", // Unqualified symptoms: conservative urgent path.
  "Veo borroso y me duele el ojo",
  "Veo borroso, tengo náuseas",
  "¿Cuáles son las señales de alarma? Perdí la visión de repente",
  "Me cayó un químico. ¿Cómo agendar una cita?",
])("case 1: urgent referral takes priority: %s", text => {
  expect(detectMedicalCase(text)).toBe("urgent");
  expect(medicalRedirect(text, false)).toBe(MEDICAL_REPLIES.urgent);
  expect(medicalRedirect(text, true)).toBe(MEDICAL_REPLIES.urgent);
});

it.each([
  "que tengo que hacer si veo borroso y a veces me duele la cabeza",
  "Veo borroso",
  "Tengo visión borrosa",
  "Tengo dolor de cabeza ocasional",
  "Tengo los ojos cansados",
  "Mis ojos están cansados",
  "Tengo molestias leves",
])("case 2: uses the exact approved non-urgent reply: %s", text => {
  expect(detectMedicalCase(text)).toBe("nonUrgent");
  expect(medicalRedirect(text)).toBe(MEDICAL_REPLIES.nonUrgent);
  expect(medicalRedirect(text)?.match(/WhatsApp/g)).toHaveLength(1);
});

it.each([
  "¿cuáles son los síntomas de alarma que requieren atención inmediata?",
  "¿Qué señales de alarma debo conocer?",
  "Tengo una duda: ¿cuáles son las señales de alarma?",
  "No tengo síntomas. ¿Cuáles son las señales de alarma?",
])("case 3: distinguishes general questions without a symptom report: %s", text => {
  expect(detectMedicalCase(text)).toBe("general");
  expect(medicalRedirect(text)).toBe(MEDICAL_REPLIES.general);
});

it.each(["¿a qué hora abren?", "¿Dónde están?", "¿Cómo agendar?", "Perdí la dirección de la clínica"])("does not intercept administrative questions: %s", text => {
  expect(detectMedicalCase(text)).toBeNull(); expect(medicalRedirect(text)).toBeNull();
});

it("never sends urgent or general referrals to the clinic", () => {
  for (const text of [MEDICAL_REPLIES.urgent, MEDICAL_REPLIES.general]) {
    expect(text).not.toMatch(/whatsapp|agendar/i);
    expect(text).not.toContain(knowledge.telefono);
    expect(text).toContain("911"); expect(text).toContain("El consultorio no atiende emergencias.");
  }
  for (const text of Object.values(MEDICAL_REPLIES)) expect(text).not.toMatch(/datos (medicos )?sensibles/i);
  expect(SYSTEM_PROMPT).not.toContain("contactar de inmediato a la clínica");
});

it("omits only the booking sentence on non-urgent follow-ups, unless asked to book again", () => {
  const followup = medicalRedirect("Sigo con los ojos cansados", true);
  expect(followup).toBe(NON_URGENT_FOLLOWUP);
  expect(followup).toBe(MEDICAL_REPLIES.nonUrgent.replace(" Puedes agendar una consulta con el botón verde de WhatsApp.", ""));
  expect(followup).not.toMatch(/whatsapp|agendar/i);
  expect(medicalRedirect("Veo borroso. ¿Cómo agendar una cita?", true)).toBe(MEDICAL_REPLIES.nonUrgent);
  expect(medicalRedirect("Veo borroso. ¿Cómo contactar?", true)).toBe(NON_URGENT_FOLLOWUP);
});
