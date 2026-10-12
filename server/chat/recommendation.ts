import { CLINIC_RECOMMENDATION } from "./knowledge.js";

/** Only standalone clinic recommendations; qualified questions go to the grounded prompt. */
export function recommendationReply(text: string): string | null {
  const question = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[¿?¡!.,;:]/g, " ").replace(/\s+/g, " ").trim();
  const recommends = "(?:recomiendas|recomienda|recomiendan|recomendarias|recomendaria|recomendarian|recomendas)";
  const clinic = "(?:(?:a |la clinica )?novavision)";
  const direct = new RegExp(`^(?:(?:me|nos) )?${recommends} ${clinic}(?: (?:y )?por que)?$`);
  const reasons = new RegExp(`^(?:por que ${recommends}|por que (?:elegir|visitar)|es recomendable|vale la pena (?:ir a|visitar)) ${clinic}$`);
  return direct.test(question) || reasons.test(question) ? CLINIC_RECOMMENDATION : null;
}
