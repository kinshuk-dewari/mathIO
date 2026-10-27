"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { FloatingSymbols } from "./FloatingSymbols";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden border-b border-border px-6 pb-24 pt-20 text-center sm:pb-32 sm:pt-28">
      <FloatingSymbols />

      {/* soft glow behind the character */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[30%] -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center">
        
        {/* the title sits BEHIND the image (z-0 vs z-10) */}
        <motion.h1
          className="relative z-0 select-none font-mono text-[clamp(3.5rem,13vw,8.5rem)] font-black leading-none tracking-tighter text-foreground"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          MATHIO
        </motion.h1>

        {/* negative margin pulls the image up over the lower part of the title.
            Make it bigger/smaller to change how much of the title is covered. */}
        <motion.div
          className="relative z-10 -mt-[min(7.6vw,4.9rem)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/mascot.png" 
              alt="MATHIO mascot"
              width={1254} // set these to your image's real dimensions
              height={1254}
              priority
              className="h-[46vh] min-h-152 max-h-168 w-auto max-w-full"
            />
          </motion.div>
        </motion.div>

        <motion.p
          className="mt-14 font-mono text-2xl font-bold tracking-tight sm:text-4xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
        >
          Outthink your opponent.{" "}
        </motion.p>

        <motion.p
          className="mt-5 max-w-md text-muted"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65, ease: EASE }}
        >
          The sharper, faster mind
          takes the win.
        </motion.p>
      </div>
    </section>
  );
}