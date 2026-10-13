"use client";

import { Logo } from "./Logo";
import { MotionConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_RED_LINES, sanitizeRedLines, type RedLines } from "@/lib/playbook";
import { SAMPLE_DEAL, SAMPLE_FILES, SAMPLE_PDF_DEAL, SAMPLE_PDF_FILES } from "@/lib/sample";
import type { PrefillOutput } from "@/lib/schemas";
import type { Analysis, AgentId, ChatMessage, PipelineEvent } from "@/lib/types";
import { ChatPanel } from "./ChatPanel";
import { EvidenceProvider } from "./evidence";
import { LangProvider, useLang } from "./lang";
import type { NodeState } from "./PipelineScene";
import { ResultsView } from "./ResultsView";
import { RunView } from "./RunView";
import { EMPTY_FORM, formToDeal, SetupView, type DealForm, type PrefillState } from "./SetupView";
import { cx } from "./ui";

interface Health {
  mode: "demo" | "bedrock";
  model: string;
  region: string;
  choice?: string;
  choices?: string[]; // empty unless the server allows switching models (testing)
}

const MODEL_LABEL: Record<string, string> = { sonnet: "Claude Sonnet", haiku: "Claude Haiku", gemini: "Gemini (test)" };

const RED_LINES_KEY = "dealguard.redLines";

// A live model gets the six-PDF sample; demo mode keeps the piling sample its replay was built from.
const sampleDeal = (live: boolean) => (live ? SAMPLE_PDF_DEAL : SAMPLE_DEAL);

function sampleForm(live: boolean, redLines: RedLines): DealForm {
  const deal = sampleDeal(live);
  return {
    packageType: deal.packageType,
    contractValue: String(deal.contractValue),
    fundingCommitment: String(deal.fundingCommitment),
    advancePayment: deal.advancePayment ? String(deal.advancePayment) : "",
    durationWeeks: String(deal.durationWeeks),
    context: deal.context,
    standardForm: deal.standardForm,
    projectType: deal.projectType,
    stage: deal.stage,
    marginPct: String(deal.marginPct),
    monthlyOverhead: String(deal.monthlyOverhead),
    redLines,
  };
}

function fetchSampleFiles(live: boolean) {
  const [folder, names] = live ? ["sample-deal-pdf", SAMPLE_PDF_FILES] : ["sample-deal", SAMPLE_FILES];
  return Promise.all(
    names.map(async (name) => {
      const blob = await (await fetch(`/${folder}/${name}`)).blob();
      const type = name.endsWith(".pdf") ? "application/pdf" : name.endsWith(".csv") ? "text/csv" : "text/plain";
      return new File([blob], name, { type });
    }),
  );
}

async function serverIsLive() {
  try {
    const health = (await (await fetch("/api/health")).json()) as Health;
    return health.mode !== "demo";
  } catch {
    return false;
  }
}

// Red lines are a per-device preference; storage can be unavailable, so fall back quietly.
function loadRedLines(): RedLines {
  try {
    const raw = window.localStorage.getItem(RED_LINES_KEY);
    return raw ? sanitizeRedLines(JSON.parse(raw)) : DEFAULT_RED_LINES;
  } catch {
    return DEFAULT_RED_LINES;
  }
}

const fileKey = (list: File[]) => list.map((f) => `${f.name}:${f.size}`).join("|");

// Setup fields the first read of the documents can fill in, with the name shown to the user.
const PREFILL_FIELDS = {
  packageType: "trade",
  contractValue: "value",
  durationWeeks: "duration",
  advancePayment: "advance",
  standardForm: "contract form",
  projectType: "project type",
} as const;
type PrefillField = keyof typeof PREFILL_FIELDS;

export function DealGuardApp() {
  return (
    <LangProvider>
      <App />
    </LangProvider>
  );
}

