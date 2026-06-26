/**
 * The schema + business glossary injected into the model prompt.
 * Kept hand-written (not introspected) so it's precise and stable for the demo,
 * and so it can be cached as a constant prefix (cheap, deterministic).
 */
export const SCHEMA_CONTEXT = `
TABLES (PostgreSQL):
  customers(id, name, email, created_at, lifetime_value)
  products(id, sku, name, category, price, inventory_qty, reorder_point)
  orders(id, customer_id -> customers.id, status, channel, total, created_at, updated_at)
    status in ('pending','paid','fulfilled','shipped','delivered','cancelled','stuck')
  order_items(id, order_id -> orders.id, product_id -> products.id, qty, unit_price)
  refunds(id, order_id -> orders.id, amount, reason, status, created_at)
  shipments(id, order_id -> orders.id, carrier, status, eta, created_at)
  order_flags(id, order_id -> orders.id, reason, status, created_by, created_at)
  inventory_adjustments(id, product_id -> products.id, delta, reason, actor, created_at)
  query_history(id, nl_question, generated_sql, row_count, latency_ms, created_at)
  audit_log(id, actor, action_type, entity_type, payload jsonb, created_at)
`.trim();

export const GLOSSARY = `
BUSINESS GLOSSARY:
  - "stuck order": status = 'stuck', OR (status = 'paid' AND no row in shipments
    for that order AND created_at < now() - interval '5 days').
  - "low stock" / "about to stock out": products.inventory_qty <= products.reorder_point.
  - "refund rate": count(refunds) / count(orders) over the chosen period.
  - "revenue": sum(order_items.qty * order_items.unit_price), or orders.total when
    items aren't needed.
  - "this week"/"this month"/"last N days": filter on created_at using now() - interval.
`.trim();

/** Allowlisted write actions the model may PROPOSE (never executes directly). */
export const ACTION_CATALOG = `
ALLOWED ACTIONS (propose these instead of writing mutating SQL):
  - flag_orders(order_ids: number[], reason: string)
  - create_refund(order_id: number, amount: number, reason: string)
  - adjust_inventory(product_id: number, delta: number, reason: string)
`.trim();
