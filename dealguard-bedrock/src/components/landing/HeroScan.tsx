"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

// The hero: a draft subcontract page. An amber scan line reads it top to bottom;
// each risky clause it passes gets marked up and its plain-English meaning slides
// out into the margin. When the page is read, DealGuard stamps it. Then it reads again.

type Tone = "critical" | "serious" | "warning";

const CLAUSES: { no: string; text: string; flag: string; tone: Tone }[] = [
  {
    no: "1.3",
    text: "In the event of any conflict or discrepancy between the documents forming the Subcontract, the Contractor's interpretation shall prevail.",
    flag: "Every conflict in the paperwork is settled their way.",
    tone: "warning",
  },
  {
    no: "9.3",
    text: "Any claim for a variation shall be submitted within fourteen (14) days of the instruction, failing which the Subcontractor shall be deemed to have waived its entitlement.",
    flag: "Miss 14 days and the variation is gone.",
    tone: "serious",
  },
  {
    no: "12.3",
    text: "Payment shall be made within sixty (60) days of certification, provided that the Contractor shall not be obliged to pay any amount until it has received payment from the Employer.",
    flag: "Pay-when-paid. Void under CIPAA s.35.",
    tone: "critical",
  },
  {
    no: "14.3",
    text: "The Subcontractor shall only be entitled to an extension of time to the extent that the Contractor is granted a corresponding extension by the Employer.",
    flag: "No extra time unless the employer gives it to them first.",
    tone: "serious",
  },
  {
    no: "21.1",
    text: "Liquidated damages shall be paid by the Subcontractor at RM 8,000.00 per day for every day of delay, without limit.",
    flag: "RM 8,000 a day in LAD, with no cap.",
    tone: "critical",
  },
];

const TONE: Record<Tone, { mark: string; ink: string; label: string }> = {
  critical: { mark: "rgba(255, 90, 78, 0.22)", ink: "#FF5A4E", label: "Critical" },
  serious: { mark: "rgba(255, 140, 60, 0.22)", ink: "#FF8C3C", label: "Negotiate" },
  warning: { mark: "rgba(255, 176, 32, 0.30)", ink: "#E59A00", label: "Watch" },
};

const SCAN_START = 700; // ms
const SCAN_MS = 4200;
const STAMP_AT = SCAN_START + SCAN_MS + 350;
const CYCLE_MS = STAMP_AT + 4200;

