import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

let observer: IntersectionObserver | undefined;
const targets = new Set<Element>();

function observe(element: HTMLElement) {
  observer ??= new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute("data-reveal", "visible");
      observer?.unobserve(entry.target);
      targets.delete(entry.target);
    }
    if (!targets.size) { observer?.disconnect(); observer = undefined; }
  }, { rootMargin: "120px 0px", threshold: 0 });
  targets.add(element);
  observer.observe(element);
  return () => {
    observer?.unobserve(element);
    targets.delete(element);
    if (!targets.size) { observer?.disconnect(); observer = undefined; }
  };
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
};

export function Reveal({ children, className = "", delay = 0, immediate = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || immediate || typeof IntersectionObserver === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Content already on screen (including deep links) must never wait for an entrance.
    const bounds = element.getBoundingClientRect();
    const destination = document.getElementById(window.location.hash.slice(1));
    if (reduce.matches || destination?.contains(element) || (bounds.top < window.innerHeight && bounds.bottom >= 0)) return;
    element.dataset.reveal = "pending";
    const stop = observe(element);
    const show = () => {
      if (reduce.matches) { element.dataset.reveal = "visible"; stop(); }
    };
    reduce.addEventListener("change", show);
    return () => { stop(); reduce.removeEventListener("change", show); delete element.dataset.reveal; };
  }, [immediate]);

  return <div ref={ref} className={`nv-reveal ${className}`} style={{ "--reveal-delay": `${Math.min(Math.max(delay, 0), 0.08)}s` } as CSSProperties}>
    {children}
  </div>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-blue-deep mb-4">
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.12] tracking-[-0.03em] text-ink text-balance ${className}`}
    >
      {children}
    </h2>
  );
}
