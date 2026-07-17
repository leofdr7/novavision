import { ArrowUpRight, MessageCircle, Navigation } from "lucide-react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";
import { clinic, wazeUrl, whatsappUrl } from "../data/clinic";
import { Reveal } from "./ui/Reveal";

function clamp(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function useInteractiveMotion() {
  const reduce = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 70, damping: 20, mass: 0.35 });
  const y = useSpring(rawY, { stiffness: 70, damping: 20, mass: 0.35 });

  useEffect(() => {
    if (reduce) return;

    const update = (clientX: number, clientY: number) => {
      rawX.set(clamp((clientX / window.innerWidth - 0.5) * 2));
      rawY.set(clamp((clientY / window.innerHeight - 0.5) * 2));
    };

    const onPointerMove = (event: PointerEvent) => {
      update(event.clientX, event.clientY);
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) update(touch.clientX, touch.clientY);
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma == null || event.beta == null) return;
      rawX.set(clamp(event.gamma / 35));
      rawY.set(clamp((event.beta - 45) / 45));
    };

    const reset = () => {
      rawX.set(0);
      rawY.set(0);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", reset, { passive: true });
    window.addEventListener("deviceorientation", onOrientation, { passive: true });
    document.addEventListener("mouseleave", reset);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", reset);
      window.removeEventListener("deviceorientation", onOrientation);
      document.removeEventListener("mouseleave", reset);
    };
  }, [rawX, rawY, reduce]);

  return {
    reduce,
    farX: useTransform(x, [-1, 1], [-8, 8]),
    farY: useTransform(y, [-1, 1], [-6, 6]),
    midX: useTransform(x, [-1, 1], [-16, 16]),
    midY: useTransform(y, [-1, 1], [-12, 12]),
    nearX: useTransform(x, [-1, 1], [-26, 26]),
    nearY: useTransform(y, [-1, 1], [-18, 18]),
    cardX: useTransform(x, [-1, 1], [-5, 5]),
    cardY: useTransform(y, [-1, 1], [-4, 4]),
    cardRotateX: useTransform(y, [-1, 1], [2.2, -2.2]),
    cardRotateY: useTransform(x, [-1, 1], [-2.8, 2.8]),
  };
}

type InteractiveMotion = ReturnType<typeof useInteractiveMotion>;

function HeroBackground({ interaction }: { interaction: InteractiveMotion }) {
  const { reduce } = interaction;
  const { scrollY } = useScroll();
  const gridPosition = useTransform(scrollY, [0, 900], ["0px 0px", "0px 64px"]);
  const ringOneY = useTransform(scrollY, [0, 900], [0, 105]);
  const ringTwoY = useTransform(scrollY, [0, 900], [0, -70]);
  const ringThreeY = useTransform(scrollY, [0, 900], [0, 145]);
  const blueY = useTransform(scrollY, [0, 900], [0, 85]);
  const tealY = useTransform(scrollY, [0, 900], [0, -55]);
  const orangeY = useTransform(scrollY, [0, 900], [0, 65]);
  const crosshairTop = useTransform(scrollY, [0, 900], ["50%", "62%"]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-bg-gradient" />
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { x: interaction.farX, y: interaction.farY }}
      >
        <motion.div
          className="hero-bg-grid"
          style={reduce ? undefined : { backgroundPosition: gridPosition }}
        />
        <motion.div
          className="hero-bg-ring hero-bg-ring--1"
          style={reduce ? undefined : { y: ringOneY }}
        />
      </motion.div>

      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { x: interaction.midX, y: interaction.midY }}
      >
        <motion.div
          className="hero-bg-ring hero-bg-ring--2"
          style={reduce ? undefined : { y: ringTwoY }}
        />
        <motion.div
          className="hero-bg-blob hero-bg-blob--blue"
          style={reduce ? undefined : { y: blueY }}
        />
        <motion.div
          className="hero-bg-blob hero-bg-blob--teal"
          style={reduce ? undefined : { y: tealY }}
        />
        <motion.div
          className="hero-bg-blob hero-bg-blob--orange"
          style={reduce ? undefined : { y: orangeY }}
        />
      </motion.div>

      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { x: interaction.nearX, y: interaction.nearY }}
      >
        <motion.div
          className="hero-bg-ring hero-bg-ring--3"
          style={reduce ? undefined : { y: ringThreeY }}
        />
        <motion.svg
          className="hero-bg-crosshair"
          viewBox="0 0 200 200"
          fill="none"
          style={reduce ? undefined : { top: crosshairTop }}
        >
          <circle cx="100" cy="100" r="72" stroke="#018AB6" strokeOpacity="0.12" strokeWidth="1" />
          <circle cx="100" cy="100" r="48" stroke="#2DB1A4" strokeOpacity="0.1" strokeWidth="1" />
          <line x1="100" y1="20" x2="100" y2="180" stroke="#1C2D37" strokeOpacity="0.06" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="#1C2D37" strokeOpacity="0.06" />
        </motion.svg>
      </motion.div>
    </div>
  );
}

