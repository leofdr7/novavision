import { Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { clinic, wazeUrl, whatsappUrl } from "../data/clinic";
import { Reveal, SectionTitle } from "./ui/Reveal";

export function Contact() {
  return (
    <section id="contacto" className="border-t border-ink/8 bg-ink py-16 text-paper md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal className="max-w-xl">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-blue mb-4">
            Contacto y ubicación
          </p>
          <SectionTitle className="!text-paper">Visítanos o escríbenos</SectionTitle>
          <p className="mt-5 text-lg text-paper/70">
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
                      <p className="mt-2 text-sm text-paper/60">
                        También: {clinic.direccionSecundaria}
                      </p>
                      <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#33CCFF] px-4 py-2 font-display text-sm font-semibold text-ink transition-opacity hover:opacity-90"
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
                        className="block text-paper hover:text-orange"
                      >
                        Dr. Alvarenga: 7068-1751
                      </a>
                      <a
                        href="https://wa.me/50379893654?text=Hola%2C%20quisiera%20agendar%20una%20cita"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-paper hover:text-orange"
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
                      <a href="tel:21243333" className="block text-paper hover:text-orange">
                        {clinic.telefono}
                      </a>
                    </span>
                  ),
                },
              ] as const
            ).map(({ icon: Icon, label, value, ...rest }) => (
              <div
                key={label}
                className="flex gap-3 border border-paper/10 bg-paper/5 p-4 sm:gap-4 md:p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-blue text-paper">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-mono text-[0.65rem] uppercase tracking-wider text-paper/50">
                    {label}
                  </p>
                  <div className="mt-1 whitespace-pre-line font-medium text-paper">{value}</div>
                  {"extra" in rest ? rest.extra : null}
                </div>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center border border-paper/10 bg-paper/5 p-6 text-center md:min-h-[360px] md:p-8">
              <MapPin className="mb-4 text-teal" size={36} strokeWidth={1.5} />
              <p className="font-display text-lg font-bold text-paper">
                Ubicación del consultorio
              </p>
              <p className="mt-2 max-w-xs text-sm text-paper/60">
                {clinic.direccion}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
