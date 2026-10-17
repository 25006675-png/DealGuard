"use client";

import { Banknote, Clock, FileText, Mail, Plus, ScrollText, TriangleAlert } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { checkPlaybook } from "@/lib/playbook";
import { GROUPS, PROVISIONS } from "@/lib/provisions";
import { SAMPLE_DEAL, SAMPLE_TERMS } from "@/lib/sample";
import { CHECK_STYLE } from "../results/shared";
import { CashCliff } from "./CashCliff";
import { HeroScan } from "./HeroScan";
import { GridBeams, RevealText, Signature } from "./kit";
import { PipelineDemo } from "./PipelineDemo";

const ease = [0.16, 1, 0.3, 1] as const;

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.9, ease },
} as const;

function Mark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Image src="/logo.png" alt="" width={20} height={24} priority className="lp-logo" />
      <span className="text-[15px] font-semibold tracking-tight">DealGuard MY</span>
    </Link>
  );
}

function CTA({ className = "", center = false }: { className?: string; center?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 ${center ? "justify-center" : ""} ${className}`}>
      <Link href="/app" className="lp-cta group relative inline-flex h-12 items-center overflow-hidden rounded-full px-7 text-[15px] font-semibold">
        <span className="relative z-10">Review a deal</span>
        <span aria-hidden className="lp-cta-shine" />
      </Link>
      <Link
        href="/app?sample=1"
        className="inline-flex h-12 items-center rounded-full border border-[var(--line-strong)] px-6 text-[15px] font-medium text-[var(--ink)] backdrop-blur-sm transition-colors duration-300 hover:border-[var(--paper)] hover:bg-white/[0.06]"
      >
        See the sample analysis
      </Link>
    </div>
  );
}

function SectionHead({ lines, lede, center = false }: { lines: string[]; lede?: string; center?: boolean }) {
  return (
    <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      <RevealText lines={lines} className="lp-serif text-balance text-[38px] leading-[1.02] sm:text-[56px]" />
      {lede ? (
        <motion.p {...reveal} transition={{ ...reveal.transition, delay: 0.25 }} className={`mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-2 ${center ? "mx-auto" : ""}`}>
          {lede}
        </motion.p>
      ) : null}
    </div>
  );
}

/** Card whose border and wash light up around the pointer. */
function Spot({ title, body, children, className = "", i = 0 }: { title: string; body: string; children: ReactNode; className?: string; i?: number }) {
  const ref = useRef<HTMLElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    el.style.setProperty("--sy", `${e.clientY - r.top}px`);
  };
  return (
    <motion.article
      ref={ref}
      onPointerMove={move}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay: i * 0.08, ease }}
      className={`lp-spot group flex flex-col overflow-hidden rounded-2xl ${className}`}
    >
      <div className="relative z-[1] flex-1 p-5">{children}</div>
      <div className="relative z-[1] border-t border-line p-5">
        <h3 className="text-[16px] font-semibold">{title}</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{body}</p>
      </div>
    </motion.article>
  );
}

const listItem = (i: number) =>
  ({
    initial: { opacity: 0, x: -12 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { delay: 0.35 + i * 0.09, duration: 0.6, ease },
  }) as const;

/** Faint section drawing of bored piles, drawn once behind the hero. */
function PileDrawing() {
  const piles = [120, 300, 480, 660, 840, 1020, 1200];
  const draw = (delay: number) => ({ initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 2.2, delay, ease } });
  return (
    <svg aria-hidden viewBox="0 0 1320 260" preserveAspectRatio="xMidYMax slice" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[260px] w-full opacity-40">
      <g fill="none" stroke="var(--bp-line)" strokeWidth="1">
        <motion.path d="M0 60 H1320" {...draw(0.4)} />
        <motion.path d="M0 64 H1320" strokeDasharray="2 6" {...draw(0.5)} />
        {piles.map((x, i) => (
          <g key={x}>
            <motion.path d={`M${x - 18} 60 V240 M${x + 18} 60 V240 M${x - 18} 240 Q${x} 256 ${x + 18} 240`} {...draw(0.8 + i * 0.1)} />
            <motion.path d={`M${x} 52 V248`} strokeDasharray="10 4 2 4" strokeOpacity="0.6" {...draw(0.9 + i * 0.1)} />
          </g>
        ))}
        <motion.path d="M120 30 H300 M120 24 V36 M300 24 V36" strokeOpacity="0.8" {...draw(1.8)} />
      </g>
      <text x="210" y="20" textAnchor="middle" className="fill-[var(--bp-line)] font-mono text-[11px]">
        1800
      </text>
    </svg>
  );
}

function HazardTape() {
  const flags = [
    "Pay-when-paid",
    "Uncapped LAD",
    "Back-to-back EOT",
    "14-day time bars",
    "Retention tied to the main contract",
    "Set-off without notice",
    "On-demand bonds",
    "Their interpretation prevails",
    "Indemnity for the employer's LAD",
  ];
  const row = (
    <div className="flex shrink-0 items-center">
      {flags.map((f) => (
        <span key={f} className="flex items-center gap-4 px-6">
          <TriangleAlert size={16} strokeWidth={2.2} aria-hidden />
          <span className="lp-tape-text whitespace-nowrap">{f}</span>
        </span>
      ))}
    </div>
  );
  return (
    <section aria-label="Clauses DealGuard flags" className="relative z-10 -my-6 overflow-hidden py-10">
      <motion.div
        aria-hidden
        className="lp-tape-stripes absolute left-[-5%] right-[-5%] top-1/2 h-8 -translate-y-1/2"
        initial={{ rotate: 2.2, scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease }}
      />
      <motion.div
        className="lp-tape relative py-3.5"
        initial={{ rotate: -1.6, scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1.06, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, delay: 0.15, ease }}
      >
        <div className="lp-marquee flex w-max">
          {row}
          <div aria-hidden className="flex">
            {row}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Steps() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 45%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 22 });
  const steps = [
    ["Read", "Intake sorts every document. The fact ledger pulls each commercial term with its exact quote and page."],
    ["Review", "Payment, scope, time, remedies and consistency specialists work through all 23 provisions at once."],
    ["Decide", "Your red lines, the cash model and a strategist turn it into a verdict, the asks, and letters ready to send."],
  ];
  return (
    <ol ref={ref} className="relative mt-12 space-y-10 pl-10">
      <span aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-[var(--line-strong)]" />
      <motion.span aria-hidden style={{ scaleY: fill }} className="lp-trace absolute bottom-2 left-[6.5px] top-2 w-[2px] origin-top rounded-full" />
      {steps.map(([t, d], i) => (
        <motion.li key={t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.12 }} className="relative">
          <span aria-hidden className="absolute -left-10 top-2 grid size-[15px] place-items-center rounded-full border border-[var(--amber)] bg-[var(--bg-deep)]">
            <span className="size-[5px] rounded-full bg-[var(--amber)]" />
          </span>
          <p className="lp-serif text-[30px] leading-tight">{t}</p>
          <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-ink-2">{d}</p>
        </motion.li>
      ))}
    </ol>
  );
}

const FAQ = [
  ["Is this legal advice?", "No. DealGuard is commercial decision support: it shows what the documents say, what that means for your cash and time, and what to ask for. For anything you're about to rely on in a dispute, have a construction lawyer review it."],
  ["Where do my documents go?", "They're sent to Claude on Amazon Bedrock in the AWS account that runs DealGuard, analysed, and not stored by DealGuard. The results live in your browser session."],
  ["How do I know it isn't making things up?", "Every fact in the ledger carries a quote that Bedrock's citations feature returns straight from your document, with the page. Click any reference to see the clause in context."],
  ["Which documents work?", "PDF works best. Word, CSV and text files work, and so do photos of pages. Save Excel BQs as PDF or CSV first."],
  ["How long does it take, and what does it cost to run?", "About three minutes for a typical package. Each review makes eight Claude calls; at list prices that's roughly US$0.30–1.50 of AWS usage for a 3–5 document package."],
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="border-t border-[var(--line)]">
      {FAQ.map(([q, a], i) => {
        const on = open === i;
        return (
          <motion.div key={q} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className="border-b border-[var(--line)]">
            <button
              type="button"
              aria-expanded={on}
              onClick={() => setOpen(on ? null : i)}
              className="group flex w-full items-center justify-between gap-6 py-6 text-left text-[17px] font-medium transition-colors hover:text-[var(--paper)]"
            >
              <span className={on ? "text-[var(--paper)]" : "text-ink-2 group-hover:text-[var(--paper)]"}>{q}</span>
              <motion.span animate={{ rotate: on ? 45 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--line-strong)] text-[var(--amber)]">
                <Plus size={16} aria-hidden />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {on ? (
                <motion.div
                  key="a"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-6 text-[15.5px] leading-relaxed text-ink-2">{a}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

export function Landing() {
  const checks = checkPlaybook(SAMPLE_TERMS, SAMPLE_DEAL.redLines).filter((c) => c.status === "breach").slice(0, 3);
  const hero = useRef<HTMLElement>(null);

  // Blueprint tokens on <html> too, so canvas scenes reading the root pick them up.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("lp");
    return () => root.classList.remove("lp");
  }, []);

  // Page progress, compact nav, hero parallax.
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const [compact, setCompact] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setCompact(v > 40));

  const { scrollYProgress: heroOut } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const titleY = useTransform(heroOut, [0, 1], [0, 140]);
  const titleFade = useTransform(heroOut, [0, 0.7], [1, 0]);
  const paperY = useTransform(heroOut, [0, 1], [0, -90]);

  const onHeroMove = (e: React.PointerEvent) => {
    const el = hero.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="lp min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--ink)]">
        <motion.div aria-hidden style={{ scaleX: progress }} className="lp-progress fixed inset-x-0 top-0 z-50 h-[2px] origin-left" />

        <header className="fixed inset-x-0 top-0 z-40 px-3">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease }}
            className={`mx-auto mt-3 flex h-14 items-center justify-between gap-6 rounded-full border px-5 backdrop-blur-xl transition-all duration-500 ease-out ${
              compact ? "max-w-4xl border-[var(--line-strong)] bg-[rgba(7,26,51,0.72)] shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]" : "max-w-6xl border-transparent bg-transparent"
            }`}
          >
            <Mark />
            <nav className="hidden items-center gap-7 text-[14px] text-ink-2 md:flex" aria-label="Sections">
              {[
                ["#product", "Product"],
                ["#how", "How it works"],
                ["#malaysia", "Malaysian rules"],
                ["#faq", "FAQ"],
              ].map(([h, l]) => (
                <a key={h} href={h} className="lp-navlink relative py-1 transition-colors hover:text-[var(--paper)]">
                  {l}
                </a>
              ))}
            </nav>
            <Link href="/app" className="inline-flex h-9 items-center rounded-full bg-[var(--paper)] px-4 text-[13.5px] font-semibold text-[var(--bg)] transition-transform duration-300 hover:scale-[1.03]">
              Open DealGuard
            </Link>
          </motion.div>
        </header>

        {/* Hero */}
        <section ref={hero} onPointerMove={onHeroMove} className="lp-hero relative isolate overflow-hidden pt-28">
          <div aria-hidden className="lp-aurora lp-aurora-a absolute -z-20" />
          <div aria-hidden className="lp-aurora lp-aurora-b absolute -z-20" />
          <div aria-hidden className="lp-grid absolute inset-0 -z-10" />
          <div aria-hidden className="lp-grid lp-grid-lit absolute inset-0 -z-10" />
          <GridBeams />
          <PileDrawing />

          <div className="relative mx-auto max-w-6xl px-4 pb-32 pt-10 sm:px-6 lg:pb-40 lg:pt-8">
            <motion.div style={{ y: titleY, opacity: titleFade }}>
              <RevealText
                as="h1"
                onMount
                delay={0.25}
                stagger={0.07}
                lines={["Know what you're signing", "before you sign."]}
                className="lp-serif lp-hero-title text-[50px] leading-[0.98] sm:text-[78px] lg:text-[96px]"
              />
            </motion.div>

            <div className="mt-14 grid items-start gap-14 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="lg:pt-4">
                <motion.p
                  initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.9, duration: 1, ease }}
                  className="max-w-[30rem] text-[18px] leading-relaxed text-ink-2"
                >
                  DealGuard reads your Letter of Award and subcontract the way a commercial manager would. It flags the clauses that cost you money, links every point to its page,
                  and checks your cash flow before you commit.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 1, ease }}>
                  <CTA className="mt-9" />
                  <p className="mt-6 text-[13.5px] text-ink-3">For small construction businesses in Malaysia. Checked against CIPAA 2012.</p>
                </motion.div>
                <Signature delay={1.6} className="mt-14 max-w-sm" />
              </div>
              <motion.div style={{ y: paperY }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}>
                <HeroScan />
              </motion.div>
            </div>
          </div>
        </section>

        <HazardTape />

        {/* The cash cliff */}
        <section className="relative bg-[var(--bg-deep)]">
          <div className="mx-auto max-w-6xl px-4 pb-32 pt-36 sm:px-6">
            <SectionHead
              lines={["A RM 2.4M job.", "RM 300k in the bank."]}
              lede="The sample deal, run through DealGuard's cash model: monthly claims, 21 days to certify, 60 days to pay, retention on top. Scroll to watch the cash run out."
            />
            <motion.div
              initial={{ opacity: 0, y: 60, rotateX: 12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.2, ease }}
              style={{ transformPerspective: 1200 }}
              className="lp-panel mt-16 rounded-3xl p-5 sm:p-9"
            >
              <CashCliff />
            </motion.div>
          </div>
        </section>

        {/* Product bento */}
        <section id="product" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-4 py-32 sm:px-6">
            <SectionHead lines={["Everything a commercial manager", "would check, in plain English."]} lede="Built for the owner who signs the LOA, not for a legal department." />
            <div className="mt-16 grid gap-4 md:grid-cols-3">
              <Spot i={0} className="md:col-span-2" title="Contract breakdown" body="23 provisions across six areas, each with what it says, what you must do, the risk and the ask. Step through them like a checklist.">
                <div className="grid gap-3 sm:grid-cols-[190px_1fr]">
                  <ul className="space-y-1 text-[12.5px]">
                    {GROUPS.slice(2, 4)
                      .flatMap((g) => PROVISIONS.filter((p) => p.group === g.id).slice(0, 3))
                      .map((p, i) => (
                        <motion.li
                          key={p.id}
                          {...listItem(i)}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${i === 2 ? "border border-[var(--line-strong)] bg-white/[0.05] font-medium" : "text-ink-2"}`}
                        >
                          <span className="size-2 rounded-full" style={{ background: ["var(--warning)", "var(--serious)", "var(--critical)", "var(--serious)", "var(--serious)", "var(--warning)"][i] }} />
                          {p.label}
                        </motion.li>
                      ))}
                  </ul>
                  <motion.div
                    initial={{ opacity: 0, y: 16, rotate: -1.5 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.9, ease }}
                    className="lp-sheet rounded-md p-4 text-[12.5px] text-[#1B2433]"
                  >
                    <p className="font-serif text-[17px]">Conditional payment</p>
                    <p className="mt-1 text-[#1B2433]/70">Payment depends on the main contractor being paid by the employer.</p>
                    <p className="mt-3 text-[11.5px] font-semibold text-[#1B2433]/55">What you must do</p>
                    <p className="mt-0.5">Reply in writing that the condition is void under CIPAA s.35 if payment is held back.</p>
                    <p className="mt-3 rounded bg-[#FF5A4E]/12 px-2 py-1.5">
                      <span className="font-semibold text-[#C2362C]">Ask: </span>delete the pay-when-paid proviso.
                    </p>
                  </motion.div>
                </div>
              </Spot>
              <Spot i={1} title="Every deadline" body="Notices, time bars and conditions precedent, in the order you'll meet them. Download it as a checklist.">
                <ul className="space-y-2 text-[12.5px]">
                  {[
                    ["Sign and return the LOA", "within 3 days"],
                    ["Notice of delay event", "within 7 days of the event"],
                    ["Submit variation claim", "within 14 days of instruction"],
                  ].map(([a, d], i) => (
                    <motion.li key={a} {...listItem(i)} className="rounded-lg border border-[var(--line)] bg-white/[0.03] px-3 py-2">
                      <p>{a}</p>
                      <p className="mt-0.5 flex items-center gap-1 font-semibold text-[var(--amber)]">
                        <Clock size={11} aria-hidden /> {d}
                      </p>
                    </motion.li>
                  ))}
                </ul>
              </Spot>
              <Spot i={2} title="Your red lines, checked" body="Set your limits once. Every deal is measured against them, and against CIPAA 2012 defaults.">
                <ul className="space-y-1.5 text-[12.5px]">
                  {checks.map((c, i) => {
                    const s = CHECK_STYLE[c.status];
                    return (
                      <motion.li key={c.id} {...listItem(i)} className="flex items-start gap-2 rounded-lg border border-[var(--line)] bg-white/[0.03] px-3 py-2">
                        <s.Icon size={14} className="mt-px shrink-0" style={{ color: s.color }} aria-hidden />
                        <span>
                          <span className="font-medium">{c.label}</span>
                          <span className="block text-ink-3">
                            {c.rule}, deal: <span style={{ color: s.text }}>{c.actual}</span>
                          </span>
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>
              </Spot>
              <Spot i={3} title="Click any point, see the clause" body="Quotes come back from your document through Bedrock citations, with the page. Nothing paraphrased, nothing invented.">
                <div className="lp-sheet overflow-hidden rounded-md text-[#1B2433]">
                  <p className="flex items-center gap-1.5 border-b border-[#1B2433]/10 px-3 py-1.5 text-[11.5px] text-[#1B2433]/60">
                    <FileText size={12} aria-hidden /> Subcontract_Conditions_RevB, cl. 9.3
                  </p>
                  <p className="px-3 py-2.5 font-serif text-[13.5px] leading-relaxed text-[#1B2433]/75">
                    …
                    <span className="relative text-[#1B2433]">
                      <motion.span
                        aria-hidden
                        className="absolute -inset-x-0.5 inset-y-0 origin-left rounded-[2px] bg-[#FFB020]/45"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6, duration: 1.2, ease }}
                      />
                      <span className="relative">
                        submitted within fourteen (14) days of the instruction, failing which the Subcontractor shall be deemed to have waived its entitlement
                      </span>
                    </span>
                    .
                  </p>
                </div>
              </Spot>
              <Spot i={4} title="Documents ready to send" body="A negotiation letter, notice templates with this contract's deadlines, and a financing pack for your bank.">
                <ul className="space-y-2 text-[13px]">
                  {(
                    [
                      [Mail, "Negotiation letter"],
                      [ScrollText, "Notice templates"],
                      [Banknote, "Financing pack"],
                    ] as const
                  ).map(([I, label], i) => (
                    <motion.li key={label} {...listItem(i)} className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-white/[0.03] px-3 py-2">
                      <span className="grid size-7 place-items-center rounded-md bg-[var(--amber)]/15 text-[var(--amber)]">
                        <I size={14} aria-hidden />
                      </span>
                      {label}
                    </motion.li>
                  ))}
                </ul>
              </Spot>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-24 bg-[var(--bg-deep)]">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-32 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <SectionHead
                lines={["Eight specialists", "read it at once."]}
                lede="One for each area a commercial manager would check, running in parallel on Claude in Amazon Bedrock. Your red lines and the cash maths are plain rules you can check."
              />
              <Steps />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.1, ease }}
              className="lp-panel overflow-hidden rounded-3xl p-1.5"
            >
              <PipelineDemo />
            </motion.div>
          </div>
        </section>

        {/* Malaysia */}
        <section id="malaysia" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-4 py-32 sm:px-6">
            <SectionHead lines={["Knows the rules your", "contracts run on."]} lede="Built around Malaysian subcontract practice: the statutes, standard forms and habits that decide whether you get paid." />
            <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[var(--line-strong)] sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["CIPAA 2012", "Flags pay-when-paid terms (void under s.35), benchmarks payment against the s.36 default terms, and keeps your adjudication and suspension rights in view."],
                ["LAD and time", "Spots uncapped LAD, extra indemnities for the employer's LAD, and EOT that only flows if the employer grants it upstream."],
                ["Standard forms", "Reads PAM 2018, CIDB 2022 and PWD 203A subcontracts, and the bespoke conditions main contractors write themselves."],
                ["Retention and bonds", "Catches retention released on the main contract's milestones instead of yours, and on-demand bonds that outlive your works."],
              ].map(([t, d], i) => (
                <motion.div
                  key={t}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.1, duration: 0.9, ease }}
                  className="lp-rule group relative bg-[var(--bg)] p-7 transition-colors duration-500 hover:bg-[#0d2a4f]"
                >
                  <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-[var(--amber)] transition-transform duration-500 ease-out group-hover:scale-x-100" />
                  <p className="lp-serif text-[26px] leading-tight text-[var(--paper)]">{t}</p>
                  <p className="mt-4 text-[14px] leading-relaxed text-ink-2">{d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-24 bg-[var(--bg-deep)]">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-32 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHead lines={["Questions", "owners ask."]} />
            <Faq />
          </div>
        </section>

        {/* Closing CTA */}
        <section className="lp-hero relative isolate overflow-hidden">
          <div aria-hidden className="lp-aurora lp-aurora-b absolute -z-20" />
          <div aria-hidden className="lp-grid absolute inset-0 -z-10" />
          <GridBeams />
          <div className="mx-auto max-w-6xl px-4 py-40 text-center sm:px-6">
            <RevealText lines={["Your next Letter of Award", "deserves a second reader."]} className="lp-serif mx-auto max-w-5xl text-balance text-[42px] leading-[1] sm:text-[72px]" />
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.4 }}>
              <CTA className="mt-12" center />
            </motion.div>
            <Signature complete delay={0.6} className="mx-auto mt-20 max-w-sm text-left" />
          </div>
        </section>

        <footer className="border-t border-[var(--line)] bg-[var(--bg-deep)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-[13px] text-ink-3 sm:px-6">
            <Mark />
            <p>Commercial guidance only, not legal advice. Sample documents are fictional. Built on Claude in Amazon Bedrock.</p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
