import { Facebook, Instagram, MessageCircle, Phone } from "lucide-react";
import { clinic } from "../data/clinic";
import { Reveal, SectionLabel, SectionTitle } from "./ui/Reveal";

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12.525.02c1.31-.02 2.612-.01 3.912-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.72-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 2.77 3.46 2.62 1.09-.01 2.14-.64 2.7-1.57.18-.32.37-.65.38-1.02.09-1.79.05-3.57.06-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export function About() {
  return (
    <section id="nosotros" className="border-t border-ink/8 bg-white py-16 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal className="max-w-2xl">
          <SectionLabel>Quiénes somos</SectionLabel>
          <SectionTitle>
            Dos especialistas, un mismo compromiso con tu visión
          </SectionTitle>
          <p className="mt-5 text-lg text-ink-soft">
            En Colonia Médica, San Salvador, el Dr. Andy Alvarenga y la Dra. Karla
            Vides ofrecen atención oftalmológica integral con enfoque clínico y
            trato cercano.
          </p>
        </Reveal>

        <div className="mt-10 space-y-8 md:mt-14 md:space-y-10">
          <Reveal delay={0.05}>
            <article className="about-info-card about-info-card--mission grid gap-7 border-l-4 border-teal bg-paper p-6 md:grid-cols-2 md:gap-12 md:p-9">
              <div>
                <h3 className="font-display text-xl font-bold text-ink">
                  Nuestra misión
                </h3>
                <p className="mt-3 text-ink-soft">
                  Preservar y mejorar la salud visual mediante diagnósticos precisos,
                  tratamientos basados en evidencia y acompañamiento en cada consulta.
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink">
                  Experiencia
                </h3>
                <p className="mt-3 text-ink-soft">{clinic.experiencia}</p>
                <p className="mt-3 text-sm text-muted">
                  Edificio Condominio Médico, Local 81, Colonia Médica.
                </p>
              </div>
            </article>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {clinic.oftalmologos.map((doc, i) => (
              <Reveal key={doc.nombre} delay={0.08 * (i + 1)}>
                <article
                  className={`about-info-card group border border-ink/8 bg-paper transition-colors hover:border-blue/30 ${
                    i === 0
                      ? "about-info-card--retina"
                      : "about-info-card--cornea"
                  }`}
                >
                  <div className="relative h-[27rem] overflow-hidden bg-blue/10 sm:h-[32rem] lg:h-[34rem]">
                    <img
                      src={doc.foto}
                      alt={`Retrato de ${doc.nombre}`}
                      className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.015]"
                      loading="lazy"
                    />
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/25 to-transparent"
                      aria-hidden
                    />
                    <p className="absolute bottom-4 left-5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-white">
                      Especialistas Novavision
                    </p>
                  </div>

                  <div className="p-5 md:p-7">
                    <div>
                      <h4 className="font-display text-2xl font-bold text-ink">
                        {doc.nombre}
                      </h4>
                      <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-wider text-blue">
                        {doc.especialidad}
                      </p>
                      <p className="mt-4 leading-relaxed text-ink-soft">{doc.descripcion}</p>
                    </div>

                  <div className="mt-5 border-t border-ink/8 pt-5">
                    <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                      Servicios
                    </p>
                    {doc.serviciosGrupos ? (
                      <div className="mt-3 space-y-4">
                        {doc.serviciosGrupos.map((grupo) => (
                          <div key={grupo.titulo}>
                            <p className="font-display text-sm font-semibold text-ink">
                              {grupo.titulo}
                            </p>
                            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                              {grupo.items.map((servicio) => (
                                <li
                                  key={servicio}
                                  className="flex items-start gap-2 text-sm text-ink-soft"
                                >
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                                  {servicio}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                        {doc.servicios.map((servicio) => (
                          <li
                            key={servicio}
                            className="flex items-start gap-2 text-sm text-ink-soft"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                            {servicio}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t border-ink/8 pt-5">
                    {doc.redes?.facebook && (
                      <a
                        href={doc.redes.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Facebook de ${doc.nombre}`}
                        title={`Facebook de ${doc.nombre}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-blue/20 bg-white/80 text-blue transition-all hover:-translate-y-0.5 hover:border-blue hover:bg-blue hover:text-white"
                      >
                        <Facebook size={18} strokeWidth={1.8} />
                      </a>
                    )}
                    {doc.redes?.instagram && (
                      <a
                        href={doc.redes.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Instagram de ${doc.nombre}`}
                        title={`Instagram de ${doc.nombre}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-orange/25 bg-white/80 text-orange transition-all hover:-translate-y-0.5 hover:border-orange hover:bg-orange hover:text-white"
                      >
                        <Instagram size={18} strokeWidth={1.8} />
                      </a>
                    )}
                    {doc.redes?.tiktok && (
                      <a
                        href={doc.redes.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`TikTok de ${doc.nombre}`}
                        title={`TikTok de ${doc.nombre}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 bg-white/80 text-ink transition-all hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-white"
                      >
                        <TikTokIcon />
                      </a>
                    )}
                    {doc.whatsapp && (
                      <a
                        href={`https://wa.me/${doc.whatsapp}?text=${encodeURIComponent("Hola, quisiera agendar una cita")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Agendar cita por WhatsApp con ${doc.nombre}`}
                        title={`WhatsApp de ${doc.nombre}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-teal/25 bg-white/80 text-teal-dark transition-all hover:-translate-y-0.5 hover:border-teal hover:bg-teal hover:text-white"
                      >
                        <MessageCircle size={19} strokeWidth={1.8} />
                      </a>
                    )}
                  </div>

                  {doc.ubicaciones && doc.ubicaciones.length > 0 && (
                    <div className="mt-4 space-y-1">
                      {doc.ubicaciones.map((ubicacion) => (
                        <p key={ubicacion} className="text-xs text-muted">
                          {ubicacion}
                        </p>
                      ))}
                    </div>
                  )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.12} className="mt-10 md:mt-14">
          <aside className="relative mx-auto max-w-3xl overflow-hidden rounded-md border border-blue/25 bg-[linear-gradient(135deg,rgba(1,138,182,0.1),rgba(255,255,255,0.94),rgba(45,177,164,0.09))] px-6 py-8 text-center before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[linear-gradient(90deg,#018AB6,#2DB1A4,#FA8017)] md:px-12 md:py-10">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue text-white shadow-[0_6px_18px_rgba(1,138,182,0.2)]">
              <Phone size={19} />
            </div>
            <div className="mx-auto mt-4 max-w-xl">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-blue">
                Atención por teléfono
              </p>
              <h3 className="mt-2 font-display text-xl font-bold md:text-2xl">
                Tu próxima consulta comienza con una llamada
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft md:text-base">
                Nuestro equipo está listo para orientarte y encontrar el horario más
                conveniente para tu evaluación visual.
              </p>
            </div>
            <a
              href="tel:21243333"
              className="relative mt-5 inline-flex items-center justify-center gap-2 rounded-md border border-blue/30 bg-white/90 px-5 py-3 font-display text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-blue hover:shadow-[0_8px_24px_rgba(28,45,55,0.08)]"
            >
              <Phone size={17} className="text-blue" />
              Llamar al 2124-3333
            </a>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
