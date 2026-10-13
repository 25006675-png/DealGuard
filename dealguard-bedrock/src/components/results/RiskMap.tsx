"use client";

import { AGENT_BY_ID } from "@/lib/agents";
import { PROVISIONS } from "@/lib/provisions";
import type { Analysis, Grade } from "@/lib/types";
import { useLang } from "../lang";
import { cx } from "../ui";
import { GRADE_STYLE, ProvisionMark } from "./shared";

const COLUMNS: { grade: Grade; label: string }[] = [
  { grade: "deal_breaker", label: "Deal-breakers" },
  { grade: "unfavourable", label: "Worth negotiating" },
  { grade: "normal", label: "Normal" },
];

/** Specialist × grade grid: every graded point sits in one cell, so the totals trace back to clauses. */
export function RiskMap({ analysis, onOpenProvision }: { analysis: Analysis; onOpenProvision: (id: string) => void }) {
  const { t } = useLang();
  const label = (id: string) => PROVISIONS.find((d) => d.id === id)?.label ?? id;
  const totals = { deal_breaker: analysis.check.dealBreakers, unfavourable: analysis.check.unfavourable, normal: analysis.check.normal };

  return (
    <div className="mt-6">
      <h3 className="text-[15px] font-semibold">{t("Risk map")}</h3>
      <p className="mt-0.5 text-[13px] text-ink-3">{t("Each specialist's points by grade. Click a point to see the clause.")}</p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,1.4fr))_minmax(0,0.8fr)] gap-px overflow-hidden rounded-xl border border-line bg-line text-[13px] sm:grid-cols-[minmax(0,1.1fr)_repeat(2,minmax(0,1.4fr))_minmax(0,0.8fr)]">
        <div className="bg-surface px-3 py-2.5" />
        {COLUMNS.map(({ grade, label: colLabel }) => {
          const g = GRADE_STYLE[grade];
          return (
            <div key={grade} className="bg-surface px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[22px] font-semibold tracking-tight sm:text-[26px]">
                <g.Icon size={18} style={{ color: g.color }} aria-hidden />
                {totals[grade]}
              </p>
              <p className="text-[12px] leading-snug text-ink-2 sm:text-[13px]">{t(colLabel)}</p>
            </div>
          );
        })}

        {analysis.reviews.map((review) => {
          const agent = AGENT_BY_ID[review.agent];
          return [
            <div key={review.agent} className="bg-surface px-3 py-2.5">
              <p className="font-medium leading-snug">
                <span className="sm:hidden">{t(agent.short)}</span>
                <span className="hidden sm:inline">{t(agent.label)}</span>
              </p>
            </div>,
            ...COLUMNS.map(({ grade }) => {
              const items = review.provisions.filter((p) => p.grade === grade);
              // Normal points don't need the owner's attention, so they collapse to a count.
              if (grade === "normal" && items.length) {
                const g = GRADE_STYLE.normal;
                return (
                  <div key={`${review.agent}-${grade}`} className="px-2 py-2" style={{ background: g.soft }}>
                    <button
                      onClick={() => onOpenProvision(items[0].provision_id)}
                      title={items.map((p) => t(label(p.provision_id))).join(", ")}
                      className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left leading-snug hover:bg-surface/70"
                    >
                      <g.Icon size={16} className="shrink-0" style={{ color: g.color }} aria-hidden />
                      <span className="underline decoration-line-strong decoration-1 underline-offset-[3px]">{t("{n} normal", { n: items.length })}</span>
                    </button>
                  </div>
                );
              }
              return (
                <div key={`${review.agent}-${grade}`} className={cx("px-2 py-2", !items.length && "bg-surface")} style={items.length ? { background: GRADE_STYLE[grade].soft } : undefined}>
                  {items.length ? (
                    <ul className="space-y-0.5">
                      {items.map((p) => (
                        <li key={p.provision_id}>
                          <button onClick={() => onOpenProvision(p.provision_id)} className="flex w-full items-start gap-1.5 rounded-md px-1 py-0.5 text-left leading-snug hover:bg-surface/70 hover:underline">
                            <span className="mt-px">
                              <ProvisionMark p={p} />
                            </span>
                            <span className="min-w-0 break-words underline decoration-line-strong decoration-1 underline-offset-[3px]">{t(label(p.provision_id))}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="px-1 text-ink-3" aria-label={t("None")}>
                      –
                    </span>
                  )}
                </div>
              );
            }),
          ];
        })}
      </div>
    </div>
  );
}
