/**
 * The write path. Unlike reads, writes are NEVER model-authored SQL.
 *
 * The model may only PROPOSE an action from this allowlist; the server
 * validates the args (Zod), runs a hand-written parameterized transaction, and
 * records an immutable audit_log entry. A human confirms before /api/act is
 * ever called. This is the originality + safety story for H0.
 */
import { z } from "zod";
import type { PoolClient } from "pg";
import { rwPool } from "@/db/pools";

export const ActionSchemas = {
  flag_orders: z.object({
    order_ids: z.array(z.number().int().positive()).min(1).max(500),
    reason: z.string().min(3).max(200),
  }),
  create_refund: z.object({
    order_id: z.number().int().positive(),
    amount: z.number().positive().max(100_000),
    reason: z.string().min(3).max(200),
  }),
  adjust_inventory: z.object({
    product_id: z.number().int().positive(),
    delta: z.number().int(),
    reason: z.string().min(3).max(200),
  }),
} as const;

export type ActionName = keyof typeof ActionSchemas;

export function isActionName(name: string): name is ActionName {
  return Object.prototype.hasOwnProperty.call(ActionSchemas, name);
}

const ENTITY_TYPE: Record<ActionName, string> = {
  flag_orders: "order",
  create_refund: "refund",
  adjust_inventory: "product",
};

/** One-line human preview for the confirmation modal (pure; no DB). */
export function describeAction(name: ActionName, args: Record<string, unknown>): string {
  switch (name) {
    case "flag_orders": {
      const ids = (args.order_ids as number[]) ?? [];
      return `Flag ${ids.length} order(s) for review — reason: "${args.reason}".`;
    }
    case "create_refund":
      return `Create a $${args.amount} refund on order #${args.order_id} — reason: "${args.reason}".`;
    case "adjust_inventory": {
      const d = Number(args.delta);
      return `Adjust inventory of product #${args.product_id} by ${d > 0 ? "+" : ""}${d} — reason: "${args.reason}".`;
    }
  }
}

/** Apply the mutation with parameterized queries inside an open transaction. */
async function apply(
  client: PoolClient,
  name: ActionName,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  switch (name) {
    case "flag_orders": {
      const a = ActionSchemas.flag_orders.parse(args);
      const res = await client.query(
        `INSERT INTO order_flags (order_id, reason, created_by)
         SELECT o.id, $2, $3 FROM orders o WHERE o.id = ANY($1::bigint[])
         RETURNING id`,
        [a.order_ids, a.reason, "demo-operator"]
      );
      return { flagged: res.rowCount, requested: a.order_ids.length };
    }
    case "create_refund": {
      const a = ActionSchemas.create_refund.parse(args);
      const res = await client.query(
        `INSERT INTO refunds (order_id, amount, reason, status)
         VALUES ($1, $2, $3, 'requested') RETURNING id`,
        [a.order_id, a.amount, a.reason]
      );
      return { refund_id: res.rows[0]?.id, order_id: a.order_id, amount: a.amount };
    }
    case "adjust_inventory": {
      const a = ActionSchemas.adjust_inventory.parse(args);
      await client.query(
        `INSERT INTO inventory_adjustments (product_id, delta, reason, actor)
         VALUES ($1, $2, $3, $4)`,
        [a.product_id, a.delta, a.reason, "demo-operator"]
      );
      const res = await client.query(
        `UPDATE products SET inventory_qty = inventory_qty + $2
         WHERE id = $1 RETURNING inventory_qty`,
        [a.product_id, a.delta]
      );
      return { product_id: a.product_id, delta: a.delta, new_qty: res.rows[0]?.inventory_qty };
    }
  }
}

export interface ActionResult {
  affected: Record<string, unknown>;
  auditId: string;
}

/** Validate -> transaction -> audit. The only entry point for writes. */
export async function executeAction(
  name: ActionName,
  rawArgs: unknown,
  actor = "demo-operator"
): Promise<ActionResult> {
  const args = ActionSchemas[name].parse(rawArgs) as Record<string, unknown>;
  const client = await rwPool().connect();
  try {
    await client.query("BEGIN");
    const affected = await apply(client, name, args);
    const audit = await client.query(
      `INSERT INTO audit_log (actor, action_type, entity_type, payload)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [actor, name, ENTITY_TYPE[name], JSON.stringify({ args, affected })]
    );
    await client.query("COMMIT");
    return { affected, auditId: audit.rows[0].id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
