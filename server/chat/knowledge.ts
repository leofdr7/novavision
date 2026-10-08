import { clinic, servicios, faqs } from "../../src/data/clinic.js";

// Doctor-approved copy. Keep these three responses verbatim; never generate clinical advice.
export const MEDICAL_REPLIES = {
  urgent: "No puedo evaluar síntomas por este medio. Lo que describes puede requerir atención inmediata: acude ahora a un servicio de emergencias o llama al 911. El consultorio no atiende emergencias.",
  nonUrgent: "No puedo evaluar síntomas por este medio, pero lo que describes conviene revisarlo con un oftalmólogo. Puedes agendar una consulta con el botón verde de WhatsApp. Si la visión borrosa aparece de golpe, o hay dolor intenso, náuseas o pérdida de visión, acude de inmediato a un servicio de emergencias o llama al 911, porque el consultorio no atiende emergencias.",
  general: "Algunas señales por las que conviene buscar atención de inmediato son: pérdida repentina de visión, destellos de luz o aparición súbita de muchas moscas volantes, una sombra o cortina en el campo visual, dolor intenso con enrojecimiento o náuseas, y golpes, químicos o cuerpos extraños en el ojo. Si presentas alguna, acude a un servicio de emergencias o llama al 911. El consultorio no atiende emergencias.",
} as const;

// On subsequent non-urgent replies omit only the booking sentence, preserving all other copy.
export const NON_URGENT_FOLLOWUP = MEDICAL_REPLIES.nonUrgent.replace(" Puedes agendar una consulta con el botón verde de WhatsApp.", "");

// Match About.tsx: grouped services are the visible card content when present.
const doctores = clinic.oftalmologos.map(d => ({
  nombre: d.nombre,
  especialidad: d.especialidad,
  servicios: d.serviciosGrupos?.flatMap(grupo => grupo.items) ?? d.servicios,
}));

// A short selection of published service names, not additional clinical descriptions.
const categoriasServicios = [
  { nombre: "Cirugía", servicios: ["Cirugía de catarata", "Cirugía de pterigión (carnosidad)", "Cirugía de chalazión"] },
  { nombre: "Córnea y refractiva", servicios: ["Cirugía refractiva con láser", "Crosslinking para queratocono"] },
  { nombre: "Retina", servicios: ["Cirugía para desprendimiento de retina", "Cirugía láser para retinopatía diabética", "Cirugía de mácula"] },
  { nombre: "Óptica", servicios: ["Graduación de lentes monofocales y progresivos, con amplia variedad de aros"] },
  { nombre: "Chequeo anual", servicios: ["Chequeo visual anual"] },
];

export const SERVICES_SUMMARY = [
  "Ofrecemos estos servicios por categoría:",
  ...categoriasServicios.map(categoria => `${categoria.nombre}: ${categoria.servicios.join("; ")}.`),
  "Puedo detallar los servicios por doctor y su especialidad.",
].join("\n");

export const UNKNOWN_SERVICE_REPLY = "No tengo información sobre ese procedimiento en los servicios publicados del sitio.";

export const knowledge = {
  nombre: clinic.nombre, direccion: clinic.direccion, horarios: clinic.horarios,
  telefono: clinic.telefono, comoLlegar: clinic.wazeUrl,
  servicios: servicios.map(s => ({ nombre: s.titulo, descripcion: s.descripcion })),
  doctores,
  categoriasServicios,
  preguntasAdministrativas: faqs.filter(f => [
    "¿Necesito referencia médica para una consulta?", "¿Qué debo llevar a mi primera consulta?",
  ].includes(f.pregunta)),
};
