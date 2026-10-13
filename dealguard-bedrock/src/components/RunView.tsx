"use client";

import { Calculator, Check, CircleDashed, Loader2, TriangleAlert } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AGENTS } from "@/lib/agents";
import type { AgentId } from "@/lib/types";
import { useLang } from "./lang";
import type { NodeState } from "./PipelineScene";
import { Card } from "./ui";

const PipelineScene = dynamic(() => import("./PipelineScene"), { ssr: false });

export function StatusIcon({ state, calc }: { state: NodeState; calc?: boolean }) {
  if (state === "running") return <Loader2 size={16} className="animate-spin" style={{ color: "var(--series-1)" }} aria-label="Running" />;
  if (state === "done") return <Check size={16} className="text-brand" aria-label="Done" />;
  if (state === "failed") return <TriangleAlert size={16} style={{ color: "var(--critical)" }} aria-label="Failed" />;
  return calc ? <Calculator size={16} className="text-ink-3" aria-label="Waiting" /> : <CircleDashed size={16} className="text-ink-3" aria-label="Waiting" />;
}

export function RunView({ status, details, demo }: { status: Partial<Record<AgentId, NodeState>>; details: Partial<Record<AgentId, string>>; demo: boolean }) {
  const { t } = useLang();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
    return () => clearInterval(id);
  }, []);

  const done = AGENTS.filter((a) => status[a.id] === "done" || status[a.id] === "failed").length;
  const current = AGENTS.filter((a) => status[a.id] === "running");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-ink-3">{t("Analysing your deal")}</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">
            {current.length ? `${current.map((a) => t(a.short)).join(", ")}…` : done === AGENTS.length ? t("Putting the decision together…") : t("Starting…")}
          </h1>
        </div>
        <p className="text-sm tabular text-ink-2">
          {t("{done} of {total} steps", { done, total: AGENTS.length })} · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          {" · "}
          {demo ? t("demo replay") : t("usually about 1 min")}
        </p>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken">
        <div className="h-1 rounded-full bg-brand transition-[width] duration-500" style={{ width: `${(done / AGENTS.length) * 100}%` }} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="paper relative min-h-[440px] overflow-hidden sm:min-h-[560px]">
          <div className="absolute inset-0">
            <PipelineScene status={status} className="h-full w-full" />
          </div>
          <p className="absolute bottom-3 left-4 text-[12px] text-ink-3">{t("Inputs at the top · decision at the bottom")}</p>
        </Card>
        <Card className="p-2">
          <ol aria-live="polite" className="divide-y divide-line">
            {AGENTS.map((a) => {
              const s = status[a.id] ?? "idle";
              return (
                <li key={a.id} className="flex items-start gap-3 px-3 py-2.5">
                  <span className="mt-0.5">
                    <StatusIcon state={s} calc={a.kind === "calculation"} />
                  </span>
                  <div className="min-w-0">
                    <p className={s === "idle" ? "text-sm text-ink-3" : "text-sm font-medium"}>{t(a.label)}</p>
                    <p className="text-[12px] leading-snug text-ink-3">{s === "failed" ? details[a.id] : t(a.blurb)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}
