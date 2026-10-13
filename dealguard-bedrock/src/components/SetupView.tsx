"use client";

import { ArrowRight, Check, FileImage, FileWarning, FileSpreadsheet, FileText, Loader2, Plus, ShieldCheck, SlidersHorizontal, Sparkles, TriangleAlert, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { rmCompact } from "@/lib/format";
import { computeFunding } from "@/lib/funding";
import { DEFAULT_RED_LINES, RED_LINE_FIELDS, type RedLines } from "@/lib/playbook";
import { STANDARD_FORMS, type DealInput, type DealStage, type ProjectType } from "@/lib/types";
import { useLang } from "./lang";
import { Button, cx, Sheet } from "./ui";

export interface DealForm {
  packageType: string;
  contractValue: string;
  fundingCommitment: string;
  advancePayment: string;
  durationWeeks: string;
  context: string;
  standardForm: string;
  projectType: ProjectType;
  stage: DealStage;
  marginPct: string;
  monthlyOverhead: string;
  redLines: RedLines;
}

export const EMPTY_FORM: DealForm = {
  packageType: "",
  contractValue: "",
  fundingCommitment: "",
  advancePayment: "",
  durationWeeks: "",
  context: "",
  standardForm: "Not sure",
  projectType: "unknown",
  stage: "loa",
  marginPct: "12",
  monthlyOverhead: "",
  redLines: DEFAULT_RED_LINES,
};

const num = (s: string) => Number(s.replace(/[^\d.]/g, "")) || 0;

export function formToDeal(f: DealForm): DealInput {
  return {
    packageType: f.packageType.trim(),
    contractValue: num(f.contractValue),
    fundingCommitment: num(f.fundingCommitment),
    advancePayment: num(f.advancePayment),
    durationWeeks: num(f.durationWeeks),
    context: f.context.trim(),
    standardForm: f.standardForm,
    projectType: f.projectType,
    stage: f.stage,
    marginPct: num(f.marginPct),
    monthlyOverhead: num(f.monthlyOverhead),
    redLines: f.redLines,
  };
}

const ACCEPT = ".pdf,.docx,.txt,.md,.csv,.json,.html,.png,.jpg,.jpeg,.webp";
const PACKAGE_SUGGESTIONS = ["Bored piling and empty bore works", "M&E services", "Aluminium facade and glazing", "Earthworks", "Structural steel", "Interior fit-out"];
const FORMS = ["Not sure", ...STANDARD_FORMS];

/** Where the automatic first read of the uploads has got to. */
export type PrefillState =
  | { status: "idle" }
  | { status: "reading" }
  | { status: "done"; filled: string[]; missing: { name: string; why: string }[] }
  | { status: "irrelevant"; note: string };
const STAGES: { id: DealStage; label: string }[] = [
  { id: "tender", label: "Quoting" },
  { id: "loa", label: "LOA received" },
  { id: "signed", label: "Signed" },
  { id: "in_progress", label: "Works started" },
];
const PROJECT_TYPES: { id: ProjectType; label: string }[] = [
  { id: "private", label: "Private" },
  { id: "government", label: "Government" },
  { id: "unknown", label: "Not sure" },
];

// Recognise the usual package documents from their file names. Only a hint for
// the user; the intake agent classifies documents properly from their content.
const SLOTS = [
  { id: "loa", label: "Letter of Award", match: /\bloa\b|letter.?of.?award|award/i },
  { id: "conditions", label: "Subcontract conditions", match: /condition|subcon|agreement|contract/i },
  { id: "bq", label: "BQ / pricing", match: /\bbq\b|boq|bill|quantit|pricing/i },
  { id: "programme", label: "Programme", match: /programme|program|schedule|gantt/i },
] as const;

function slotFor(name: string) {
  return SLOTS.find((s) => s.match.test(name.replace(/[_.-]/g, " ")))?.id ?? null;
}

function fileIcon(name: string) {
  const e = name.toLowerCase().split(".").pop();
  if (e === "csv") return FileSpreadsheet;
  if (["png", "jpg", "jpeg", "webp"].includes(e ?? "")) return FileImage;
  return FileText;
}

function formatSize(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

const field =
  "h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-[15px] outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand-soft";

function Affix({ before, after, value, onChange, placeholder, money, label }: { before?: string; after?: string; value: string; onChange: (v: string) => void; placeholder?: string; money?: boolean; label: string }) {
  const shown = money && value ? Number(value).toLocaleString("en-MY") : value;
  return (
    <div className="flex h-11 items-center rounded-lg border border-line-strong bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-soft">
      {before ? <span className="pl-3 pr-1.5 text-sm text-ink-3">{before}</span> : null}
      <input
        aria-label={label}
        inputMode="decimal"
        className={cx("h-full w-full min-w-0 rounded-lg bg-transparent text-[15px] tabular outline-none", before ? "pr-3" : "px-3")}
        value={shown}
        onChange={(e) => onChange(e.target.value.replace(money ? /[^\d]/g : /[^\d.]/g, ""))}
        placeholder={placeholder ?? "0"}
      />
      {after ? <span className="shrink-0 pr-3 text-sm text-ink-3">{after}</span> : null}
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid rounded-lg bg-sunken p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cx("relative h-9 whitespace-nowrap rounded-md px-1.5 text-[13px] font-medium transition-colors", value === o.id ? "text-ink" : "text-ink-3 hover:text-ink-2")}
        >
          {value === o.id ? <motion.span layoutId={`seg-${label}`} className="absolute inset-0 rounded-md bg-surface shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 40 }} /> : null}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** One flat settings-style row: label and hint on the left, control on the right. */
function Row({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="grid gap-x-8 gap-y-2 border-b border-line py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-start">
      <div className="sm:pt-2.5">
        <p className="text-[14px] font-medium">
          {label}
          {required ? <span style={{ color: "var(--critical-text)" }}> *</span> : null}
        </p>
        {hint ? <p className="mt-0.5 text-[12.5px] leading-snug text-ink-3">{hint}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function CashPreview({ deal }: { deal: DealInput }) {
  const { t } = useLang();
  const funding = useMemo(() => computeFunding(deal, null), [deal]);
  const s = funding.series;
  const W = 300;
  const H = 76;
  const lo = Math.min(...s.map((p) => p.net), -deal.fundingCommitment, -1);
  const hi = Math.max(...s.map((p) => p.net), 0);
  const x = (w: number) => (w / s[s.length - 1].week) * W;
  const y = (v: number) => 4 + ((hi - v) / (hi - lo || 1)) * (H - 8);
  const line = s.map((p, i) => `${i ? "L" : "M"}${x(p.week).toFixed(1)} ${y(p.net).toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${y(0)} L0 ${y(0)} Z`;
  const short = funding.peakNeed - deal.fundingCommitment;

  return (
    <div>
      <p className="text-[12.5px] text-ink-3">{t("Peak cash need")}</p>
      <motion.p key={Math.round(funding.peakNeed / 10000)} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-0.5 text-[30px] font-semibold tracking-tight">
        {rmCompact(funding.peakNeed)}
      </motion.p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" aria-hidden>
        <path d={area} fill="var(--critical)" opacity={0.08} />
        <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" />
        {deal.fundingCommitment ? <line x1={0} x2={W} y1={y(-deal.fundingCommitment)} y2={y(-deal.fundingCommitment)} stroke="var(--ink-3)" strokeDasharray="3 4" /> : null}
        <path d={line} fill="none" stroke="var(--critical)" strokeWidth={2} strokeLinejoin="round" />
      </svg>
      {deal.fundingCommitment ? (
        <p className="mt-2 text-[13px]" style={{ color: short > 0 ? "var(--critical-text)" : "var(--good-text)" }}>
          {short > 0 ? t("{short} more than the {have} you have", { short: rmCompact(short), have: rmCompact(deal.fundingCommitment) }) : t("Covered by your {have}", { have: rmCompact(deal.fundingCommitment) })}
        </p>
      ) : (
        <p className="mt-2 text-[13px] text-ink-3">{t("Add your funding to see the shortfall.")}</p>
      )}
      <p className="mt-2 text-[11.5px] leading-snug text-ink-3">{t("Estimate on typical terms (monthly claims, 21-day certification, 30-day payment). The review replaces these with your contract's actual terms.")}</p>
    </div>
  );
}

export function SetupView({
  form,
  setForm,
  files,
  setFiles,
  onSubmit,
  onLoadSample,
  loadingSample,
  error,
  demo,
  prefill,
}: {
  form: DealForm;
  setForm: (f: DealForm) => void;
  files: File[];
  setFiles: (f: File[]) => void;
  onSubmit: () => void;
  onLoadSample: () => void;
  loadingSample: boolean;
  error: string | null;
  demo: boolean;
  prefill: PrefillState;
}) {
  const { t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [redLinesOpen, setRedLinesOpen] = useState(false);
  const set = <K extends keyof DealForm>(k: K) => (v: DealForm[K]) => setForm({ ...form, [k]: v });
  const setRed = (k: keyof RedLines, v: number | boolean) => setForm({ ...form, redLines: { ...form.redLines, [k]: v } });

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    setFiles(next);
  }

  const deal = useMemo(() => formToDeal(form), [form]);
  // Wrong documents stop the review; missing ones need the user's go-ahead (tied to this read of the files).
  const [acceptedFor, setAcceptedFor] = useState<PrefillState | null>(null);
  const missing = files.length && prefill.status === "done" ? prefill.missing : [];
  const awaitingAnswer = missing.length > 0 && acceptedFor !== prefill;
  const checking = files.length > 0 && prefill.status === "reading";
  const wrongDocs = files.length > 0 && prefill.status === "irrelevant";
  const ready = deal.contractValue > 0 && (demo || files.length > 0) && !checking && !wrongDocs && !awaitingAnswer;
  const customRedLines = JSON.stringify(form.redLines) !== JSON.stringify(DEFAULT_RED_LINES);
  const filled = new Map(files.map((f) => [slotFor(f.name), f] as const));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight sm:text-[36px]">{t("What are you being asked to sign?")}</h1>
          <p className="mt-2 max-w-2xl text-[16px] text-ink-2">{t("Drop in what the main contractor sent you. We read the terms; you tell us the few things a contract can't.")}</p>
        </div>
        <div className="flex items-center gap-2">
          {demo ? (
            <span className="rounded-full bg-brand-soft px-3 py-1.5 text-[12.5px] font-medium text-brand" title={t("Connect Amazon Bedrock (BEDROCK_SETUP.md) to analyse your own documents")}>
              {t("Demo mode: replays the sample review")}
            </span>
          ) : null}
          <Button type="button" variant="ghost" onClick={onLoadSample} disabled={loadingSample}>
            {loadingSample ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Sparkles size={16} aria-hidden />}
            {t("Load sample deal")}
          </Button>
        </div>
      </div>

      <form
        className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onSubmit();
        }}
      >
        <div className="min-w-0">
          {/* Documents: the main act */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => input.current?.click()}
            className={cx(
              "paper group flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
              dragging ? "border-brand bg-brand-soft" : "border-line-strong hover:border-brand",
            )}
          >
            <span className="grid size-12 place-items-center rounded-xl bg-surface text-brand shadow-sm transition-transform group-hover:-translate-y-0.5">
              <Upload size={22} aria-hidden />
            </span>
            <p className="mt-4 text-[18px] font-semibold">{t("Drop your Letter of Award, subcontract and BQ")}</p>
            <p className="mt-1 text-[13.5px] text-ink-3">
              {t("or")} <span className="font-medium text-brand">{t("browse files")}</span> {t("· PDF, Word, CSV, text or photos · up to 14 MB")}
            </p>
            <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {SLOTS.map((s) => {
              const f = filled.get(s.id);
              return f ? (
                <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-2 pr-3 text-[13px]">
                  <Check size={14} style={{ color: "var(--good)" }} aria-hidden /> {t(s.label)}
                </span>
              ) : (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => input.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong py-1 pl-2 pr-3 text-[13px] text-ink-3 hover:border-brand hover:text-brand"
                >
                  <Plus size={14} aria-hidden /> {t(s.label)}
                  {s.id === "programme" ? <span className="text-ink-3">{t("(optional)")}</span> : null}
                </button>
              );
            })}
          </div>

          {files.length ? (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {files.map((f) => {
                const Icon = fileIcon(f.name);
                return (
                  <li key={f.name + f.size} className="flex items-center gap-3 py-2 text-[14px]">
                    <Icon size={16} className="shrink-0 text-ink-3" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="text-[12px] text-ink-3">{t(SLOTS.find((s) => s.id === slotFor(f.name))?.label ?? "Other")}</span>
                    <span className="w-14 text-right text-[12px] tabular text-ink-3">{formatSize(f.size)}</span>
                    <button type="button" onClick={() => setFiles(files.filter((x) => x !== f))} className="rounded p-1 text-ink-3 hover:bg-sunken hover:text-ink" aria-label={`Remove ${f.name}`}>
                      <X size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {files.length && prefill.status === "reading" ? (
            <p className="mt-3 flex items-center gap-2 text-[13px] text-ink-3" aria-live="polite">
              <Loader2 size={14} className="animate-spin" aria-hidden /> {t("Reading your documents to fill in the details…")}
            </p>
          ) : null}
          {files.length && prefill.status === "done" && prefill.filled.length ? (
            <p className="mt-3 flex items-start gap-2 text-[13px] text-ink-2" aria-live="polite">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden />
              {t("Filled in from your documents: {fields}. Check them before you continue.", { fields: prefill.filled.map((f) => t(f)).join(", ") })}
            </p>
          ) : null}
          {files.length && prefill.status === "irrelevant" ? (
            <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-[13.5px]" style={{ background: "var(--warning-soft)", color: "var(--warning-text)" }}>
              <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                {t("These don't look like construction subcontract documents.")} {prefill.note} {t("Upload a Letter of Award, subcontract conditions, BQ or quotation and try again.")}
              </span>
            </p>
          ) : null}
          {missing.length ? (
            <div className="mt-3 rounded-lg px-3 py-2.5 text-[13.5px]" style={{ background: "var(--warning-soft)", color: "var(--warning-text)" }} aria-live="polite">
              <p className="flex items-start gap-2">
                <FileWarning size={15} className="mt-0.5 shrink-0" aria-hidden />
                <span>
                  <span className="font-medium">{t("Not provided:")}</span> {t("the result may not be fully accurate without them.")}
                </span>
              </p>
              <ul className="mt-1.5 space-y-1 pl-6">
                {missing.map((m) => (
                  <li key={m.name}>
                    <span className="font-medium">{m.name}</span> · {m.why}
                  </li>
                ))}
              </ul>
              {awaitingAnswer ? (
                <div className="mt-2.5 flex flex-wrap gap-2 pl-6">
                  <Button type="button" size="sm" onClick={() => input.current?.click()}>
                    <Plus size={14} aria-hidden /> {t("Add files")}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setAcceptedFor(prefill)}>
                    {t("Continue without them")}
                  </Button>
                </div>
              ) : (
                <p className="mt-2 pl-6">{t("Continuing without them. The result will say what was missing.")}</p>
              )}
            </div>
          ) : null}

          {/* What the documents can't tell us */}
          <h2 className="mt-12 text-[18px] font-semibold tracking-tight">{t("A few things the documents can't tell us")}</h2>
          <div className="mt-2 border-t border-line">
            <Row label={t("Deal stage")}>
              <Segmented label="stage" value={form.stage} options={STAGES.map((o) => ({ ...o, label: t(o.label) }))} onChange={set("stage")} />
            </Row>
            <Row label={t("Trade and package")}>
              <input list="package-types" className={field} value={form.packageType} onChange={(e) => set("packageType")(e.target.value)} placeholder={t("e.g. Bored piling and empty bore works")} aria-label={t("Trade and package")} />
              <datalist id="package-types">
                {PACKAGE_SUGGESTIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </Row>
            <Row label={t("Subcontract value")} required>
              <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
                <Affix label="Subcontract value" before="RM" money value={form.contractValue} onChange={set("contractValue")} />
                <Affix label="Duration" after={t("weeks")} value={form.durationWeeks} onChange={set("durationWeeks")} placeholder="16" />
              </div>
            </Row>
            <Row label={t("Contract form")} hint={t("If you know it")}>
              <select className={field} value={form.standardForm} onChange={(e) => set("standardForm")(e.target.value)} aria-label="Standard form">
                {FORMS.map((f) => (
                  <option key={f} value={f}>
                    {t(f)}
                  </option>
                ))}
              </select>
            </Row>
            <Row label={t("Project type")}>
              <Segmented label="project" value={form.projectType} options={PROJECT_TYPES.map((o) => ({ ...o, label: t(o.label) }))} onChange={set("projectType")} />
            </Row>
            <Row label={t("Your money")} hint={t("Cash and facilities you can put in, and any advance offered")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Affix label="Funding available" before="RM" money value={form.fundingCommitment} onChange={set("fundingCommitment")} />
                <Affix label="Advance offered" before="RM" after={t("advance")} money value={form.advancePayment} onChange={set("advancePayment")} />
              </div>
            </Row>
            <Row label={t("Margin and overhead")} hint={t("Drives the cash-flow stress test")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Affix label="Expected margin" after={t("% margin")} value={form.marginPct} onChange={set("marginPct")} placeholder="12" />
                <Affix label="Monthly overhead" before="RM" after={t("/ month")} money value={form.monthlyOverhead} onChange={set("monthlyOverhead")} />
              </div>
            </Row>
            <Row label={t("Anything else")} hint={t("Deadlines, worries, what you know about the main contractor")}>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-[15px] leading-relaxed outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
                value={form.context}
                onChange={(e) => set("context")(e.target.value)}
                placeholder={t("e.g. They want the LOA signed in 3 days. We haven't seen the main contract.")}
                aria-label="Deal context"
              />
            </Row>
          </div>
        </div>

        {/* Live deal ticket */}
        <aside className="lg:sticky lg:top-20">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_20px_50px_-30px_rgba(20,23,28,0.35)]">
            <div className="px-5 pb-4 pt-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-3">{t("Deal summary")}</p>
              <p className="mt-2 text-[17px] font-semibold leading-snug">{deal.packageType || t("Untitled package")}</p>
              <p className="mt-0.5 text-[13.5px] tabular text-ink-2">
                {deal.contractValue ? `RM ${deal.contractValue.toLocaleString("en-MY")}` : t("Value not set")}
                {deal.durationWeeks ? ` · ${t("{n} weeks", { n: deal.durationWeeks })}` : ""} · {t(STAGES.find((s) => s.id === form.stage)?.label ?? "")}
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px]">
                {SLOTS.map((s) => (
                  <li key={s.id} className={cx("flex items-center gap-1.5", filled.has(s.id) ? "text-ink" : "text-ink-3")}>
                    {filled.has(s.id) ? <Check size={13} style={{ color: "var(--good)" }} aria-label="Added" /> : <span className="mx-[3px] size-[7px] rounded-full border border-line-strong" aria-label="Not added" />}
                    {t(s.label)}
                  </li>
                ))}
              </ul>
            </div>

            {/* perforation */}
            <div className="relative h-5" aria-hidden>
              <span className="absolute -left-2.5 top-0 size-5 rounded-full border border-line bg-[var(--bg)]" />
              <span className="absolute -right-2.5 top-0 size-5 rounded-full border border-line bg-[var(--bg)]" />
              <span className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-line" />
            </div>

            <div className="px-5 pb-5 pt-3">
              {deal.contractValue ? <CashPreview deal={deal} /> : <p className="py-6 text-center text-[13px] text-ink-3">{t("Enter the subcontract value to preview your cash position.")}</p>}

              {error ? (
                <p role="alert" className="mt-4 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--critical-soft)", color: "var(--critical-text)" }}>
                  {error}
                </p>
              ) : null}
              <Button type="submit" variant="primary" className="mt-5 h-12 w-full text-[15px]" disabled={!ready}>
                {t("Review this deal")} <ArrowRight size={16} aria-hidden />
              </Button>
              <p className="mt-2 text-center text-[12px] text-ink-3">
                {ready
                  ? t("8 agents · about 1 minute · Claude on Amazon Bedrock")
                  : wrongDocs
                    ? t("Upload construction deal documents to continue")
                    : checking
                      ? t("Checking your documents…")
                      : awaitingAnswer
                        ? t("Add the missing documents or continue without them")
                        : t("Add the subcontract value and at least one document")}
              </p>
              <button type="button" onClick={() => setRedLinesOpen(true)} className="mt-4 flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-[13px] hover:bg-surface-2">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-ink-3" aria-hidden />
                  {t("Your red lines")}
                </span>
                <span className="text-ink-3">
                  {customRedLines ? t("Custom") : t("Defaults")} · {t("Edit")}
                </span>
              </button>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-2 px-1 text-[12px] leading-relaxed text-ink-3">
            <ShieldCheck size={14} className="mt-px shrink-0" aria-hidden />
            {t("Commercial guidance only, not legal advice. Documents go to Claude on Amazon Bedrock and aren't stored by DealGuard.")}
          </p>
        </aside>
      </form>

      <Sheet open={redLinesOpen} onClose={() => setRedLinesOpen(false)} width={460} title={t("Your red lines")}>
        <div className="space-y-5 p-5">
          <p className="text-[14px] leading-relaxed text-ink-2">{t("Every deal is checked against these and against CIPAA 2012. They're saved on this device.")}</p>
          {RED_LINE_FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-[13.5px] font-medium">{t(f.label)}</span>
              <div className="mt-1.5">
                <Affix label={f.label} after={t(f.unit)} value={String(form.redLines[f.key])} onChange={(v) => setRed(f.key, Number(v) || 0)} />
              </div>
            </label>
          ))}
          <label className="flex items-center gap-3">
            <input type="checkbox" className="size-4 accent-[var(--brand)]" checked={form.redLines.noPayWhenPaid} onChange={(e) => setRed("noPayWhenPaid", e.target.checked)} />
            <span className="text-[14px]">{t("Never accept pay-when-paid")}</span>
          </label>
          <div className="flex items-center justify-between border-t border-line pt-4">
            <button type="button" onClick={() => set("redLines")(DEFAULT_RED_LINES)} className="text-[13px] font-medium text-brand hover:underline">
              {t("Reset to defaults")}
            </button>
            <Button type="button" variant="primary" size="sm" onClick={() => setRedLinesOpen(false)}>
              {t("Done")}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
