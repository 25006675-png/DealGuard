"use client";

import { ArrowRight, BadgeCheck, Check, ChevronDown, Copy, FileSearch, FileWarning, Hand, Loader2, RotateCw, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { rmCompact, VERDICT } from "@/lib/format";
import { PROVISION_BY_ID } from "@/lib/provisions";
import type { Analysis, ProvisionRecord } from "@/lib/types";
import { useEvidence } from "../evidence";
import { useLang } from "../lang";
import { Button, Card, cx } from "../ui";
import { useGuides } from "./guides";
import { RiskMap } from "./RiskMap";
import { GRADE_STYLE, GradeBadge } from "./shared";

/** Risky points in the order to act on them: the strategist's focus, then deal-breakers, then by cost. */
export function orderRisky(a: Analysis) {
  const all = a.reviews.flatMap((r) => r.provisions);
  const focus = a.decision?.focus ?? [];
  const rank = (p: ProvisionRecord) => {
    const f = focus.indexOf(p.provision_id);
    if (f >= 0) return f;
    return (p.grade === "deal_breaker" ? 100 : 200) - Math.min(99, (p.cost_rm ?? 0) / 100_000);
  };
  const risky = all.filter((p) => p.grade !== "normal").sort((x, y) => rank(x) - rank(y));
  const top = risky.filter((p) => focus.includes(p.provision_id) || p.grade === "deal_breaker");
  return { top, rest: risky.filter((p) => !top.includes(p)), normal: all.filter((p) => p.grade === "normal") };
}

/** One risky point as one decision: a one-line row that opens to the problem, the fix and the choice. */
function RiskCard({
  p,
  open: expanded,
  onOpenChange,
  selected,
  onDecide,
}: {
  p: ProvisionRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: boolean;
  onDecide: (ask: boolean) => void;
}) {
  const { open, factById } = useEvidence();
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const g = GRADE_STYLE[p.grade];
  const n = p.negotiation;
  const sourceId = p.change?.replaces_fact_id ?? p.fact_ids[0];
  const replaced = p.change?.replaces_fact_id ? factById(p.change.replaces_fact_id)?.sources[0] : undefined;
  const original = replaced?.quote ?? null;
  // The contract's own words, from the fact ledger, so the citation never depends on the guide step.
  const cited = p.fact_ids.map((id) => factById(id)?.sources[0]).find(Boolean);
  const { state, ensure } = useGuides();
  const clauseRef = p.clause_ref ?? p.change?.clause_ref;

  function toggle() {
    if (!expanded) ensure(p.provision_id);
    onOpenChange(!expanded);
  }

  return (
    <Card as="article" id={`point-${p.provision_id}`} className="relative scroll-mt-32 overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: g.color }} aria-hidden />
      <button onClick={toggle} aria-expanded={expanded} className="flex w-full items-center gap-3 py-4 pl-6 pr-4 text-left hover:bg-surface-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-3">
            <GradeBadge grade={p.grade} />
            <span>{t(PROVISION_BY_ID[p.provision_id]?.label ?? "")}</span>
            {clauseRef ? <span>· {clauseRef}</span> : null}
          </div>
          <h3 className="mt-1.5 text-[17px] font-semibold leading-snug tracking-tight">{p.headline}</h3>
        </div>
        {p.cost_rm ? (
          <span className="hidden shrink-0 text-right sm:block">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-3">{t("Could cost you")}</span>
            <span className="block text-[16px] font-semibold tabular">{rmCompact(p.cost_rm)}</span>
          </span>
        ) : null}
        <span
          className={cx("hidden shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium sm:inline-flex sm:items-center sm:gap-1", selected ? "bg-brand-soft text-brand" : "bg-sunken text-ink-3")}
        >
          {selected ? <Check size={12} strokeWidth={3} aria-hidden /> : null}
          {selected ? t("Negotiating") : t("Accepting")}
        </span>
        <ChevronDown size={18} className={cx("shrink-0 text-ink-3 transition-transform", expanded && "rotate-180")} aria-hidden />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-5 border-t border-line pb-5 pl-6 pr-5 pt-4">
              {/* The problem */}
              <div>
                {p.why ? <p className="max-w-[65ch] text-[15px] leading-relaxed text-ink-2">{p.why}</p> : null}
                <div className="mt-3 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-[1fr_1fr_auto]">
                  <div className="bg-surface px-4 py-3">
                    <p className="text-[11.5px] font-medium uppercase tracking-wide text-ink-3">{t("Usual in Malaysia")}</p>
                    <p className="mt-0.5 text-[14.5px]">{p.normal}</p>
                  </div>
                  <div className="px-4 py-3" style={{ background: g.soft }}>
                    <p className="text-[11.5px] font-medium uppercase tracking-wide" style={{ color: g.text }}>
                      {t("Your contract")}
                    </p>
                    <p className="mt-0.5 text-[14.5px] font-medium">{p.yours}</p>
                  </div>
                  {p.cost_rm ? (
                    <div className="bg-surface px-4 py-3 sm:min-w-44">
                      <p className="text-[11.5px] font-medium uppercase tracking-wide text-ink-3">{t("Could cost you")}</p>
                      <p className="mt-0.5 text-[18px] font-semibold tracking-tight">{rmCompact(p.cost_rm)}</p>
                      {p.cost_note ? <p className="text-[11.5px] leading-snug text-ink-3">{p.cost_note}</p> : null}
                    </div>
                  ) : null}
                </div>
                {cited && !original ? (
                  <figure className="mt-3">
                    <SourceLine docName={cited.docName} page={cited.page} />
                    <blockquote className="mt-1 line-clamp-4 max-w-[75ch] font-serif text-[14.5px] leading-relaxed">
                      <mark className="quote text-ink">{cited.quote}</mark>
                    </blockquote>
                  </figure>
                ) : null}
              </div>

              {/* The fix */}
              <section>
                <h4 className="text-[13px] font-semibold text-brand">{t("What to ask for")}</h4>
                {n ? (
                  <>
                    <p className="mt-1 text-[15px] leading-relaxed">{n.ask}</p>
                    {p.change ? (
                      <div className="mt-3 space-y-2">
                        {replaced ? (
                          <div>
                            <SourceLine docName={replaced.docName} page={replaced.page} />
                            <p className="mt-1 rounded-lg px-3 py-2 font-serif text-[14.5px] leading-relaxed line-through decoration-[var(--critical)] decoration-1" style={{ background: "var(--critical-soft)" }}>
                              {original}
                            </p>
                          </div>
                        ) : null}
                        <div>
                          <p className="text-[11.5px] font-medium uppercase tracking-wide text-ink-3">{t("Proposed wording")}</p>
                          <p className="mt-1 rounded-lg px-3 py-2 font-serif text-[14.5px] leading-relaxed underline decoration-[var(--good)] decoration-1 underline-offset-4" style={{ background: "var(--good-soft)" }}>
                            {p.change.proposed_wording}
                          </p>
                        </div>
                      </div>
                    ) : null}
                    <dl className="mt-3 space-y-1.5 text-[14px] leading-snug">
                      <div>
                        <dt className="inline font-medium">{t("If they refuse, you can accept:")}</dt> <dd className="inline text-ink-2">{n.minimum}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium" style={{ color: "var(--critical-text)" }}>
                          {t("Walk away if:")}
                        </dt>{" "}
                        <dd className="inline text-ink-2">{n.walk_away}</dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <GuidePending state={state[p.provision_id]} onRetry={() => ensure(p.provision_id)} />
                )}
              </section>

              {/* Actions and the decision */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <div className="flex flex-wrap gap-2">
                  {sourceId ? (
                    <Button size="sm" onClick={() => open(sourceId)}>
                      <FileSearch size={15} aria-hidden /> {t("Show the clause")}
                    </Button>
                  ) : null}
                  {n ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        navigator.clipboard?.writeText(n.script).then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        })
                      }
                      title={n.script}
                    >
                      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} {copied ? t("Copied") : t("Copy what to say")}
                    </Button>
                  ) : null}
                </div>
                <div className="flex rounded-lg bg-sunken p-0.5" role="radiogroup" aria-label={t("Your decision")}>
                  {(
                    [
                      [true, "Negotiate"],
                      [false, "Accept as is"],
                    ] as const
                  ).map(([ask, label]) => (
                    <button
                      key={label}
                      role="radio"
                      aria-checked={selected === ask}
                      onClick={() => onDecide(ask)}
                      className={cx(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium",
                        selected === ask ? (ask ? "bg-brand text-on-brand shadow-sm" : "bg-surface text-ink shadow-sm") : "text-ink-3 hover:text-ink-2",
                      )}
                    >
                      {selected === ask ? <Check size={13} strokeWidth={3} aria-hidden /> : null}
                      {t(label)}
                    </button>
                  ))}
                </div>
              </div>
              {sourceId ? null : <p className="text-[13px] text-ink-3">{t("Not in the contract; ask for it to be added")}</p>}
              {p.rule_note ? (
                <p className="text-[12.5px] text-ink-3">
                  {t("Rule check:")} {p.rule_note}
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

/** Labels a quote from the contract with its document and page. */
function SourceLine({ docName, page }: { docName: string; page?: number }) {
  const { t } = useLang();
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-[11.5px] text-ink-3">
      <span className="font-medium uppercase tracking-wide">{t("Your contract says")}</span>
      <span>
        {docName}
        {page ? <span className="font-mono"> · p.{page}</span> : null}
      </span>
    </p>
  );
}

/** Shown while a guide is being generated, or if generating it failed. */
export function GuidePending({ state, onRetry }: { state: ReturnType<typeof useGuides>["state"][string] | undefined; onRetry: () => void }) {
  const { t } = useLang();
  if (state?.status === "error") {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg px-3.5 py-3 text-[13.5px]" style={{ background: "var(--warning-soft)", color: "var(--warning-text)" }}>
        <span>{state.message}</span>
        <button onClick={onRetry} className="flex shrink-0 items-center gap-1 font-medium hover:underline">
          <RotateCw size={13} aria-hidden /> {t("Retry")}
        </button>
      </div>
    );
  }
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-live="polite">
      {["Ask for", "You can accept", "Walk away if"].map((label, i) => (
        <div key={label} className="rounded-lg bg-surface-2 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
            {i === 0 ? <Loader2 size={12} className="animate-spin" aria-hidden /> : null}
            {t(label)}
          </p>
          <div className="mt-2 h-2.5 w-4/5 animate-pulse rounded bg-sunken" />
          <div className="mt-1.5 h-2.5 w-3/5 animate-pulse rounded bg-sunken" />
        </div>
      ))}
      <p className="text-[12.5px] text-ink-3 sm:col-span-3">{t("Preparing your negotiation guide from the clause…")}</p>
    </div>
  );
}

