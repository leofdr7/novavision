export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatInit = {
  available: boolean;
  limits: { maxMessageChars: number; maxSessionMessages: number; remainingMessages: number };
};
export type ChatEvent =
  | { event: "meta"; data: { requestId: string; remainingMessages: number } }
  | { event: "delta"; data: { text: string } }
  | { event: "done"; data: { requestId: string } }
  | { event: "error"; data: { code: string; message: string } };
export const CHAT_CONTACT_HELP = "Puedes contactarnos mediante el botón verde de WhatsApp del sitio.";
export const CHAT_UNAVAILABLE = `El asistente no está disponible por ahora. ${CHAT_CONTACT_HELP}`;
export const CHAT_WELCOME = "¡Hola! Soy NOVA, el asistente virtual de Novavision. Con gusto te ayudo con nuestros servicios, especialistas, horarios y ubicación. ¿Qué te gustaría saber?";
