import { tr } from "./i18n";
import type { DealInput, FundingExposure, FundingPoint, KeyTerms } from "./types";

// Planning assumptions used when the documents are silent. Shown in the UI.
const DEFAULT_MARGIN_PCT = 12;
const DEFAULTS = {
  claim_interval_days: 30,
  certification_days: 21,
  payment_due_days: 30,
  retention_pct: 10,
  retention_cap_pct: 5,
  completion_weeks: 16,
};
const LATE_DAYS = 30;

// DHSS expenditure curve: y = x + Cx² − Cx − (6x³ − 9x² + 3x)/K (Hudson 1978, as quoted in Skitmore 1992).
// Hudson's constants by contract value aren't openly published; C = 0, K = 3 is a mid-range, symmetric shape.
const DHSS_C = 0;
const DHSS_K = 3;
const dhss = (x: number) => x + DHSS_C * x * x - DHSS_C * x - (6 * x ** 3 - 9 * x ** 2 + 3 * x) / DHSS_K;

const rm = (n: number) => `RM ${Math.round(n).toLocaleString("en-MY")}`;

/**
 * Week-by-week cash position for the subcontractor: spend follows the DHSS S-curve over
 * the duration, progress claims are paid after certification and payment periods,
 * less retention (up to its limit) and pro-rata advance recovery.
 */
export function computeFunding(deal: DealInput, terms: KeyTerms | null): FundingExposure {
  const t = terms ?? ({} as Partial<KeyTerms>);
  const assumptions: FundingExposure["assumptions"] = [];
  const L = (text: string, vars?: Record<string, string | number>) => tr(deal.lang ?? "en", text, vars);
  const pick = (key: keyof typeof DEFAULTS, label: string, unit: string, basis?: string) => {
    const fromDocs = t[key];
    const value = typeof fromDocs === "number" && fromDocs > 0 ? fromDocs : DEFAULTS[key];
    assumptions.push({
      label: L(label),
      value: L(`{n}${unit}`, { n: value }),
      source: fromDocs ? "documents" : "default",
      ...(!fromDocs && basis ? { basis: L(basis) } : {}),
    });
    return value;
  };

  const value = deal.contractValue > 0 ? deal.contractValue : (t.contract_sum_rm ?? 0);
  assumptions.push({
    label: L("Subcontract value"),
    value: rm(value),
    source: deal.contractValue > 0 ? "deal input" : t.contract_sum_rm ? "documents" : "default",
  });
  let weeks: number;
  if (deal.durationWeeks > 0) {
    weeks = Math.round(deal.durationWeeks);
    assumptions.push({ label: L("Duration"), value: L("{n} weeks", { n: weeks }), source: "deal input" });
  } else {
    weeks = pick("completion_weeks", "Duration", " weeks");
  }
  assumptions.push({ label: L("Spend curve"), value: "DHSS", source: "default", basis: L("Hudson (1978); shape constants assumed") });
  const claimEvery = Math.max(1, Math.round(pick("claim_interval_days", "Claim interval", " days", "CIPAA 2012 s36(3): monthly") / 7));
  const payLag = Math.round(
    (pick("certification_days", "Certification period", " days") + pick("payment_due_days", "Payment period after certification", " days")) / 7,
  );
  const retentionPct = pick("retention_pct", "Retention", "%") / 100;
  const retentionCap = (pick("retention_cap_pct", "Retention limit", "% of sum") / 100) * value;
  const advance = Math.max(0, deal.advancePayment);
  assumptions.push({ label: L("Advance payment"), value: rm(advance), source: "deal input" });
  const marginOk = deal.marginPct > 0 && deal.marginPct < 60;
  const costRatio = 1 - (marginOk ? deal.marginPct : DEFAULT_MARGIN_PCT) / 100;
  assumptions.push({ label: L("Margin"), value: `${marginOk ? deal.marginPct : DEFAULT_MARGIN_PCT}%`, source: marginOk ? "deal input" : "default" });
  const weeklyOverhead = Math.max(0, deal.monthlyOverhead) * (12 / 52);
  if (weeklyOverhead) assumptions.push({ label: L("Fixed overhead"), value: L("{n}/month", { n: rm(deal.monthlyOverhead) }), source: "deal input" });

  // DHSS S-curve (Hudson 1978): cumulative share of value at time fraction x.
  const earned = Array.from({ length: weeks }, (_, w) => (dhss((w + 1) / weeks) - dhss(w / weeks)) * value);

  // Progress claims at each interval and at completion
  const claims: { week: number; gross: number }[] = [];
  let sinceLast = 0;
  for (let w = 0; w < weeks; w++) {
    sinceLast += earned[w];
    if ((w + 1) % claimEvery === 0 || w === weeks - 1) {
      claims.push({ week: w + 1, gross: sinceLast });
      sinceLast = 0;
    }
  }

  let retentionHeld = 0;
  const payments = claims.map((c) => {
    const retention = Math.min(c.gross * retentionPct, Math.max(0, retentionCap - retentionHeld));
    retentionHeld += retention;
    const recovery = value > 0 ? (c.gross / value) * advance : 0;
    return { week: c.week + payLag, amount: c.gross - retention - recovery };
  });

  const lateLag = Math.round(LATE_DAYS / 7);
  const horizon = weeks + payLag + lateLag + 1;
  const series: FundingPoint[] = [];
  let cost = 0;
  let worst = 0;
  let worstLate = 0;
  let peakWeek = 0;
  for (let w = 0; w <= horizon; w++) {
    if (w > 0 && w <= weeks) cost += earned[w - 1] * costRatio + weeklyOverhead;
    const received = advance + payments.filter((p) => p.week <= w).reduce((s, p) => s + p.amount, 0);
    const receivedLate = advance + payments.filter((p) => p.week + lateLag <= w).reduce((s, p) => s + p.amount, 0);
    const net = received - cost;
    const netLate = receivedLate - cost;
    if (net < worst) {
      worst = net;
      peakWeek = w;
    }
    worstLate = Math.min(worstLate, netLate);
    series.push({ week: w, cost, received, net, netLate });
  }

  const peakNeed = -worst;
  const peakNeedLate = -worstLate;
  const lad = t.lad_per_day_rm ?? null;
  const ladCap = t.lad_cap_pct ? (t.lad_cap_pct / 100) * value : Infinity;
  return {
    assumptions,
    series,
    peakNeed,
    peakWeek,
    peakNeedLate,
    gap: Math.max(0, peakNeed - deal.fundingCommitment),
    gapLate: Math.max(0, peakNeedLate - deal.fundingCommitment),
    retentionHeld,
    ladFourWeeks: lad ? Math.min(lad * 28, ladCap) : null,
  };
}