function App() {
  const { lang, setLang, t } = useLang();
  const [phase, setPhase] = useState<"setup" | "running" | "results">("setup");
  const [form, setFormState] = useState<DealForm>(() => ({ ...EMPTY_FORM, redLines: loadRedLines() }));
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Partial<Record<AgentId, NodeState>>>({});
  const [details, setDetails] = useState<Partial<Record<AgentId, string>>>({});
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prefill, setPrefill] = useState<PrefillState>({ status: "idle" });
  // The prefill request finishes later, so it reads the latest form and language from refs.
  const formRef = useRef(form);
  const langRef = useRef(lang);
  const autoFilled = useRef<Partial<Record<PrefillField, string>>>({});
  const prefilledKey = useRef("");

  useEffect(() => {
    formRef.current = form;
    langRef.current = lang;
  }, [form, lang]);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  // Arriving from the landing page with ?sample=1 preloads the sample deal.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("sample") !== "1") return;
    let cancelled = false;
    serverIsLive().then(async (live) => {
      const loaded = await fetchSampleFiles(live);
      if (cancelled) return;
      setFormState((f) => sampleForm(live, f.redLines));
      setFiles(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A quick first read of newly added documents fills in the details they state.
  // It only touches fields the user hasn't typed in.
  useEffect(() => {
    const key = fileKey(files);
    if (!key || key === prefilledKey.current) return;
    const ctrl = new AbortController();
    let finished = false;
    const timer = setTimeout(async () => {
      prefilledKey.current = key;
      setPrefill({ status: "reading" });
      try {
        const body = new FormData();
        files.forEach((f) => body.append("files", f));
        body.append("lang", langRef.current);
        const res = await fetch("/api/prefill", { method: "POST", body, signal: ctrl.signal });
        if (!res.ok) throw new Error("prefill failed");
        const out = (await res.json()) as PrefillOutput;
        finished = true;
        if (out.relevant === false) {
          setPrefill({ status: "irrelevant", note: out.relevance_note });
          return;
        }
        const whole = (n: number | null) => (n ? String(Math.round(n)) : "");
        const read: Record<PrefillField, string> = {
          packageType: out.package_type ?? "",
          contractValue: whole(out.contract_sum_rm),
          durationWeeks: whole(out.completion_weeks),
          advancePayment: whole(out.advance_payment_rm),
          standardForm: out.standard_form ?? "",
          projectType: out.project_type ?? "",
        };
        const cur = formRef.current;
        const changes: Partial<Record<PrefillField, string>> = {};
        for (const k of Object.keys(read) as PrefillField[]) {
          const untouched = cur[k] === EMPTY_FORM[k] || cur[k] === autoFilled.current[k];
          if (read[k] && read[k] !== cur[k] && untouched) changes[k] = read[k];
        }
        autoFilled.current = { ...autoFilled.current, ...changes };
        setFormState((f) => ({ ...f, ...changes }) as DealForm);
        setPrefill({ status: "done", filled: (Object.keys(changes) as PrefillField[]).map((k) => PREFILL_FIELDS[k]), missing: out.missing_documents ?? [] });
      } catch {
        // Prefill is a convenience: if it fails the user simply types the details in.
        if (!ctrl.signal.aborted) {
          finished = true;
          setPrefill({ status: "idle" });
        }
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      if (!finished) {
        ctrl.abort();
        if (prefilledKey.current === key) prefilledKey.current = "";
      }
    };
  }, [files]);

  function setForm(next: DealForm) {
    if (next.redLines !== form.redLines) {
      try {
        window.localStorage.setItem(RED_LINES_KEY, JSON.stringify(next.redLines));
      } catch {
        // storage unavailable: the red lines still apply to this session
      }
    }
    setFormState(next);
  }

  async function loadSample() {
    setLoadingSample(true);
    try {
      const live = health ? health.mode !== "demo" : await serverIsLive();
      const loaded = await fetchSampleFiles(live);
      // The sample form is already filled in; the first read still runs to check for missing documents.
      setFormState(sampleForm(live, form.redLines));
      setFiles(loaded);
      setError(null);
    } finally {
      setLoadingSample(false);
    }
  }

  async function analyse() {
    setError(null);
    setStatus({});
    setDetails({});
    setMessages([]);
    setPhase("running");
    window.scrollTo({ top: 0 });

    const body = new FormData();
    const missingDocuments = prefill.status === "done" ? prefill.missing : undefined;
    body.append("deal", JSON.stringify({ ...formToDeal(form), lang, missingDocuments }));
    files.forEach((f) => body.append("files", f));

    try {
      const res = await fetch("/api/analyze", { method: "POST", body });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: `Request failed (${res.status}).` }));
        throw new Error(err.error);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result: Analysis | null = null;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as PipelineEvent;
          if (event.type === "agent") {
            setStatus((s) => ({ ...s, [event.agent]: event.status }));
            if (event.detail) setDetails((d) => ({ ...d, [event.agent]: event.detail }));
          } else if (event.type === "result") {
            result = event.analysis;
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
      if (!result) throw new Error(t("The analysis ended without a result. Please try again."));
      setAnalysis(result);
      setPhase("results");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Something went wrong."));
      setPhase("setup");
    }
  }

  const demo = health?.mode === "demo";

  // Testing switch: the server reads this cookie on every API call.
  function pickModel(choice: string) {
    document.cookie = `dg-model=${choice}; path=/; max-age=31536000; samesite=lax`;
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen">
        <header className="no-print sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <Logo />
              {analysis && phase === "setup" ? (
                <button onClick={() => setPhase("results")} className="text-[13px] font-medium text-brand hover:underline">
                  {t("Back to results")}
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <div role="group" aria-label={t("Language")} className="flex rounded-full border border-line bg-surface p-0.5 text-[12px]">
                {(["en", "ms"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    title={l === "en" ? "English" : "Bahasa Malaysia"}
                    className={cx("rounded-full px-2 py-0.5 font-medium transition-colors", lang === l ? "bg-ink text-[var(--bg)]" : "text-ink-3 hover:text-ink")}
                  >
                    {l === "en" ? "EN" : "BM"}
                  </button>
                ))}
              </div>
              {health ? (
                <span className="flex items-center gap-2 rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] text-ink-2">
                  <span className="size-1.5 rounded-full" style={{ background: demo || health.choice === "gemini" ? "var(--warning)" : "var(--good)" }} aria-hidden />
                  {demo ? (
                    t("Demo mode")
                  ) : health.choices?.length ? (
                    <select
                      aria-label={t("Model")}
                      title={`${health.model} · ${health.region}`}
                      value={health.choice}
                      onChange={(e) => pickModel(e.target.value)}
                      disabled={phase === "running"}
                      className="cursor-pointer bg-transparent font-medium text-ink outline-none disabled:cursor-not-allowed"
                    >
                      {health.choices.map((c) => (
                        <option key={c} value={c}>
                          {MODEL_LABEL[c] ?? c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    `Bedrock · ${health.model.replace(/^anthropic\./, "")} · ${health.region}`
                  )}
                </span>
              ) : null}
            </div>
          </div>
        </header>

        {phase === "setup" ? (
          <SetupView
            form={form}
            setForm={setForm}
            files={files}
            setFiles={setFiles}
            onSubmit={analyse}
            onLoadSample={loadSample}
            loadingSample={loadingSample}
            error={error}
            demo={demo}
            prefill={prefill}
          />
        ) : null}
        {phase === "running" ? <RunView status={status} details={details} demo={demo} /> : null}
        {phase === "results" && analysis ? (
          <EvidenceProvider analysis={analysis} files={files}>
            <ResultsView analysis={analysis} onAsk={() => setChatOpen(true)} onReset={() => setPhase("setup")} />
            <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} analysis={analysis} messages={messages} setMessages={setMessages} />
          </EvidenceProvider>
        ) : null}
      </div>
    </MotionConfig>
  );
}
