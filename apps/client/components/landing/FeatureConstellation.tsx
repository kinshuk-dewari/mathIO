"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/Button";

type Feature = { title: string; description: string };

const LEFT: Feature[] = [
  {
    title: "Realtime 1v1",
    description: "Two players, one live duel",
  },
  {
    title: "Instant Matchmaking",
    description: "Hit play and you're in the queue",
  },
  {
    title: "Open Challenges",
    description: "See who's online and challenge them",
  },
];

const RIGHT: Feature[] = [
  {
    title: "Speed Pays",
    description: "Solve fast and get more points",
  },
  {
    title: "Live Rating",
    description: "Ratings that move with matches",
  },
  {
    title: "Mistake Review",
    description: "See where you went wrong",
  },
];

// ---------- animation / geometry config ----------
const EASE = [0.22, 1, 0.36, 1] as const;
const NODE_GAP = 14; // space between feature text and where its line starts
const BUTTON_GAP = 6; // space between the line end and the button
const TRUNK = 56; // straight run into the button
const STAGGER = 0.45; // seconds between each line starting
const DRAW = 1.1; // seconds for a line to draw itself
const PULSE = 1.5; // seconds for the glow to travel feature -> button
const CYCLE = 5; // seconds before the whole cascade fires again
const COMET = 0.2; // length of the glowing segment (0-1 of the line)

type Line = { d: string; x: number; y: number; order: number };
type Geometry = { width: number; height: number; lines: Line[] };

const r1 = (n: number) => Math.round(n * 10) / 10;

export function FeatureConstellation() {
  const reduce = useReducedMotion();
  const filterId = useId().replace(/:/g, "");

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inView = useInView(containerRef, { once: true, amount: 0.35 });

  const [geo, setGeo] = useState<Geometry | null>(null);

  // measure the real positions so the lines always connect, at any screen size
  useEffect(() => {
    const container = containerRef.current;
    const button = buttonRef.current;
    if (!container || !button) return;

    const measure = () => {
      const c = container.getBoundingClientRect();
      const b = button.getBoundingClientRect();
      const by = b.top - c.top + b.height / 2;
      const lines: Line[] = [];

      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const isLeft = i < LEFT.length;
        const dir = isLeft ? 1 : -1;

        const x1 = isLeft ? r.right - c.left + NODE_GAP : r.left - c.left - NODE_GAP;
        const y1 = r.top - c.top + r.height / 2;
        const bx = isLeft ? b.left - c.left - BUTTON_GAP : b.right - c.left + BUTTON_GAP;
        const trunk = Math.min(TRUNK, Math.abs(bx - x1) * 0.45);
        const jx = bx - dir * trunk;
        const mid = (x1 + jx) / 2;

        // alternate sides: L0, R0, L1, R1, L2, R2
        const index = isLeft ? i : i - LEFT.length;
        const order = index * 2 + (isLeft ? 0 : 1);

        lines.push({
          d: `M${r1(x1)} ${r1(y1)} C${r1(mid)} ${r1(y1)} ${r1(mid)} ${r1(by)} ${r1(jx)} ${r1(by)} L${r1(bx)} ${r1(by)}`,
          x: r1(x1),
          y: r1(y1),
          order,
        });
      });

      setGeo({ width: r1(c.width), height: r1(c.height), lines });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(button);
    itemRefs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, []);

  const show = inView || !!reduce;

  const renderItem = (feature: Feature, index: number, side: "left" | "right") => {
    const order = (side === "left" ? index : index - LEFT.length) * 2 + (side === "left" ? 0 : 1);
    return (
      // outer div is measured; only the inner one is transformed
      <div
        key={feature.title}
        ref={(el) => {
          itemRefs.current[index] = el;
        }}
        className="max-w-60"
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={show ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, delay: order * STAGGER, ease: EASE }}
        >
          <h3 className="font-mono text-sm font-semibold text-accent">{feature.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{feature.description}</p>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mx-auto mb-20 max-w-xl text-center sm:mb-28">
        <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-4xl">
          Built for the duel, <br /> not the wait.
        </h2>
        <p className="mt-4 text-muted">
          From the first click to the final score, everything is designed to keep you in the game.
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative grid gap-12 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-x-28"
      >
        {/* lines */}
        {geo && (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden overflow-visible lg:block"
            width={geo.width}
            height={geo.height}
            viewBox={`0 0 ${geo.width} ${geo.height}`}
            fill="none"
          >
            <defs>
              {/* userSpaceOnUse so perfectly straight lines (zero-height bbox) still glow */}
              <filter
                id={filterId}
                filterUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={geo.width}
                height={geo.height}
              >
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1) base lines draw themselves one after another */}
            {geo.lines.map((line) => (
              <motion.path
                key={`base-${line.order}`}
                d={line.d}
                className="stroke-foreground/25"
                strokeWidth={1.5}
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: show ? 1 : 0 }}
                transition={{ duration: DRAW, delay: line.order * STAGGER, ease: EASE }}
              />
            ))}

            {/* start nodes */}
            {geo.lines.map((line) => (
              <motion.circle
                key={`node-${line.order}`}
                cx={line.x}
                cy={line.y}
                r={3.5}
                className="fill-accent"
                initial={{ opacity: reduce ? 1 : 0 }}
                animate={{ opacity: show ? 1 : 0 }}
                transition={{ duration: 0.5, delay: line.order * STAGGER }}
              />
            ))}

            {/* 2) glowing pulse travelling feature -> button, staggered, then repeating */}
            {!reduce && (
              <g filter={`url(#${filterId})`}>
                {geo.lines.map((line) => (
                  <motion.path
                    key={`pulse-${line.order}`}
                    d={line.d}
                    className="stroke-accent"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    initial={{ pathLength: COMET, pathOffset: -COMET, opacity: 0 }}
                    animate={
                      inView
                        ? { pathOffset: [-COMET, 1], opacity: [0, 1, 1, 0] }
                        : undefined
                    }
                    transition={{
                      duration: PULSE,
                      delay: line.order * STAGGER + DRAW + 0.2,
                      repeat: Infinity,
                      repeatDelay: CYCLE - PULSE,
                      ease: "easeInOut",
                      times: [0, 0.12, 0.88, 1],
                    }}
                  />
                ))}
              </g>
            )}
          </svg>
        )}

        {/* left features */}
        <div className="flex flex-col items-center gap-10 text-center lg:items-end lg:gap-14 lg:text-right">
          {LEFT.map((f, i) => renderItem(f, i, "left"))}
        </div>

        {/* call to action (first on mobile) */}
        <div className="order-first flex flex-col items-center gap-3 lg:order-0">
          <div ref={buttonRef} className="relative isolate">
            {!reduce && (
              <motion.span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-xl bg-accent/40 blur-xl"
                animate={{ opacity: [0.25, 0.7, 0.25], scale: [1, 1.15, 1] }}
                transition={{ duration: CYCLE / 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <Link href="/auth?mode=register">
              <Button size="lg" >Play Free</Button>
            </Link>
          </div>
          <p className="text-xs text-muted">No downloads</p>
        </div>

        {/* right features */}
        <div className="flex flex-col items-center gap-10 text-center lg:items-start lg:gap-14 lg:text-left">
          {RIGHT.map((f, i) => renderItem(f, LEFT.length + i, "right"))}
        </div>
      </div>
    </div>
  );
}