export type WhatsAppDoctorLabel = "dr_andy" | "dra_karla";

// Reemplazar AW-XXXXXXX por el ID de cuenta de Google Ads una vez se genere.
export const GOOGLE_ADS_ID = "AW-XXXXXXX";

// Reemplazar LABEL por la etiqueta de conversión de clic en WhatsApp una vez Google Ads la genere.
export const GOOGLE_ADS_WHATSAPP_LABEL = "LABEL";

export function whatsAppDoctorLabel(nombre: string): WhatsAppDoctorLabel {
  return /karla|vides/i.test(nombre) ? "dra_karla" : "dr_andy";
}

export function handleWhatsAppClick(doctor: WhatsAppDoctorLabel): void {
  if (typeof window.gtag !== "function") return;

  window.gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_WHATSAPP_LABEL}`,
    event_label: doctor,
  });
}
