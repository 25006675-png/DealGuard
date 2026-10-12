import type Anthropic from "@anthropic-ai/sdk";
import { bedrockConfig, callTool, emptyUsage } from "@/lib/bedrock";
import { documentBlocks, MAX_FILES, MAX_TOTAL_BYTES, prepareFiles, UnsupportedFileError, type PreparedDoc } from "@/lib/documents";
import { friendlyError } from "@/lib/errors";
import { toLang } from "@/lib/i18n";
import { languageRule, PREFILL_SYSTEM, PREFILL_TASK } from "@/lib/prompts";
import { SAMPLE_DEAL } from "@/lib/sample";
import { prefillSchema, toInputSchema, type PrefillOutput } from "@/lib/schemas";

export const maxDuration = 60;

const PREFILL_TOOL: Anthropic.Tool = {
  name: "record_deal_basics",
  description: "Record whether the uploads are a construction deal package and the basic deal details they state.",
  input_schema: toInputSchema(prefillSchema),
};

const bad = (message: string) => Response.json({ error: message }, { status: 400 });

// POST files → the basic deal details read from them, so the setup form can fill itself in.
export async function POST(req: Request) {
  const cfg = bedrockConfig();
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return bad("No documents to read.");

  if (cfg.demo) {
    await new Promise((r) => setTimeout(r, 700));
    const sample: PrefillOutput = {
      relevant: true,
      relevance_note: "",
      package_type: SAMPLE_DEAL.packageType,
      contract_sum_rm: SAMPLE_DEAL.contractValue,
      completion_weeks: SAMPLE_DEAL.durationWeeks,
      advance_payment_rm: null,
      standard_form: "Bespoke (main contractor's own conditions)",
      project_type: "private",
    };
    return Response.json(sample);
  }

  if (files.length > MAX_FILES) return bad(`Upload at most ${MAX_FILES} files.`);
  if (files.reduce((s, f) => s + f.size, 0) > MAX_TOTAL_BYTES) return bad("Files are larger than 14 MB in total.");
  let docs: PreparedDoc[];
  try {
    docs = await prepareFiles(files);
  } catch (err) {
    if (err instanceof UnsupportedFileError) return bad(err.message);
    throw err;
  }

  try {
    const out = await callTool({
      label: "Document prefill",
      system: [{ type: "text", text: PREFILL_SYSTEM }],
      messages: [
        {
          role: "user",
          content: [...documentBlocks(docs, { citations: false }), { type: "text", text: PREFILL_TASK + languageRule(toLang(form.get("lang"))) }],
        },
      ],
      tools: [PREFILL_TOOL],
      toolName: PREFILL_TOOL.name,
      schema: prefillSchema,
      effort: "low",
      maxTokens: 2000,
      usage: emptyUsage(),
    });
    const amount = (v: number | null) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
    const result: PrefillOutput = {
      ...out,
      package_type: out.package_type?.trim().slice(0, 300) || null,
      contract_sum_rm: amount(out.contract_sum_rm),
      completion_weeks: amount(out.completion_weeks),
      advance_payment_rm: amount(out.advance_payment_rm),
    };
    return Response.json(result);
  } catch (err) {
    console.error("[dealguard] prefill failed:", err);
    return Response.json({ error: friendlyError(err) }, { status: 502 });
  }
}
