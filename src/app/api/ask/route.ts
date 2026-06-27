/**
 * POST /api/ask  { question: string }
 *
 * The read path. Returns one of:
 *   { intent:"query",  rows, columns, sql, chartSpec, rowCount, latencyMs, explanation, warnings }
 *   { intent:"action", action, explanation }   -> UI shows a confirmation modal (handled by /api/act)
 *   { intent:"refuse", explanation }
 *
 * Safety: model SQL is validated by the guard and executed on the read-only pool.
 * Failures degrade gracefully — the dashboard never crashes on a bad question.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePlan } from "@/lib/plan";
import { guardSelect, UnsafeSqlError } from "@/lib/sql-guard";
import { roPool, rwPool } from "@/db/pools";
import { isDemoMode, mockAsk } from "@/lib/demo";

export const runtime = "nodejs";

const Body = z.object({ question: z.string().min(1).max(500) });

export async function POST(req: Request) {
  let question: string;
  try {
    question = Body.parse(await req.json()).question;
  } catch {
    return NextResponse.json({ error: "Body must be { question: string }" }, { status: 400 });
  }

  if (isDemoMode()) return NextResponse.json(mockAsk(question));

  // 1) NL -> plan
  let plan;
  try {
    plan = await generatePlan(question);
  } catch (err) {
    console.error("[ask] plan generation failed:", err);
    return NextResponse.json(
      { error: "Could not understand that right now. Please try rephrasing." },
      { status: 502 }
    );
  }

  if (plan.intent === "refuse") {
    return NextResponse.json({ intent: "refuse", explanation: plan.explanation });
  }

  if (plan.intent === "action") {
    // The write path is confirmed + executed by /api/act; here we just relay the proposal.
    return NextResponse.json({ intent: "action", action: plan.action, explanation: plan.explanation });
  }

  // 2) Guard the SQL (fail closed)
  if (!plan.sql) {
    return NextResponse.json({ intent: "refuse", explanation: "No query was produced." });
  }
  let guarded;
  try {
    guarded = guardSelect(plan.sql);
  } catch (err) {
    if (err instanceof UnsafeSqlError) {
      return NextResponse.json({
        intent: "refuse",
        explanation: `Refused for safety: ${err.message}`,
        sql: plan.sql,
      });
    }
    throw err;
  }

  // 3) Execute on the read-only pool
  const started = Date.now();
  let rows: Record<string, unknown>[];
  let columns: string[];
  try {
    const result = await roPool().query(guarded.sql);
    rows = result.rows;
    columns = result.fields.map((f) => f.name);
  } catch (err) {
    console.error("[ask] query execution failed:", err);
    return NextResponse.json(
      { intent: "refuse", explanation: "That query couldn't run against the database.", sql: guarded.sql },
      { status: 200 }
    );
  }
  const latencyMs = Date.now() - started;

  // 4) Log the read (best-effort; never blocks the response)
  logQuery(question, guarded.sql, rows.length, latencyMs);

  return NextResponse.json({
    intent: "query",
    sql: guarded.sql,
    columns,
    rows,
    rowCount: rows.length,
    latencyMs,
    chartSpec: plan.chart_spec ?? { type: "table" },
    explanation: plan.explanation,
    warnings: guarded.warnings,
  });
}

function logQuery(nl: string, sql: string, rowCount: number, latencyMs: number) {
  rwPool()
    .query(
      `INSERT INTO query_history (nl_question, generated_sql, row_count, latency_ms)
       VALUES ($1, $2, $3, $4)`,
      [nl, sql, rowCount, latencyMs]
    )
    .catch((e) => console.warn("[ask] query_history insert failed:", e?.message));
}
