import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.2,
  });

  if (reduce) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] bg-ink/5"
      aria-hidden
    >
      <motion.div
        className="h-full origin-left bg-[linear-gradient(90deg,#018AB6_0%,#2DB1A4_58%,#FA8017_100%)]"
        style={{ scaleX }}
      />
    </div>
  );
}
