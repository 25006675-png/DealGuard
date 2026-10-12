"use client";

import { rmCompact } from "@/lib/format";
import type { Analysis } from "@/lib/types";
import { FundingChart } from "../charts";
import { useEvidence } from "../evidence";
import { useLang } from "../lang";
import { Card, CardHeader, cx, RefChip } from "../ui";
import { Stat } from "./shared";

export function CashFlow({ analysis }: { analysis: Analysis }) {
  const { open } = useEvidence();
  const { t } = useLang();
  const f = analysis.funding;
  const paymentFacts = analysis.facts.filter((x) => ["payment", "retention", "advance", "setoff", "lad"].includes(x.category));
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="grid grid-cols-2 gap-3 lg:col-span-12 lg:grid-cols-4">
        <Stat label={t("Peak funding need")} value={rmCompact(f.peakNeed)} sub={t("Week {n}", { n: f.peakWeek })} />
        <Stat label={t("If paid 30 days late")} value={rmCompact(f.peakNeedLate)} sub={t("+{amount} more", { amount: rmCompact(f.peakNeedLate - f.peakNeed) })} />
        <Stat label={t("Shortfall vs your funding")} value={f.gap > 0 ? rmCompact(f.gap) : t("None")} sub={t("{amount} if paid late", { amount: rmCompact(f.gapLate) })} tone={f.gap > 0 ? "bad" : undefined} />
        <Stat label={t("Retention held")} value={rmCompact(f.retentionHeld)} sub={t("Cash you won't see until release")} />
      </div>
      <Card className="lg:col-span-12">
        <CardHeader title={t("Your cash position, week by week")} hint={t("Spend follows an S-curve; claims are paid after certification and payment periods, less retention.")} />
        <div className="p-5">
          <FundingChart funding={f} commitment={analysis.deal.fundingCommitment} />
        </div>
      </Card>
      <Card className="lg:col-span-5">
        <CardHeader title={t("Assumptions")} hint={t("From your documents where stated")} />
        <table className="w-full text-[14px]">
          <tbody className="divide-y divide-line">
            {f.assumptions.map((a) => (
              <tr key={a.label}>
                <td className="px-5 py-2.5 text-ink-2">{a.label}</td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right font-medium tabular">{a.value}</td>
                <td className="px-5 py-2.5 text-right">
                  <span className={cx("rounded-full px-2 py-0.5 text-[11px]", a.source === "default" ? "bg-sunken text-ink-3" : "bg-brand-soft text-brand")}>{t(a.source)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="lg:col-span-7">
        <CardHeader title={t("Payment terms in your documents")} hint={t("Each line links to the clause")} />
        <ul className="divide-y divide-line">
          {paymentFacts.map((x) => (
            <li key={x.id} className="flex items-start gap-3 px-5 py-2.5 text-[14px]">
              <RefChip id={x.id} onOpen={open} />
              <span>{x.statement}</span>
            </li>
          ))}
          {!paymentFacts.length ? <li className="px-5 py-3 text-sm text-ink-3">{t("No payment facts were extracted.")}</li> : null}
        </ul>
      </Card>
    </div>
  );
}
