import { bedrockConfig, getClient } from "@/lib/bedrock";
import { analysisContext } from "@/lib/context";
import { demoReply } from "@/lib/demo";
import { friendlyError } from "@/lib/errors";
import { tr } from "@/lib/i18n";
import { ADVISOR_DECLINED, ADVISOR_SYSTEM } from "@/lib/prompts";
import type { Analysis, ChatMessage } from "@/lib/types";

export const maxDuration = 120;

const MAX_MESSAGE_CHARS = 4000;

export async function POST(req: Request) {
  const cfg = bedrockConfig();
  let body: { analysis?: Analysis; messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const analysis = body.analysis;
  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  if (!analysis?.check || !history.length || history[history.length - 1].role !== "user") {
    return Response.json({ error: "Run an analysis first, then ask a question." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const question = history[history.length - 1].content;
  const lang = analysis.deal?.lang === "ms" ? "ms" : "en";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (cfg.demo) {
          for (const chunk of demoReply(question, lang).match(/\S+\s*/g) ?? []) {
            controller.enqueue(encoder.encode(chunk));
            await new Promise((r) => setTimeout(r, 18));
          }
        } else {
          // History must start with a user turn.
          const firstUser = history.findIndex((m) => m.role === "user");
          const events = getClient().messages.stream({
            model: cfg.model,
            max_tokens: 8000,
            output_config: { effort: "medium" },
            system: [
              { type: "text", text: lang === "ms" ? `${ADVISOR_SYSTEM}\n- This analysis is written in Bahasa Malaysia. When the user writes in Malay, answer in plain Bahasa Malaysia with standard spelling and address them as "anda"; when they write in English, answer in English.` : ADVISOR_SYSTEM },
              { type: "text", text: analysisContext(analysis), cache_control: { type: "ephemeral" } },
            ],
            messages: history.slice(firstUser).map((m) => ({ role: m.role, content: m.content })),
          });
          let wrote = false;
          let declined = false;
          for await (const event of events) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              wrote = true;
              controller.enqueue(encoder.encode(event.delta.text));
            } else if (event.type === "message_delta" && event.delta.stop_reason === "refusal") {
              declined = true;
            }
          }
          if (declined) controller.enqueue(encoder.encode((wrote ? "\n\n" : "") + tr(lang, ADVISOR_DECLINED)));
        }
      } catch (err) {
        console.error("[dealguard] chat failed:", err);
        controller.enqueue(encoder.encode(`\n\n⚠ ${friendlyError(err)}`));
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
