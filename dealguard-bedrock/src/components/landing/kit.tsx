"use client";

import { motion } from "motion/react";
import { Fragment } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Text that rises out of a mask word by word. `lines` keeps intended line breaks
 * on wide screens; words still wrap naturally on narrow ones.
 */
export function RevealText({
  lines,
  as: Tag = "h2",
  className = "",
  delay = 0,
  onMount = false,
  stagger = 0.055,
}: {
  lines: string[];
  as?: "h1" | "h2" | "p";
  className?: string;
  delay?: number;
  onMount?: boolean;
  stagger?: number;
}) {
  let n = 0;
  return (
    <Tag className={className}>
      <span className="sr-only">{lines.join(" ")}</span>
      <span aria-hidden>
        {lines.map((line, li) => (
          <Fragment key={li}>
            {li > 0 ? <br className="hidden sm:block" /> : null}
            {line.split(" ").map((w) => {
              const i = n++;
              const motionProps = onMount
                ? { animate: { y: "0%", rotate: 0 } }
                : { whileInView: { y: "0%", rotate: 0 }, viewport: { once: true, margin: "-60px" } };
              return (
                <Fragment key={`${li}-${i}`}>
                  <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-top">
                    <motion.span
                      className="inline-block origin-bottom-left"
                      initial={{ y: "135%", rotate: 3 }}
                      {...motionProps}
                      transition={{ delay: delay + i * stagger, duration: 1.05, ease }}
                    >
                      {w}
                    </motion.span>
                  </span>{" "}
                </Fragment>
              );
            })}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}

/**
 * A signature written onto a signature line. In the hero the pen stops halfway
 * (DealGuard says wait); at the end of the page it finishes.
 */
export function Signature({ complete = false, delay = 0, className = "" }: { complete?: boolean; delay?: number; className?: string }) {
  const stop = complete ? 0 : 46; // % of the name left unwritten
  const trigger = complete
    ? { whileInView: { clipPath: `inset(-20% ${stop}% -30% -5%)` }, viewport: { once: true, margin: "-80px" } }
    : { animate: { clipPath: `inset(-20% ${stop}% -30% -5%)` } };
  const fade = complete
    ? { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" } }
    : { animate: { opacity: 1, y: 0 } };
  const write = complete ? 2.2 : 1.5;

  return (
    <div aria-hidden className={`relative select-none ${className}`}>
      <div className="relative h-[70px]">
        <span className="absolute bottom-[-10px] left-3 inline-block">
          <motion.span
            className="lp-sign inline-block whitespace-nowrap text-[64px] leading-none"
            initial={{ clipPath: "inset(-20% 100% -30% -5%)" }}
            {...trigger}
            transition={{ delay, duration: write, ease: [0.55, 0.05, 0.3, 1] }}
          >
            Faizal Rahman
          </motion.span>
          {!complete ? (
            <motion.span
              className="lp-nib absolute top-[46%] size-2 rounded-full"
              style={{ left: `${100 - stop}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + write - 0.1, type: "spring", stiffness: 400, damping: 15 }}
            />
          ) : null}
        </span>
      </div>
      <motion.div
        className="h-px origin-left bg-[var(--line-strong)]"
        initial={{ scaleX: 0 }}
        {...(complete ? { whileInView: { scaleX: 1 }, viewport: { once: true } } : { animate: { scaleX: 1 } })}
        transition={{ delay: Math.max(0, delay - 0.5), duration: 0.9, ease }}
      />
      <div className="mt-2 flex items-baseline justify-between gap-4 text-[12.5px]">
        <span className="text-ink-3">Subcontractor&apos;s signature</span>
        <motion.span
          className={complete ? "text-ink-2" : "font-medium text-[var(--amber)]"}
          initial={{ opacity: 0, y: 6 }}
          {...fade}
          transition={{ delay: delay + write + 0.15, duration: 0.6, ease }}
        >
          {complete ? "Signed knowing what it says" : "Wait. Read clause 12.3 first."}
        </motion.span>
      </div>
    </div>
  );
}

type Beam = { d: "h" | "v"; at: number; from: number; len: number; delay: number; dur: number };

// Light pulses that run along the blueprint grid (grid pitch is 120px).
const BEAMS: Beam[] = [
  { d: "h", at: 2, from: 0, len: 6, delay: 0.4, dur: 3.2 },
  { d: "h", at: 5, from: 4, len: 7, delay: 2.2, dur: 3.8 },
  { d: "h", at: 7, from: 1, len: 5, delay: 4.1, dur: 3.4 },
  { d: "h", at: 3, from: 9, len: 6, delay: 1.3, dur: 3.6 },
  { d: "v", at: 3, from: 0, len: 5, delay: 1.0, dur: 3.0 },
  { d: "v", at: 8, from: 1, len: 6, delay: 3.0, dur: 3.6 },
  { d: "v", at: 11, from: 0, len: 4, delay: 5.0, dur: 2.8 },
  { d: "v", at: 14, from: 2, len: 5, delay: 2.6, dur: 3.2 },
];

export function GridBeams() {
  const P = 120;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {BEAMS.map((b, i) => {
        const len = b.len * P;
        const h = b.d === "h";
        return (
          <div
            key={i}
            className="absolute overflow-hidden"
            style={
              h
                ? { top: b.at * P - 1, left: b.from * P - 1, width: len, height: 1 }
                : { left: b.at * P - 1, top: b.from * P - 1, height: len, width: 1 }
            }
          >
            <motion.div
              className={h ? "lp-streak-h absolute inset-y-0 w-[180px]" : "lp-streak-v absolute inset-x-0 h-[180px]"}
              initial={h ? { x: -180 } : { y: -180 }}
              animate={h ? { x: [-180, len] } : { y: [-180, len] }}
              transition={{ delay: b.delay, duration: b.dur, repeat: Infinity, repeatDelay: 4 + (i % 3) * 2.5, ease: [0.4, 0, 0.6, 1] }}
            />
          </div>
        );
      })}
    </div>
  );
}
