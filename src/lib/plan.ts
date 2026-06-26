/**
 * NL question -> structured plan, via Claude.
 *
 * The model is forced into a JSON shape (validated with Zod) rather than free
 * text: it either returns a single read-only SELECT, proposes one allowlisted
 * action, or refuses. We never execute model SQL without the guard, and never
 * execute an action without explicit user confirmation downstream.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SCHEMA_CONTEXT, GLOSSARY, ACTION_CATALOG } from "./schema-context";

// Right-sized per H0 cost guidance: Opus for the hard reasoning step.
export const PLAN_MODEL = process.env.PULSE_PLAN_MODEL ?? "claude-opus-4-8";

export const ChartSpec = z.object({
  type: z.enum(["number", "bar", "line", "pie", "table"]),
  x: z.string().optional(),
  y: z.string().optional(),
});

export const AskPlan = z.object({
  intent: z.enum(["query", "action", "refuse"]),
  sql: z.string().optional(),
  action: z
    .object({
      name: z.enum(["flag_orders", "create_refund", "adjust_inventory"]),
      args: z.record(z.string(), z.unknown()),
    })
    .optional(),
  chart_spec: ChartSpec.optional(),
  explanation: z.string(),
});
export type AskPlan = z.infer<typeof AskPlan>;

const SYSTEM_PROMPT = `
You are Pulse, an analyst for an e-commerce operations database (Amazon Aurora PostgreSQL).
You can ONLY read data via a single SELECT, or PROPOSE one allowlisted action, or refuse.

${SCHEMA_CONTEXT}

${GLOSSARY}

${ACTION_CATALOG}

RULES:
1. Respond with ONLY a JSON object — no markdown, no prose outside the JSON.
2. Shape: {"intent","sql"?,"action"?,"chart_spec"?,"explanation"}.
3. intent="query": write ONE valid PostgreSQL SELECT over the allowed tables.
   - Use explicit column lists; prefer the smallest correct query.
   - Never write INSERT/UPDATE/DELETE/DDL. Never chain statements.
   - Pick a chart_spec: "number" for a single value, "bar"/"line"/"pie" for grouped
     series (set x and y to result column names), "table" otherwise.
4. intent="action": for any request that CHANGES data (flag/refund/adjust), set
   intent="action" with a name from the catalog and its args. Do NOT write SQL.
5. intent="refuse": if the request is unsafe, mutating-via-SQL, ambiguous, or out of
   scope. Put the reason in "explanation".
6. Keep "explanation" to one short sentence.
`.trim();

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  return (client ??= new Anthropic());
}

/** Generate (and validate) a plan for a natural-language question. */
export async function generatePlan(question: string): Promise<AskPlan> {
  const msg = await anthropic().messages.create({
    model: PLAN_MODEL,
    max_tokens: 1024,
    system: [
      // Cache the stable schema/rules prefix to bound cost across requests.
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: question }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return AskPlan.parse(extractJson(text));
}

/** Tolerate the model wrapping JSON in prose or code fences. */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error(`No JSON object in model response: ${text.slice(0, 200)}`);
  return JSON.parse(candidate.slice(start, end + 1));
}
