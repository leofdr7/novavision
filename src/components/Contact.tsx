import { Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { clinic, wazeUrl, whatsappUrl } from "../data/clinic";
import { handleWhatsAppClick } from "../lib/gtag";
import { Reveal, SectionTitle } from "./ui/Reveal";

export function Contact() {
  return (
    <section id="contacto" className="contact-section border-t border-ink/8 py-16 text-paper md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal className="max-w-xl">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-blue-light mb-4">
            Contacto y ubicación
          </p>
          <SectionTitle className="!text-paper">Visítanos o escríbenos</SectionTitle>
          <p className="mt-5 text-lg text-paper/90">
            Estamos listos para atenderte. Agenda tu cita o consulta cómo llegar.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 md:mt-14 md:gap-8 lg:grid-cols-2">
          <Reveal className="space-y-3 md:space-y-4">
            {(
              [
                {
                  icon: MapPin,
                  label: "Consultorio principal",
                  value: clinic.direccion,
                  extra: (
                    <>
                      <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-waze mt-3 inline-flex min-h-11 items-center gap-2 px-4 py-2 font-display text-sm font-semibold"
                      >
                        <Navigation size={15} />
                        Cómo llegar (Waze)
                      </a>
                    </>
                  ),
                },
                {
                  icon: MessageCircle,
                  label: "WhatsApp",
                  value: (
                    <span className="space-y-1">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleWhatsAppClick("dr_andy")}
                        className="block text-paper hover:underline underline-offset-4"
                      >
                        Dr. Alvarenga: 7068-1751
                      </a>
                      <a
                        href="https://wa.me/50379893654?text=Hola%2C%20quisiera%20agendar%20una%20cita"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleWhatsAppClick("dra_karla")}
                        className="block text-paper hover:underline underline-offset-4"
                      >
                        Dra. Vides: 7989-3654
                      </a>
                    </span>
                  ),
                },
                {
                  icon: Clock,
                  label: "Horario",
                  value: clinic.horarios,
                },
                {
                  icon: Phone,
                  label: "Teléfono",
                  value: (
                    <span>
                      <a href="tel:21243333" className="block text-paper hover:underline underline-offset-4">
                        {clinic.telefono}
                      </a>
                    </span>
                  ),
                },
              ] as const
            ).map(({ icon: Icon, label, value, ...rest }) => (
              <div
                key={label}
                className="contact-card nv-glass flex gap-3 p-4 sm:gap-4 md:p-6"
              >
                <div className="contact-icon flex h-11 w-11 shrink-0 items-center justify-center">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[0.65rem] uppercase tracking-wider text-paper/90">
                    {label}
                  </p>
                  <div className="mt-1 whitespace-pre-line font-medium text-paper">{value}</div>
                  {"extra" in rest ? rest.extra : null}
                </div>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.1}>
            <div className="contact-card nv-glass flex h-full min-h-[260px] flex-col items-center justify-center p-6 text-center md:min-h-[360px] md:p-8">
              <MapPin className="contact-icon mb-4 h-14 w-14 p-3" size={36} strokeWidth={1.5} />
              <p className="font-display text-lg font-bold text-paper">
                Ubicación del consultorio
              </p>
              <p className="mt-2 max-w-xs text-sm text-paper/90">
                {clinic.direccion}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
