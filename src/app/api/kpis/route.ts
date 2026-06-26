/**
 * GET /api/kpis — the four live numbers on the home view.
 * Fixed, indexed queries (not model-generated). Degrades to nulls if the DB
 * isn't connected yet so the dashboard still renders.
 */
import { NextResponse } from "next/server";
import { roPool } from "@/db/pools";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = roPool();
    const [revenue, stuck, lowStock, refundRate] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(total), 0) AS v FROM orders
         WHERE created_at >= date_trunc('day', now())`
      ),
      pool.query(
        `SELECT count(*) AS v FROM orders o
         WHERE o.status = 'stuck'
            OR (o.status = 'paid'
                AND NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id)
                AND o.created_at < now() - interval '5 days')`
      ),
      pool.query(`SELECT count(*) AS v FROM products WHERE inventory_qty <= reorder_point`),
      pool.query(
        `SELECT CASE WHEN o.c = 0 THEN 0
                ELSE round(100.0 * r.c / o.c, 1) END AS v
         FROM (SELECT count(*) c FROM orders WHERE created_at >= now() - interval '30 days') o,
              (SELECT count(*) c FROM refunds WHERE created_at >= now() - interval '30 days') r`
      ),
    ]);

    return NextResponse.json({
      revenueToday: Number(revenue.rows[0].v),
      stuckOrders: Number(stuck.rows[0].v),
      lowStock: Number(lowStock.rows[0].v),
      refundRatePct: Number(refundRate.rows[0].v),
    });
  } catch (err) {
    console.warn("[kpis] unavailable:", (err as Error)?.message);
    return NextResponse.json({ unavailable: true });
  }
}
