"use client";

import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

/** Loads only the DOM animation feature set (smaller bundle). Wraps the app once in the root layout. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

/** Fade/slide in when scrolled into view */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

/** Subtle lift on hover/tap for cards */
export function Lift({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div className={className} whileHover={{ y: -4, rotate: -0.4 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
      {children}
    </m.div>
  );
}

export { m };
