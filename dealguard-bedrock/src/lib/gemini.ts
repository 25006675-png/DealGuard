import type Anthropic from "@anthropic-ai/sdk";

// Gemini stand-in for the Bedrock client (LLM_PROVIDER=gemini), for testing
// when Bedrock credit is short. It translates Anthropic Messages requests to
// Gemini generateContent and back. Claude-only features are dropped: citations
// (so ledger quotes come back unverified) and prompt caching.
// GEMINI_API_KEY, GEMINI_API_KEY_2 and GEMINI_API_KEY_3 are tried in turn on rate limits.

const API = "https://generativelanguage.googleapis.com/v1beta/models";

type Part = { text: string } | { inlineData: { mimeType: string; data: string } } | { functionCall: { name: string; args: unknown } };
type GeminiResponse = {
  candidates?: { content?: { parts?: (Part & { thought?: boolean })[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number; cachedContentTokenCount?: number };
};

function keys() {
  return [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3]
    .map((k) => k?.trim())
    .filter((k): k is string => !!k);
}

function toParts(content: Anthropic.MessageParam["content"]): Part[] {
  if (typeof content === "string") return [{ text: content }];
  let docIndex = 0;
  return content.flatMap((b): Part[] => {
    switch (b.type) {
      case "text":
        return [{ text: b.text }];
      case "image":
        return b.source.type === "base64" ? [{ inlineData: { mimeType: b.source.media_type, data: b.source.data } }] : [];
      case "document": {
        const i = docIndex++;
        if (b.source.type === "base64") return [{ text: `Document ${i + 1}: ${b.title ?? ""}` }, { inlineData: { mimeType: b.source.media_type, data: b.source.data } }];
        if (b.source.type === "text") return [{ text: `<document index="${i + 1}" title="${b.title ?? ""}">\n${b.source.data}\n</document>` }];
        return [];
      }
      // Earlier tool calls and their results are replayed as plain text, which
      // avoids Gemini's thought-signature checks on replayed function calls.
      case "tool_use":
        return [{ text: `(Called ${b.name} with: ${JSON.stringify(b.input)})` }];
      case "tool_result":
        return [{ text: typeof b.content === "string" ? b.content : JSON.stringify(b.content) }];
      default:
        return [];
    }
  });
}

function toRequest(p: Anthropic.MessageCreateParams) {
  const system = typeof p.system === "string" ? p.system : p.system?.map((b) => b.text).join("\n\n");
  const effort = (p as { output_config?: { effort?: string } }).output_config?.effort;
  return {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents: p.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: toParts(m.content) })),
    ...(p.tools?.length
      ? {
          tools: [
            {
              functionDeclarations: (p.tools as Anthropic.Tool[]).map((t) => ({
                name: t.name,
                description: t.description,
                parametersJsonSchema: t.input_schema,
              })),
            },
          ],
          // Every caller with tools wants a tool call, so require one.
          toolConfig: { functionCallingConfig: { mode: "ANY" } },
        }
      : {}),
    generationConfig: {
      maxOutputTokens: Math.min(p.max_tokens, 65536),
      ...(effort ? { thinkingConfig: { thinkingLevel: effort } } : {}),
    },
  };
}

function toMessage(model: string, r: GeminiResponse): Anthropic.Message {
  const cand = r.candidates?.[0];
  const parts = (cand?.content?.parts ?? []).filter((p) => !p.thought);
  const content = parts.flatMap((p): Anthropic.ContentBlock[] => {
    if ("functionCall" in p) return [{ type: "tool_use", id: `toolu_${crypto.randomUUID()}`, name: p.functionCall.name, input: p.functionCall.args ?? {} } as Anthropic.ToolUseBlock];
    if ("text" in p && p.text) return [{ type: "text", text: p.text, citations: null } as Anthropic.TextBlock];
    return [];
  });
  const blocked = r.promptFeedback?.blockReason || ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"].includes(cand?.finishReason ?? "");
  const stop_reason: Anthropic.StopReason = blocked
    ? "refusal"
    : content.some((b) => b.type === "tool_use")
      ? "tool_use"
      : cand?.finishReason === "MAX_TOKENS"
        ? "max_tokens"
        : "end_turn";
  const u = r.usageMetadata ?? {};
  return {
    id: `msg_${crypto.randomUUID()}`,
    type: "message",
    role: "assistant",
    model,
    content,
    stop_reason,
    stop_sequence: null,
    usage: {
      input_tokens: (u.promptTokenCount ?? 0) - (u.cachedContentTokenCount ?? 0),
      output_tokens: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
      cache_read_input_tokens: u.cachedContentTokenCount ?? 0,
      cache_creation_input_tokens: 0,
    },
  } as Anthropic.Message;
}

async function generate(model: string, p: Anthropic.MessageCreateParams): Promise<Anthropic.Message> {
  const all = keys();
  if (!all.length) throw new Error("GEMINI_API_KEY is not set.");
  const body = JSON.stringify(toRequest(p));
  let last = "";
  // Up to 6 tries, moving to the next key on each rate limit or server error.
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${API}/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": all[attempt % all.length] },
      body,
    });
    if (res.ok) return toMessage(model, (await res.json()) as GeminiResponse);
    last = `Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`;
    if (res.status !== 429 && res.status < 500) break;
    await new Promise((r) => setTimeout(r, 1000 * 2 ** Math.floor(attempt / all.length)));
  }
  throw new Error(last);
}

/** A stream that delivers the whole reply at once: enough for finalMessage() and text-delta readers. */
function fakeStream(done: Promise<Anthropic.Message>) {
  return {
    finalMessage: () => done,
    async *[Symbol.asyncIterator]() {
      const msg = await done;
      for (const b of msg.content) {
        if (b.type === "text") yield { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: b.text } };
      }
      yield { type: "message_delta", delta: { stop_reason: msg.stop_reason, stop_sequence: null }, usage: msg.usage };
    },
  };
}

export function geminiClient(model: string) {
  return {
    messages: {
      create: (p: Anthropic.MessageCreateParams) => generate(model, p),
      stream: (p: Anthropic.MessageCreateParams) => fakeStream(generate(model, p)),
    },
  };
}
