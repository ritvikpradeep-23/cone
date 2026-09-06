import Anthropic from "@anthropic-ai/sdk";
import { buildGenerationPrompt, type RecentDesign } from "./prompt";
import { EMIT_DESIGN_TOOL, generatedDesignSchema, type GeneratedDesign } from "./generation-schema";
import { findSafetyViolation } from "./safety-net";

const MODEL = process.env.GENERATION_MODEL || "claude-sonnet-5";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export type GenerationResult =
  | { ok: true; design: GeneratedDesign }
  | { ok: false; reason: string };

async function callOnce(recent: RecentDesign[]): Promise<GenerationResult> {
  const prompt = buildGenerationPrompt(recent);

  let response;
  try {
    response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 8000,
      tools: [EMIT_DESIGN_TOOL],
      tool_choice: { type: "tool", name: "emit_design" },
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err) {
    return { ok: false, reason: `Anthropic API call failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return { ok: false, reason: "model did not return a tool_use block" };
  }

  const parsed = generatedDesignSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    return { ok: false, reason: `schema validation failed: ${parsed.error.message}` };
  }

  for (const section of parsed.data.sections) {
    const violation = findSafetyViolation(section.html);
    if (violation) {
      return { ok: false, reason: `safety-net rejected "${section.type}" section: ${violation}` };
    }
  }

  return { ok: true, design: parsed.data };
}

export async function generateOneDesign(recent: RecentDesign[]): Promise<GenerationResult> {
  const first = await callOnce(recent);
  if (first.ok) return first;

  const retry = await callOnce(recent);
  if (retry.ok) return retry;

  return { ok: false, reason: `failed twice; first: ${first.reason}; retry: ${retry.reason}` };
}