function EyeChartVisual({ interaction }: { interaction: InteractiveMotion }) {
  const reduce = useReducedMotion();
  const rows = [
    { letter: "E", size: "text-6xl md:text-7xl", opacity: "opacity-90" },
    { letter: "F P", size: "text-4xl md:text-5xl", opacity: "opacity-75" },
    { letter: "T O Z", size: "text-2xl md:text-3xl", opacity: "opacity-60" },
    { letter: "L P E D", size: "text-lg md:text-xl", opacity: "opacity-45" },
    { letter: "P E C F D", size: "text-sm md:text-base", opacity: "opacity-30" },
  ];

  return (
    <motion.div
      className="relative flex aspect-[5/4] w-full max-w-sm flex-col items-center justify-center border border-ink/10 bg-white/80 p-5 shadow-[0_20px_60px_rgba(28,45,55,0.08)] backdrop-blur-sm sm:aspect-[4/5] sm:max-w-xs sm:p-8 md:max-w-md md:p-10"
      style={
        interaction.reduce
          ? undefined
          : {
              x: interaction.cardX,
              y: interaction.cardY,
              rotateX: interaction.cardRotateX,
              rotateY: interaction.cardRotateY,
              transformPerspective: 900,
            }
      }
    >
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
    </motion.div>
  );
}

export function Hero() {
  const interaction = useInteractiveMotion();

  return (
    <section
      id="inicio"
      className="snellen-bg relative overflow-hidden pt-[5.5rem] md:pt-[9.5rem]"
    >
      <HeroBackground interaction={interaction} />

      <div className="relative z-[1] mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:py-14 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-16 md:px-8 md:py-24 lg:py-28">
        <Reveal>
          <p className="mb-5 inline-block border-l-2 border-orange pl-3 font-mono text-xs uppercase tracking-[0.15em] text-blue">
            Oftalmología · Consulta privada
          </p>
          <h1 className="font-hero text-[2.55rem] font-semibold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[3.35rem] lg:text-[4.35rem]">
            <span className="block">
              Tu{" "}
              <span className="relative inline-block italic text-blue after:absolute after:-bottom-0.5 after:left-1/2 after:h-1 after:w-2/5 after:-translate-x-1/2 after:bg-orange after:content-['']">
                visión
              </span>
              ,
            </span>
            <span className="my-1.5 block text-[0.72em] font-medium tracking-[-0.02em] text-ink-soft sm:my-2">
              en manos de
            </span>
            <span className="relative inline-block italic text-teal after:absolute after:-bottom-1 after:left-1/2 after:h-1 after:w-2/5 after:-translate-x-1/2 after:bg-orange after:content-['']">
              especialistas
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-[1.05rem] leading-relaxed text-ink-soft sm:mt-6 sm:text-lg">
            El Dr. Andy Alvarenga y la Dra. Karla Vides te atienden en Colonia Médica
            con evaluación visual, diagnóstico especializado y cirugías oftalmológicas.
          </p>

          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-orange px-6 py-3.5 font-display text-sm font-semibold text-white transition-colors hover:bg-orange-dark"
            >
              <MessageCircle size={18} />
              Agendar cita
            </a>
            <a
              href="#servicios"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-ink/15 bg-white/90 px-6 py-3.5 font-display text-sm font-semibold text-ink transition-colors hover:border-blue hover:text-blue"
            >
              Ver servicios
              <ArrowUpRight size={16} />
            </a>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-teal/35 bg-teal/10 px-6 py-3.5 font-display text-sm font-semibold text-ink transition-colors hover:border-teal hover:bg-teal hover:text-white"
            >
              <Navigation size={17} />
              Cómo llegar
            </a>
          </div>

          <dl className="mt-10 grid gap-x-8 gap-y-5 border-t border-ink/10 pt-7 sm:mt-12 sm:grid-cols-2 sm:gap-y-6 sm:pt-8">
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
          <EyeChartVisual interaction={interaction} />
        </Reveal>
      </div>
    </section>
  );
}
