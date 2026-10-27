"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type FloatingSymbol = {
  char: string;
  position: string; // tailwind position classes
  size: string;
  accent?: boolean; // glowing accent colour vs. quiet outline tone
  mobile?: boolean; // show on small screens too
  drift: { x: number; y: number; rotate: number };
  duration: number;
  delay: number;
};

const SYMBOLS: FloatingSymbol[] = [
  { char: "%", position: "left-[5%] top-[16%]", size: "text-4xl sm:text-6xl", accent: true, mobile: true, drift: { x: 8, y: 18, rotate: 10 }, duration: 6.5, delay: 0 },
  { char: "+", position: "left-[22%] top-[8%]", size: "text-3xl sm:text-5xl", drift: { x: -6, y: 14, rotate: -12 }, duration: 5.5, delay: 0.8 },
  { char: "÷", position: "left-[8%] top-[52%]", size: "text-3xl sm:text-5xl", drift: { x: 10, y: -16, rotate: 8 }, duration: 7, delay: 0.3 },
  { char: "×", position: "left-[24%] top-[70%]", size: "text-4xl sm:text-6xl", accent: true, drift: { x: -8, y: 20, rotate: 14 }, duration: 6, delay: 1.2 },
  { char: "%", position: "right-[22%] top-[20%]", size: "text-3xl sm:text-5xl", drift: { x: 6, y: -14, rotate: -8 }, duration: 6.8, delay: 0.5 },
  { char: "×", position: "right-[6%] top-[12%]", size: "text-4xl sm:text-6xl", accent: true, mobile: true, drift: { x: -10, y: 16, rotate: -14 }, duration: 5.8, delay: 1 },
  { char: "+", position: "right-[9%] top-[48%]", size: "text-3xl sm:text-5xl", mobile: true, drift: { x: 8, y: -18, rotate: 12 }, duration: 7.2, delay: 0.2 },
  { char: "÷", position: "right-[24%] top-[72%]", size: "text-4xl sm:text-6xl", accent: true, drift: { x: -6, y: 14, rotate: -10 }, duration: 6.2, delay: 1.5 },
];

export function FloatingSymbols() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 select-none">
      {SYMBOLS.map((s, i) => (
        // outer element: one-time entrance
        <motion.span
          key={i}
          className={cn(
            "absolute font-mono font-bold leading-none",
            s.position,
            s.size,
            s.accent
              ? "text-accent drop-shadow-[0_0_14px_var(--accent-glow)]"
              : "text-foreground/20",
            !s.mobile && "hidden sm:block",
          )}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 + i * 0.12, ease: "easeOut" }}
        >
          {/* inner element: endless floating */}
          <motion.span
            className="block"
            animate={
              reduce
                ? undefined
                : {
                    y: [0, -s.drift.y, 0],
                    x: [0, s.drift.x, 0],
                    rotate: [0, s.drift.rotate, 0],
                  }
            }
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {s.char}
          </motion.span>
        </motion.span>
      ))}
    </div>
  );
}