import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!bar.current || media.matches || document.body.style.position === "fixed") return;
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const progress = distance > 0 ? Math.max(0, Math.min(1, window.scrollY / distance)) : 0;
      bar.current.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => { if (!frame && !media.matches) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
    };
  }, []);

  return <div className="nv-scroll-progress pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] bg-ink/5" aria-hidden="true">
    <div ref={bar} className="h-full origin-left bg-[linear-gradient(90deg,#018AB6_0%,#2DB1A4_58%,#FA8017_100%)]" style={{ transform: "scaleX(0)" }} />
  </div>;
}
