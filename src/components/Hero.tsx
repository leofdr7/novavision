import { ArrowUpRight, MessageCircle, Navigation } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { clinic, wazeUrl, whatsappUrl } from "../data/clinic";
import { Reveal } from "./ui/Reveal";

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-bg-gradient" />
      <div className="hero-bg-grid" />
      <div className="hero-bg-ring hero-bg-ring--1" />
      <div className="hero-bg-ring hero-bg-ring--2" />
      <div className="hero-bg-ring hero-bg-ring--3" />
      <div className="hero-bg-blob hero-bg-blob--blue" />
      <div className="hero-bg-blob hero-bg-blob--teal" />
      <div className="hero-bg-blob hero-bg-blob--orange" />
      <svg className="hero-bg-crosshair" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="72" stroke="#018AB6" strokeOpacity="0.12" strokeWidth="1" />
        <circle cx="100" cy="100" r="48" stroke="#2DB1A4" strokeOpacity="0.1" strokeWidth="1" />
        <line x1="100" y1="20" x2="100" y2="180" stroke="#1C2D37" strokeOpacity="0.06" />
        <line x1="20" y1="100" x2="180" y2="100" stroke="#1C2D37" strokeOpacity="0.06" />
      </svg>
    </div>
  );
}

function EyeChartVisual() {
  const reduce = useReducedMotion();
  const rows = [
    { letter: "E", size: "text-6xl md:text-7xl", opacity: "opacity-90" },
    { letter: "F P", size: "text-4xl md:text-5xl", opacity: "opacity-75" },
    { letter: "T O Z", size: "text-2xl md:text-3xl", opacity: "opacity-60" },
    { letter: "L P E D", size: "text-lg md:text-xl", opacity: "opacity-45" },
    { letter: "P E C F D", size: "text-sm md:text-base", opacity: "opacity-30" },
  ];

  return (
    <div className="relative flex aspect-[4/5] w-full max-w-md flex-col items-center justify-center border border-ink/10 bg-white/80 p-8 shadow-[0_20px_60px_rgba(28,45,55,0.08)] backdrop-blur-sm md:p-10">
      <div className="absolute inset-3 border border-ink/5" aria-hidden />
      <p className="absolute left-4 top-4 font-mono text-[0.65rem] uppercase tracking-widest text-muted">
        Agudeza visual
      </p>

      <div className="flex flex-col items-center gap-3 font-display font-bold text-ink">
        {rows.map((row, i) => (
          <motion.p
            key={row.letter}
            className={`${row.size} ${row.opacity} tracking-[0.35em]`}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
          >
            {row.letter}
          </motion.p>
        ))}
      </div>

      <div className="absolute -bottom-4 -right-4 hidden border border-ink/10 bg-orange px-4 py-3 text-white md:block">
        <p className="font-display text-2xl font-bold leading-none">20/20</p>
        <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-wider opacity-80">
          Visión clara
        </p>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="inicio"
      className="snellen-bg relative overflow-hidden pt-[8.5rem] md:pt-[9.5rem]"
    >
      <HeroBackground />

      <div className="relative z-[1] mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-16 md:px-8 md:py-24 lg:py-28">
        <Reveal>
          <p className="mb-5 inline-block border-l-2 border-orange pl-3 font-mono text-xs uppercase tracking-[0.15em] text-blue">
            Oftalmología · Consulta privada
          </p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.25rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink text-balance">
            Tu visión, en manos de especialistas
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
            El Dr. Andy Alvarenga y la Dra. Karla Vides te atienden en Colonia Médica
            con evaluación visual, diagnóstico especializado y cirugías oftalmológicas.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-orange px-6 py-3.5 font-display text-sm font-semibold text-white transition-colors hover:bg-orange-dark"
            >
              <MessageCircle size={18} />
              Agendar cita
            </a>
            <a
              href="#servicios"
              className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white/90 px-6 py-3.5 font-display text-sm font-semibold text-ink transition-colors hover:border-blue hover:text-blue"
            >
              Ver servicios
              <ArrowUpRight size={16} />
            </a>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-teal/35 bg-teal/10 px-6 py-3.5 font-display text-sm font-semibold text-ink transition-colors hover:border-teal hover:bg-teal hover:text-white"
            >
              <Navigation size={17} />
              Cómo llegar
            </a>
          </div>

          <dl className="mt-12 grid gap-x-8 gap-y-6 border-t border-ink/10 pt-8 sm:grid-cols-2">
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
            <div className="border-l-2 border-orange pl-4">
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

        <Reveal delay={0.12} className="flex justify-center md:justify-end">
          <EyeChartVisual />
        </Reveal>
      </div>
    </section>
  );
}
