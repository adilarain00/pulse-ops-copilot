/**
 * GET /api/history — recent query history for the dashboard.
 * Shows the NL questions and their generated SQL, proving the AI→SQL pipeline is working.
 */
import { NextResponse } from "next/server";
import { roPool } from "@/db/pools";
import { isDemoMode } from "@/lib/demo";

export const runtime = "nodejs";

export async function GET() {
  // Demo mode: return mock history
  if (isDemoMode()) {
    return NextResponse.json({
      entries: [
        {
          id: "h3",
          nl_question: "What's about to stock out?",
          generated_sql: "SELECT sku, name, inventory_qty FROM products WHERE inventory_qty <= reorder_point",
          row_count: 12,
          latency_ms: 35,
          created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
        },
        {
          id: "h2",
          nl_question: "Revenue by category last 30 days",
          generated_sql:
            "SELECT p.category, SUM(oi.qty * oi.unit_price) FROM order_items oi JOIN products p ON p.id = oi.product_id GROUP BY p.category",
          row_count: 5,
          latency_ms: 52,
          created_at: new Date(Date.now() - 10 * 60_000).toISOString(),
        },
        {
          id: "h1",
          nl_question: "How many orders this week?",
          generated_sql: "SELECT COUNT(*) FROM orders WHERE created_at >= date_trunc('week', now())",
          row_count: 1,
          latency_ms: 38,
          created_at: new Date(Date.now() - 15 * 60_000).toISOString(),
        },
      ],
    });
  }

  try {
    const r = await roPool().query(
      `SELECT id, nl_question, generated_sql, row_count, latency_ms, created_at
       FROM query_history
       ORDER BY created_at DESC
       LIMIT 10`
    );
    return NextResponse.json({ entries: r.rows });
  } catch (err) {
    console.warn("[history] unavailable:", (err as Error)?.message);
    return NextResponse.json({ entries: [] });
  }
}
