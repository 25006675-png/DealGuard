import { tr } from "./i18n";
import type { KeyTerms, Lang } from "./types";

// The subcontractor's own red lines, plus CIPAA 2012 benchmarks. Checked in code
// against the terms extracted at intake, so the result is repeatable.

export interface RedLines {
  maxPaymentDays: number; // payment due after certification
  maxCertDays: number;
  maxRetentionCapPct: number;
  maxLadCapPct: number; // LAD must be capped at or below this % of the sum
  maxBondPct: number;
  maxDlpMonths: number;
  noPayWhenPaid: boolean;
}

export const DEFAULT_RED_LINES: RedLines = {
  maxPaymentDays: 30,
  maxCertDays: 21,
  maxRetentionCapPct: 5,
  maxLadCapPct: 10,
  maxBondPct: 5,
  maxDlpMonths: 24,
  noPayWhenPaid: true,
};

export const RED_LINE_FIELDS: { key: Exclude<keyof RedLines, "noPayWhenPaid">; label: string; unit: string }[] = [
  { key: "maxPaymentDays", label: "Paid within", unit: "days of certification" },
  { key: "maxCertDays", label: "Certified within", unit: "days of claim" },
  { key: "maxRetentionCapPct", label: "Retention limit at most", unit: "% of sum" },
  { key: "maxLadCapPct", label: "LAD capped at most", unit: "% of sum" },
  { key: "maxBondPct", label: "Performance bond at most", unit: "% of sum" },
  { key: "maxDlpMonths", label: "Defects period at most", unit: "months" },
];

export interface PlaybookCheck {
  id: string;
  label: string;
  source: "Your red line" | "CIPAA 2012";
  rule: string;
  actual: string;
  status: "pass" | "breach" | "unknown";
  provisionId: string;
}

export function sanitizeRedLines(raw: unknown): RedLines {
  const r = (raw ?? {}) as Partial<Record<keyof RedLines, unknown>>;
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 10_000 ? v : d);
  return {
    maxPaymentDays: num(r.maxPaymentDays, DEFAULT_RED_LINES.maxPaymentDays),
    maxCertDays: num(r.maxCertDays, DEFAULT_RED_LINES.maxCertDays),
    maxRetentionCapPct: num(r.maxRetentionCapPct, DEFAULT_RED_LINES.maxRetentionCapPct),
    maxLadCapPct: num(r.maxLadCapPct, DEFAULT_RED_LINES.maxLadCapPct),
    maxBondPct: num(r.maxBondPct, DEFAULT_RED_LINES.maxBondPct),
    maxDlpMonths: num(r.maxDlpMonths, DEFAULT_RED_LINES.maxDlpMonths),
    noPayWhenPaid: typeof r.noPayWhenPaid === "boolean" ? r.noPayWhenPaid : DEFAULT_RED_LINES.noPayWhenPaid,
  };
}

export function checkPlaybook(terms: KeyTerms | null, red: RedLines, lang: Lang = "en"): PlaybookCheck[] {
  const L = (text: string, vars?: Record<string, string | number>) => tr(lang, text, vars);
  const atMost = (value: number | null, limit: number, unit: string) => {
    if (value == null) return { actual: L("Not stated"), status: "unknown" as const };
    return { actual: L(`{n}${unit}`, { n: value }), status: value <= limit ? ("pass" as const) : ("breach" as const) };
  };
  const t = terms ?? ({} as Partial<KeyTerms>);
  const v = (k: keyof KeyTerms) => (typeof t[k] === "number" ? (t[k] as number) : null);
  const checks: PlaybookCheck[] = [];
  const add = (c: Omit<PlaybookCheck, "actual" | "status">, r: { actual: string; status: PlaybookCheck["status"] }) => checks.push({ ...c, ...r });

  add({ id: "pay_days", label: L("Payment period"), source: "Your red line", rule: L("≤ {n} days after certification", { n: red.maxPaymentDays }), provisionId: "payment_period" }, atMost(v("payment_due_days"), red.maxPaymentDays, " days"));
  add({ id: "cert_days", label: L("Certification period"), source: "Your red line", rule: L("≤ {n} days", { n: red.maxCertDays }), provisionId: "interim_claims" }, atMost(v("certification_days"), red.maxCertDays, " days"));

  const retention = v("retention_pct");
  const retCap = v("retention_cap_pct");
  add(
    { id: "retention_cap", label: L("Retention limit"), source: "Your red line", rule: L("≤ {n}% of sum", { n: red.maxRetentionCapPct }), provisionId: "retention" },
    retention && retCap == null ? { actual: L("{n}% with no limit", { n: retention }), status: "breach" } : atMost(retCap, red.maxRetentionCapPct, "% of sum"),
  );

  const lad = v("lad_per_day_rm");
  const ladCap = v("lad_cap_pct");
  add(
    { id: "lad_cap", label: L("LAD cap"), source: "Your red line", rule: L("Capped at ≤ {n}% of sum", { n: red.maxLadCapPct }), provisionId: "lad" },
    lad == null ? { actual: L("No LAD rate found"), status: "unknown" } : ladCap == null ? { actual: L("RM {n}/day, uncapped", { n: lad.toLocaleString("en-MY") }), status: "breach" } : atMost(ladCap, red.maxLadCapPct, "% of sum"),
  );
  add({ id: "bond", label: L("Performance bond"), source: "Your red line", rule: L("≤ {n}% of sum", { n: red.maxBondPct }), provisionId: "bonds" }, atMost(v("performance_bond_pct"), red.maxBondPct, "% of sum"));
  add({ id: "dlp", label: L("Defects liability period"), source: "Your red line", rule: L("≤ {n} months", { n: red.maxDlpMonths }), provisionId: "defects" }, atMost(v("dlp_months"), red.maxDlpMonths, " months"));

  const pwp = t.pay_when_paid;
  const pwpResult = pwp == null ? { actual: L("Not stated"), status: "unknown" as const } : { actual: pwp ? L("Pay-when-paid present") : L("None found"), status: pwp ? ("breach" as const) : ("pass" as const) };
  if (red.noPayWhenPaid) add({ id: "pwp_red", label: L("Conditional payment"), source: "Your red line", rule: L("No pay-when-paid"), provisionId: "conditional_payment" }, pwpResult);
  add({ id: "pwp_cipaa", label: L("Conditional payment"), source: "CIPAA 2012", rule: L("s.35: conditional payment terms are void"), provisionId: "conditional_payment" }, pwpResult);

  // CIPAA s.36 default terms apply only where a contract is silent; used here as a fairness benchmark.
  const cert = v("certification_days");
  const due = v("payment_due_days");
  add(
    { id: "cipaa_due", label: L("Claim to payment"), source: "CIPAA 2012", rule: L("Default terms (s.36): paid within 30 days of claim"), provisionId: "payment_period" },
    cert == null && due == null ? { actual: L("Not stated"), status: "unknown" } : { actual: L("Up to {n} days", { n: (cert ?? 0) + (due ?? 0) }), status: (cert ?? 0) + (due ?? 0) <= 30 ? "pass" : "breach" },
  );
  const interval = v("claim_interval_days");
  add(
    { id: "cipaa_freq", label: L("Claim frequency"), source: "CIPAA 2012", rule: L("Default terms (s.36): monthly progress claims"), provisionId: "interim_claims" },
    interval == null ? { actual: L("Not stated"), status: "unknown" } : { actual: L("Every {n} days", { n: interval }), status: interval <= 31 ? "pass" : "breach" },
  );
  return checks;
}
