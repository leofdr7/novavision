import { useLayoutEffect } from "react";

/** Pin the page on iOS as well as desktop, then restore its exact reading position. */
export function useMobileScrollLock(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return;
    const body = document.body;
    const root = document.documentElement;
    const x = window.scrollX;
    const y = window.scrollY;
    const previous = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow };
    Object.assign(body.style, { position: "fixed", top: `-${y}px`, left: `-${x}px`, width: "100%", overflow: "hidden" });
    return () => {
      const scrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      Object.assign(body.style, previous);
      window.scrollTo({ left: x, top: y, behavior: "instant" });
      root.style.scrollBehavior = scrollBehavior;
    };
  }, [active]);
}
