import { ArrowUpRight, MessageCircle, Navigation } from "lucide-react";
import { clinic, wazeUrl } from "../data/clinic";
import { handleWhatsAppClick, whatsAppDoctorLabel } from "../lib/gtag";
import { Reveal } from "./ui/Reveal";

function HeroBackground() {
  return (
    <div className="hero-bg-gradient pointer-events-none" aria-hidden>
      <div className="hero-portraits">
        {clinic.oftalmologos.map((doctor) => (
          <img key={doctor.nombre} src={doctor.foto} alt="" decoding="async" />
        ))}
      </div>
    </div>
  );
}

function EyeChartVisual() {
  const rows = [
    { letter: "E", size: "text-5xl" },
    { letter: "F P", size: "text-3xl" },
    { letter: "T O Z", size: "text-xl" },
    { letter: "L P E D", size: "text-lg" },
    { letter: "P E C F D", size: "text-sm" },
  ];

  return (
    <div
      className="hero-eye-chart relative flex w-full max-w-xs flex-col items-center justify-center rounded-md border border-ink/10 bg-white p-8"
    >
      <div className="absolute inset-3 border border-ink/5" aria-hidden />
      <p className="absolute left-4 top-4 font-mono text-[0.65rem] uppercase tracking-widest text-muted">
        Agudeza visual
      </p>

      <div className="flex flex-col items-center gap-3 font-display font-bold text-ink">
        {rows.map((row) => (
          <p
            key={row.letter}
            className={`${row.size} tracking-[0.35em]`}
          >
            {row.letter}
          </p>
        ))}
      </div>

      <div className="absolute -bottom-4 -right-4 hidden border border-ink/10 bg-blue-deep px-4 py-3 text-white md:block">
        <p className="font-display text-2xl font-bold leading-none">20/20</p>
        <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-wider">
          Visión clara
        </p>
      </div>
    </div>
  );
}

export function Hero() {
  const appointmentLinks = clinic.oftalmologos.map((doctor) => ({
    name: doctor.nombre.replace(/^(Dr\.|Dra\.)\s*/i, ""),
    title: doctor.nombre.startsWith("Dra.") ? "Dra." : "Dr.",
    href: `https://wa.me/${doctor.whatsapp}?text=${encodeURIComponent(
      `Hola, quisiera agendar una cita con ${doctor.nombre}`,
    )}`,
    conversionLabel: whatsAppDoctorLabel(doctor.nombre),
  }));

  return (
    <section
      id="inicio"
      className="hero-section relative overflow-hidden"
    >
      <HeroBackground />

      <div className="hero-layout relative z-[1] mx-auto grid max-w-6xl gap-8 px-4 pb-12 md:px-8 md:pb-20">
        <Reveal immediate className="hero-card nv-glass">
          <p className="mb-5 inline-block border-l-2 border-teal pl-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-blue-deep">
            Oftalmología · Consulta privada
          </p>
          <h1 className="font-hero text-[2.2rem] font-semibold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[3.35rem] lg:text-[3.75rem]">
            <span className="block">
              Tu{" "}
              <span className="relative inline-block italic text-blue-deep after:absolute after:-bottom-0.5 after:left-1/2 after:h-1 after:w-2/5 after:-translate-x-1/2 after:bg-teal after:content-['']">
                visión
              </span>
            </span>
            <span className="my-1.5 block text-[0.72em] font-medium tracking-[-0.02em] text-ink-soft sm:my-2">
              en manos de
            </span>
            <span className="relative inline-block italic text-blue-deep after:absolute after:-bottom-1 after:left-1/2 after:h-1 after:w-2/5 after:-translate-x-1/2 after:bg-teal after:content-['']">
              especialistas
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-[1.05rem] leading-relaxed text-ink-soft sm:mt-6 sm:text-lg">
            En Novavision te atienden el Dr. Andy Alvarenga y la 
            Dra. Karla Vides con consulta oftalmológica, diagnóstico
            especializado y cirugías de catarata, retina, córnea y segmento anterior.
          </p>

          <div className="hero-actions mt-7 grid grid-cols-2 gap-3">
            <div className="col-span-2 grid grid-cols-2 gap-3">
              {appointmentLinks.map((doctor) => (
                <a
                  key={doctor.name}
                  href={doctor.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleWhatsAppClick(doctor.conversionLabel)}
                  className="hero-appointment flex min-w-0 items-center gap-2 px-2 py-3 text-left sm:px-3"
                >
                  <span className="shrink-0">
                    <MessageCircle size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[0.55rem] uppercase tracking-wider">
                      Agendar cita
                    </span>
                    <span className="mt-0.5 block font-display text-xs font-bold sm:text-sm">
                      {doctor.title} {doctor.name.split(" ").at(-1)}
                    </span>
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="ml-auto hidden shrink-0 xl:block"
                  />
                </a>
              ))}
            </div>
            <a
              href="#servicios"
              className="nv-glass hero-secondary inline-flex items-center justify-center gap-2 px-3 py-3.5 font-display text-xs font-semibold sm:text-sm"
            >
              Ver servicios
              <ArrowUpRight size={16} />
            </a>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nv-glass hero-secondary inline-flex items-center justify-center gap-2 px-3 py-3.5 font-display text-xs font-semibold sm:text-sm"
            >
              <Navigation size={17} />
              Cómo llegar
            </a>
          </div>

          <dl className="mt-7 grid gap-x-6 gap-y-5 border-t border-ink/10 pt-6 sm:grid-cols-2">
            <div className="border-l-2 border-blue pl-4">
              <dt className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                Especialistas
              </dt>
              <dd className="mt-1 font-display text-lg font-bold leading-tight text-ink">
                Dr. Alvarenga · Dra. Vides
              </dd>
            </div>
            <div className="border-l-2 border-teal pl-4">
              <dt className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                Horario
              </dt>
              <dd className="mt-1 whitespace-pre-line text-sm font-medium leading-relaxed text-ink">
                {clinic.horarios}
              </dd>
            </div>
            <div className="border-l-2 border-blue-light pl-4">
              <dt className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                Teléfono
              </dt>
              <dd className="mt-1 font-display text-lg font-bold leading-tight text-ink">
                {clinic.telefono}
              </dd>
            </div>
            <div className="border-l-2 border-ink/20 pl-4">
              <dt className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                Ubicación
              </dt>
              <dd className="mt-1 text-sm leading-snug text-ink-soft">
                Colonia Médica, San Salvador
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal immediate className="hero-chart-wrap flex justify-center">
          <EyeChartVisual />
        </Reveal>
      </div>
    </section>
  );
}
