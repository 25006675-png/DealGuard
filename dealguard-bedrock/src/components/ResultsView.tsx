"use client";

import { MessageSquareText, RotateCcw, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AGENT_BY_ID } from "@/lib/agents";
import { rm } from "@/lib/format";
import { PROVISIONS } from "@/lib/provisions";
import type { Analysis } from "@/lib/types";
import { ActionPlan, orderRisky } from "./results/ActionPlan";
import { Breakdown } from "./results/Breakdown";
import { CashFlow } from "./results/CashFlow";
import { Deadlines } from "./results/Deadlines";
import { GuidesProvider, useGuides } from "./results/guides";
import { useLang } from "./lang";
import { Method } from "./results/Method";
import { ProposedChanges } from "./results/ProposedChanges";
import { Sources } from "./results/Sources";
import { Button, cx } from "./ui";

type TabId = "plan" | "changes" | "breakdown" | "deadlines" | "cash" | "sources" | "method";

const PRIMARY: { id: TabId; label: string }[] = [
  { id: "plan", label: "Action plan" },
  { id: "changes", label: "Your reply" },
];
const DETAIL: { id: TabId; label: string }[] = [
  { id: "breakdown", label: "All 23 points" },
  { id: "deadlines", label: "Deadlines" },
  { id: "cash", label: "Cash flow" },
  { id: "sources", label: "Sources" },
  { id: "method", label: "How we checked" },
];

export function ResultsView({ analysis, onAsk, onReset }: { analysis: Analysis; onAsk: () => void; onReset: () => void }) {
  // Guides for the points to fix first start generating straight away.
  const prefetch = orderRisky(analysis).top.map((p) => p.provision_id);
  return (
    <GuidesProvider analysis={analysis} prefetch={prefetch}>
      {(merged) => <ResultsBody analysis={merged} onAsk={onAsk} onReset={onReset} />}
    </GuidesProvider>
  );
}

function ResultsBody({ analysis, onAsk, onReset }: { analysis: Analysis; onAsk: () => void; onReset: () => void }) {
  const { ensure } = useGuides();
  const { t } = useLang();
  const [tab, setTab] = useState<TabId>("plan");
  // Start with the points to fix first already ticked.
  const [selected, setSelected] = useState<Set<string>>(() => new Set(orderRisky(analysis).top.map((p) => p.provision_id)));
  const [provision, setProvision] = useState(() => orderRisky(analysis).top[0]?.provision_id ?? PROVISIONS[0].id);

  function go(next: TabId) {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function toggle(id: string) {
    if (!selected.has(id)) ensure(id);
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function openProvision(id: string) {
    setProvision(id);
    go("breakdown");
  }

  const tabButton = (item: { id: TabId; label: string }, primary: boolean) => (
    <button
      key={item.id}
      onClick={() => go(item.id)}
      className={cx(
        "relative whitespace-nowrap px-3.5 pb-3 pt-3 text-sm",
        primary ? "font-semibold" : "font-medium",
        tab === item.id ? "text-ink" : primary ? "text-ink-2 hover:text-ink" : "text-ink-3 hover:text-ink-2",
      )}
      aria-current={tab === item.id ? "page" : undefined}
    >
      {t(item.label)}
      {item.id === "changes" && selected.size ? <span className="ml-1.5 rounded-full bg-brand px-1.5 py-px text-[11px] tabular text-on-brand">{selected.size}</span> : null}
      {tab === item.id ? <motion.span layoutId="tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" /> : null}
    </button>
  );

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-20 pt-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-3">{t("Deal review")}</p>
          <h1 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight sm:text-[24px]">{analysis.deal.packageType || t("Subcontract package")}</h1>
          <p className="mt-1 text-sm tabular text-ink-2">
            {rm(analysis.deal.contractValue)}
            {analysis.deal.durationWeeks ? ` · ${t("{n} weeks", { n: analysis.deal.durationWeeks })}` : ""} · {t("{n} documents", { n: analysis.documents.length })}
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Button onClick={onAsk}>
            <MessageSquareText size={16} aria-hidden /> {t("Ask DealGuard")}
          </Button>
          <Button variant="ghost" onClick={onReset}>
            <RotateCcw size={16} aria-hidden /> {t("New review")}
          </Button>
        </div>
      </div>

      {analysis.failures.length ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--warning-soft)", color: "var(--warning-text)" }}>
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
          {t("Some checks didn't finish ({list}). Results are partial; see How we checked.", { list: analysis.failures.map((f) => t(AGENT_BY_ID[f.agent].short)).join(", ") })}
        </p>
      ) : null}

      <nav className="no-print sticky top-14 z-20 -mx-4 mt-5 flex items-center gap-1 overflow-x-auto border-b border-line bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] px-4 backdrop-blur sm:mx-0 sm:px-0" aria-label="Review sections">
        {PRIMARY.map((item) => tabButton(item, true))}
        <span className="mx-2 h-5 w-px shrink-0 bg-line-strong" aria-hidden />
        {DETAIL.map((item) => tabButton(item, false))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="mt-8">
          {tab === "plan" ? <ActionPlan analysis={analysis} selected={selected} onToggle={toggle} goTo={go} onOpenProvision={openProvision} /> : null}
          {tab === "changes" ? <ProposedChanges analysis={analysis} selected={selected} onToggle={toggle} goBack={() => go("plan")} /> : null}
          {tab === "breakdown" ? <Breakdown analysis={analysis} selected={provision} onSelect={setProvision} /> : null}
          {tab === "deadlines" ? <Deadlines analysis={analysis} onOpenProvision={openProvision} /> : null}
          {tab === "cash" ? <CashFlow analysis={analysis} /> : null}
          {tab === "sources" ? <Sources analysis={analysis} /> : null}
          {tab === "method" ? <Method analysis={analysis} /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
