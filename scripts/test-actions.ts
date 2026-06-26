/**
 * Validates the action allowlist arg-schemas — runs with no database:
 *   pnpm test:actions
 */
import { ActionSchemas, isActionName, describeAction } from "../src/lib/actions";

type Case = { name: string; action: string; args: unknown; expect: "ok" | "reject" };

const cases: Case[] = [
  { name: "flag_orders valid", action: "flag_orders", args: { order_ids: [1, 2, 3], reason: "no shipment in 5 days" }, expect: "ok" },
  { name: "flag_orders empty list rejected", action: "flag_orders", args: { order_ids: [], reason: "x" }, expect: "reject" },
  { name: "flag_orders short reason rejected", action: "flag_orders", args: { order_ids: [1], reason: "x" }, expect: "reject" },
  { name: "flag_orders negative id rejected", action: "flag_orders", args: { order_ids: [-1], reason: "valid reason" }, expect: "reject" },
  { name: "create_refund valid", action: "create_refund", args: { order_id: 10, amount: 49.99, reason: "damaged item" }, expect: "ok" },
  { name: "create_refund negative amount rejected", action: "create_refund", args: { order_id: 10, amount: -5, reason: "bad" }, expect: "reject" },
  { name: "adjust_inventory valid (negative delta ok)", action: "adjust_inventory", args: { product_id: 5, delta: -20, reason: "shrinkage" }, expect: "ok" },
  { name: "adjust_inventory non-integer delta rejected", action: "adjust_inventory", args: { product_id: 5, delta: 1.5, reason: "bad delta" }, expect: "reject" },
  { name: "unknown action name rejected", action: "drop_everything", args: {}, expect: "reject" },
];

let pass = 0;
let fail = 0;

for (const c of cases) {
  let got: "ok" | "reject";
  let detail = "";
  if (!isActionName(c.action)) {
    got = "reject";
    detail = "(unknown action)";
  } else {
    const r = ActionSchemas[c.action].safeParse(c.args);
    got = r.success ? "ok" : "reject";
    if (r.success) detail = `→ ${describeAction(c.action, c.args as Record<string, unknown>)}`;
    else detail = `(${r.error.issues[0]?.message})`;
  }
  const okCase = got === c.expect;
  if (okCase) pass++;
  else fail++;
  console.log(`${okCase ? "✅" : "❌"} ${c.name}: expected ${c.expect}, got ${got} ${detail}`);
}

console.log(`\n${pass}/${cases.length} passed${fail ? `, ${fail} FAILED` : ""}`);
process.exit(fail ? 1 : 0);
