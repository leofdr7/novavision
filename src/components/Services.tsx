import {
  Activity,
  Baby,
  Circle,
  Droplet,
  Glasses,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { clinic, servicios } from "../data/clinic";
import { Reveal, SectionLabel, SectionTitle } from "./ui/Reveal";

const iconMap: Record<(typeof servicios)[number]["icon"], LucideIcon> = {
  glasses: Glasses,
  droplet: Droplet,
  activity: Activity,
  circle: Circle,
  zap: Zap,
  baby: Baby,
};

export function Services() {
  return (
    <section id="servicios" className="nv-glass-section border-t border-ink/8 py-16 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionLabel>Servicios</SectionLabel>
          <SectionTitle>Atención integral para tu salud visual</SectionTitle>
          <p className="mt-5 text-lg text-ink-soft">{clinic.serviciosIntro}</p>
        </Reveal>

        <Reveal delay={0.04} className="mx-auto mt-8 max-w-4xl">
          <article className="border border-ink/10 bg-white px-6 py-6 sm:px-8">
            <h3 className="font-display text-xl font-bold text-ink">
              Consulta oftalmológica y cirugía ocular en San Salvador
            </h3>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Atendemos pacientes que buscan oftalmólogo en San Salvador para chequeo
              visual, cirugía de catarata, retina, córnea y cirugía refractiva. Nuestro
              enfoque combina diagnóstico oportuno, tratamiento personalizado y seguimiento
              para cada etapa de la salud visual.
            </p>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Si presentas visión borrosa, molestias o cambios repentinos, una evaluación
              a tiempo puede prevenir complicaciones y ayudarte a mantener una mejor calidad
              de vida.
            </p>
          </article>
        </Reveal>

        <div className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {servicios.map((s, i) => {
            const Icon = iconMap[s.icon];
            return (
              <Reveal key={s.titulo} delay={0.05 * i}>
                <article
                  className="nv-glass nv-glass-card service-card h-full p-6 sm:p-7"
                >
                  <Icon
                    className="mb-5 text-blue-deep"
                    size={28}
                    strokeWidth={1.5}
                  />
                  <h3 className="font-display text-lg font-bold text-ink">
                    {s.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {s.descripcion}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
