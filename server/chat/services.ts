import { knowledge, SERVICES_SUMMARY, UNKNOWN_SERVICE_REPLY } from "./knowledge.js";

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/\s+/g, " ").trim().replace(/^[¿¡]+|[?!.]+$/g, "");
}

// Only derive shorter names from published entries. Qualifiers on the user's
// request are never discarded: an unpublished technique must not match a service.
function serviceNames(service: string): string[] {
  const full = normalize(service);
  const plain = full.replace(/ \([^)]*\)/g, "").replace(/, con amplia variedad de aros$/, "");
  const basic = plain.replace(/ (con (?:autoinjerto|laser)|por facoemulsificacion sin puntos)$/, "");
  return [full, plain, basic, ...[plain, basic].map(name => name.replace(/^cirugia (?:(?:laser )?para|de) /, ""))];
}

/** Answer standalone catalog questions. Other wording and follow-ups use the grounded prompt. */
export function serviceReply(text: string): string | null {
  const question = normalize(text);
  if (/^(?:(?:que|cuales) (?:son (?:sus|los) )?servicios(?: (?:ofrecen|tienen|hacen|realizan))?|servicios)$/.test(question)) {
    return SERVICES_SUMMARY;
  }

  const who = question.match(/^(?:quien|que (?:doctor|doctora|medico|especialista)) (?:opera|hace|realiza|ofrece|trata) (.+)$/);
  const availability = question.match(/^(?:hacen|realizan|ofrecen|tienen|cuentan con) (.+)$/);
  const requested = who?.[1] ?? availability?.[1];
  if (!requested) return null;
  const target = requested.replace(/^(?:el|la|los|las|una?|servicio de) /, "");

  // Broad categories are explicit catalog selections, never specialty-based inference.
  const category = target === "optica" ? "Óptica"
    : /^(?:cirugia (?:de |para )?)?retina$/.test(target) ? "Retina" : null;
  const categoryServices = knowledge.categoriasServicios.find(item => item.nombre === category)?.servicios;
  const doctors = knowledge.doctores.map(doctor => ({
    ...doctor,
    servicios: doctor.servicios.filter(service => categoryServices
      ? categoryServices.includes(service)
      : serviceNames(service).includes(target)),
  })).filter(doctor => doctor.servicios.length > 0);

  if (doctors.length > 0) {
    if (!who && category === "Óptica") return `Sí. Óptica: ${categoryServices!.join("; ")}.`;
    return doctors.map(doctor => `${doctor.nombre} (${doctor.especialidad}): ${doctor.servicios.join("; ")}.`).join("\n");
  }

  const generalService = knowledge.servicios.find(service => normalize(service.nombre) === target);
  if (generalService) return who ? UNKNOWN_SERVICE_REPLY : `${generalService.nombre}: ${generalService.descripcion}`;

  // Leave administrative availability (appointments, insurance, etc.) to the model.
  if (who || /^(hacen|realizan) /.test(question) || /\b(cirugia|procedimiento|tratamiento|laser|optica|lentes)\b/.test(target)) {
    return UNKNOWN_SERVICE_REPLY;
  }
  return null;
}