export function ActionPlan({
  analysis,
  selected,
  onToggle,
  goTo,
  onOpenProvision,
}: {
  analysis: Analysis;
  selected: Set<string>;
  onToggle: (id: string) => void;
  goTo: (tab: "changes" | "breakdown" | "cash" | "sources") => void;
  onOpenProvision: (id: string) => void;
}) {
  const { t } = useLang();
  const { top, rest, normal } = orderRisky(analysis);
  const [showRest, setShowRest] = useState(false);
  const [showNormal, setShowNormal] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const { ensure } = useGuides();

  // Risk map clicks open the point's card here; normal points have no card, so they go to the breakdown.
  function openPoint(id: string) {
    const inRest = rest.some((p) => p.provision_id === id);
    if (!inRest && !top.some((p) => p.provision_id === id)) return onOpenProvision(id);
    if (inRest) setShowRest(true);
    ensure(id);
    setOpenId(id);
    requestAnimationFrame(() => document.getElementById(`point-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  const card = (p: ProvisionRecord) => (
    <RiskCard
      key={p.provision_id}
      p={p}
      open={openId === p.provision_id}
      onOpenChange={(o) => setOpenId(o ? p.provision_id : null)}
      selected={selected.has(p.provision_id)}
      onDecide={(ask) => {
        if (ask !== selected.has(p.provision_id)) onToggle(p.provision_id);
      }}
    />
  );
  const d = analysis.decision;
  const v = d ? VERDICT[d.verdict] : null;
  const f = analysis.funding;
  // The week the first progress payment lands (cash in rises above the advance), with spending up to just before it.
  const paidAt = f.series.findIndex((s) => s.received > (f.series[0]?.received ?? 0));
  const firstPaid = paidAt > 0 ? { week: f.series[paidAt].week, cost: f.series[paidAt - 1].cost } : null;
  const provisions = analysis.reviews.flatMap((r) => r.provisions);
  const quotes = analysis.facts.reduce((n, x) => n + x.sources.length, 0);
  // Why the result may be off: documents not provided, drafts only. Failed checks have their own banner.
  const names = (list: string[]) => (list.length > 3 ? `${list.slice(0, 3).join(", ")} ${t("+{n} more", { n: list.length - 3 })}` : list.join(", "));
  const missingDocs = (analysis.intake?.missing_documents ?? []).map((m) => m.name);
  const drafts = (analysis.intake?.documents ?? []).filter((x) => x.status === "draft").map((x) => x.doc_type);
  const cautions = [
    missingDocs.length ? t("{docs} not provided", { docs: names(missingDocs) }) : null,
    drafts.length ? t("{docs} only in draft", { docs: names(drafts) }) : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl pb-28">
      {/* Verdict */}
      <div>
        {v ? (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold" style={{ background: v.soft, color: v.text }}>
            <Hand size={14} aria-hidden /> {t(v.label)}
          </span>
        ) : null}
        <h2 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">{d?.headline ?? t("Here's what to fix before you sign.")}</h2>
        {d?.summary ? <p className="mt-2 max-w-[70ch] text-[16px] leading-relaxed text-ink-2">{d.summary}</p> : null}
        {cautions.length ? (
          <p className="mt-3 flex max-w-[70ch] items-start gap-2 rounded-lg px-3 py-2 text-[14px]" style={{ background: "var(--warning-soft)", color: "var(--warning-text)" }}>
            <FileWarning size={15} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              {t("This result may not be fully accurate:")} {cautions.join("; ")}.
            </span>
          </p>
        ) : null}
      </div>

      {/* Proof */}
      <ul className="mt-5 flex flex-wrap gap-2 text-[13px]">
        <li className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5">
          <BadgeCheck size={14} style={{ color: "var(--good)" }} aria-hidden /> {t("{n} of 23 contract points checked", { n: provisions.length })}
        </li>
        <li>
          <button onClick={() => goTo("sources")} className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 hover:border-brand">
            <BadgeCheck size={14} style={{ color: "var(--good)" }} aria-hidden /> {t("{n} quotes matched to your documents", { n: quotes })}
          </button>
        </li>
      </ul>

      <RiskMap analysis={analysis} onOpenProvision={openPoint} />

      {/* Cash */}
      {f.gap > 0 ? (
        <Card className="mt-6 overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 p-5" style={{ background: "var(--critical-soft)" }}>
            <span className="grid size-10 place-items-center rounded-xl bg-surface" style={{ color: "var(--critical)" }}>
              <Wallet size={20} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold">{t("Can you afford this job? Not on these terms.")}</p>
              <p className="mt-0.5 text-[14.5px] text-ink-2">
                {t("You'd need")} <strong className="text-ink">{rmCompact(f.peakNeed)}</strong>{" "}
                {t("before payments catch up, around week {week}. You have {have}, so you're", { week: f.peakWeek, have: rmCompact(analysis.deal.fundingCommitment) })}{" "}
                <strong style={{ color: "var(--critical-text)" }}>{t("{gap} short", { gap: rmCompact(f.gap) })}</strong>.
              </p>
              {firstPaid ? (
                <p className="mt-1 text-[13px] text-ink-3">
                  {t("Why: your first payment only arrives around week {week}, and by then you've spent about {spent}.", { week: firstPaid.week, spent: rmCompact(firstPaid.cost) })}
                </p>
              ) : null}
            </div>
            <button onClick={() => goTo("cash")} className="flex items-center gap-1 text-[13.5px] font-medium text-brand hover:underline">
              {t("See the cash flow")} <ArrowRight size={14} aria-hidden />
            </button>
          </div>
        </Card>
      ) : null}

      {/* Risky points */}
      <h3 className="mt-10 text-[20px] font-semibold tracking-tight">{t("Fix these first")}</h3>
      <p className="mt-1 max-w-[70ch] text-[14px] text-ink-2">
        {t("We've picked the {n} points most worth negotiating. Open one to see the problem, the wording to propose and what to accept; switch any to \"Accept as is\" if you're happy with it.", { n: top.length })}
      </p>
      <div className="mt-4 space-y-3">{top.map(card)}</div>

      {rest.length ? (
        <div className="mt-8">
          <button onClick={() => setShowRest(!showRest)} className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-5 py-3.5 text-left hover:bg-surface-2" aria-expanded={showRest}>
            <span>
              <span className="text-[16px] font-semibold">{t("Also worth negotiating")}</span>
              <span className="ml-2 text-[13.5px] text-ink-3">{t("{n} points · negotiate if you have room, concede if needed", { n: rest.length })}</span>
            </span>
            <ChevronDown size={18} className={cx("text-ink-3 transition-transform", showRest && "rotate-180")} aria-hidden />
          </button>
          {showRest ? (
            <div className="mt-4 space-y-3">{rest.map(card)}</div>
          ) : null}
        </div>
      ) : null}

      {normal.length ? (
        <div className="mt-4">
          <button onClick={() => setShowNormal(!showNormal)} className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-5 py-3.5 text-left hover:bg-surface-2" aria-expanded={showNormal}>
            <span>
              <span className="text-[16px] font-semibold">{t("Looks normal")}</span>
              <span className="ml-2 text-[13.5px] text-ink-3">{t("{n} points · usual for Malaysian subcontracts", { n: normal.length })}</span>
            </span>
            <ChevronDown size={18} className={cx("text-ink-3 transition-transform", showNormal && "rotate-180")} aria-hidden />
          </button>
          {showNormal ? (
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface">
              {normal.map((p) => (
                <li key={p.provision_id} className="flex items-start gap-3 px-5 py-3">
                  <GRADE_STYLE.normal.Icon size={16} className="mt-0.5 shrink-0" style={{ color: "var(--good)" }} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-medium">{p.headline}</p>
                    <p className="text-[13px] text-ink-3">{p.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {/* Sticky action bar */}
      <div className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-line bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="text-[14px]">
            <span className="font-semibold">{selected.size}</span> {selected.size === 1 ? t("point to negotiate") : t("points to negotiate")}
          </p>
          <button
            onClick={() => goTo("changes")}
            disabled={!selected.size}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-[14.5px] font-medium text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {t("Prepare reply")} <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