export function HeroScan() {
  const reduce = useReducedMotion();
  const [cycle, setCycle] = useState(0);
  const [flagged, setFlagged] = useState(reduce ? CLAUSES.length : 0);
  const [stamped, setStamped] = useState(!!reduce);

  useEffect(() => {
    if (reduce) {
      setFlagged(CLAUSES.length);
      setStamped(true);
      return;
    }
    setFlagged(0);
    setStamped(false);
    const timers = CLAUSES.map((_, i) =>
      setTimeout(() => setFlagged(i + 1), SCAN_START + SCAN_MS * ((i + 0.7) / CLAUSES.length)),
    );
    timers.push(setTimeout(() => setStamped(true), STAMP_AT));
    timers.push(setTimeout(() => setCycle((c) => c + 1), CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [cycle, reduce]);

  // Gentle tilt that follows the pointer.
  const box = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const onMove = (e: React.PointerEvent) => {
    if (reduce || !box.current) return;
    const r = box.current.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 7);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 7);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const critical = CLAUSES.filter((c) => c.tone === "critical").length;

  return (
    <div ref={box} onPointerMove={onMove} onPointerLeave={onLeave} className="relative [perspective:1400px]">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40, rotateX: 18 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="relative grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_190px]"
      >
        {/* the sheet of paper, behind column one */}
        <div aria-hidden className="lp-sheet absolute inset-y-0 left-0 right-0 rounded-[3px] sm:right-[190px]" />

        {/* header row */}
        <div className="relative col-start-1 flex items-baseline justify-between gap-4 border-b border-[#1B2433]/15 px-6 pb-3 pt-5 text-[12px] text-[#1B2433]/60">
          <span>Conditions of Subcontract, Rev B (draft)</span>
          <span className="font-mono tabular">p. 4 of 31</span>
        </div>
        <div className="hidden sm:block" />

        {CLAUSES.map((c, i) => {
          const on = i < flagged;
          const t = TONE[c.tone];
          return (
            <div key={c.no} className="contents">
              <div className="relative col-start-1 px-6 py-3">
                <div className="grid grid-cols-[38px_1fr] gap-2">
                  <span className="pt-[3px] font-mono text-[12px] text-[#1B2433]/55 tabular">{c.no}</span>
                  <p className="relative font-serif text-[14.5px] leading-[1.55] text-[#1B2433]">
                    <motion.span
                      aria-hidden
                      className="absolute -inset-x-1.5 -inset-y-0.5 origin-left rounded-[2px]"
                      style={{ background: t.mark }}
                      initial={false}
                      animate={{ scaleX: on ? 1 : 0, opacity: on ? 1 : 0 }}
                      transition={{ duration: on ? 0.5 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <span className="relative">{c.text}</span>
                  </p>
                </div>
                {/* margin rule that marks the clause on the sheet */}
                <motion.span
                  aria-hidden
                  className="absolute left-2 top-3 bottom-3 w-[3px] origin-top rounded-full"
                  style={{ background: t.ink }}
                  initial={false}
                  animate={{ scaleY: on ? 1 : 0 }}
                  transition={{ duration: 0.35 }}
                />
                {/* on small screens, the meaning sits inside the sheet */}
                <AnimatePresence>
                  {on ? (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-[46px] mt-1.5 text-[12.5px] font-semibold sm:hidden"
                      style={{ color: t.ink }}
                    >
                      {c.flag}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* margin note */}
              <div className="relative hidden items-start pt-3 sm:flex">
                <AnimatePresence>
                  {on ? (
                    <motion.div
                      key={`${cycle}-${c.no}`}
                      className="flex w-full items-start"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.25 } }}
                    >
                      <motion.span
                        aria-hidden
                        className="mt-[13px] h-px w-5 shrink-0 origin-left"
                        style={{ background: t.ink }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.25 }}
                      />
                      <motion.div
                        initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="lp-note rounded-md px-3 py-2"
                        style={{ borderColor: t.ink }}
                      >
                        <p className="text-[10.5px] font-semibold" style={{ color: t.ink }}>
                          {t.label}
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--paper)]">{c.flag}</p>
                      </motion.div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* footer row with room for the stamp */}
        <div className="relative col-start-1 h-20" />
        <div className="hidden sm:block" />

        {/* scan line */}
        {!reduce ? (
          <motion.div
            key={cycle}
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 sm:right-[190px]"
            initial={{ top: "0%", opacity: 0 }}
            animate={{ top: ["0%", "0%", "100%", "100%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: (SCAN_START + SCAN_MS + 300) / 1000, times: [0, SCAN_START / (SCAN_START + SCAN_MS + 300), (SCAN_START + SCAN_MS) / (SCAN_START + SCAN_MS + 300), 1], ease: "linear" }}
          >
            <div className="lp-beam-trail absolute bottom-0 left-0 right-0 h-24" />
            <div className="lp-beam absolute left-0 right-0 h-[2px]" />
          </motion.div>
        ) : null}

        {/* the stamp */}
        <AnimatePresence>
          {stamped ? (
            <motion.div
              key={`stamp-${cycle}`}
              role="status"
              className="lp-stamp pointer-events-none absolute bottom-4 right-6 sm:right-[214px]"
              initial={reduce ? false : { scale: 2.4, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: -9 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              transition={{ type: "spring", stiffness: 520, damping: 24, mass: 0.9 }}
            >
              <span className="block text-[22px] leading-none">Don&apos;t sign yet</span>
              <span className="mt-1 block text-[11px] font-semibold">
                {critical} critical, {CLAUSES.length - critical} to negotiate
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
