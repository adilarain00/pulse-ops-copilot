/**
 * DEMO MODE — activated by DEMO_MODE=true in the environment.
 *
 * When active, ALL external calls (Anthropic API + Aurora PostgreSQL) are
 * bypassed. Every API route checks isDemoMode() first and returns pre-scripted
 * responses from this module.
 *
 * This exists ONLY for demonstration when the Anthropic API has no credits or
 * the database is unavailable. Remove DEMO_MODE=true to use the live path.
 */

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export function demoKpis() {
  return {
    revenueToday: 4832,
    stuckOrders: 15,
    lowStock: 12,
    refundRatePct: 4.2,
    demo: true,
    trends: {
      revenueToday: +12.4,
      stuckOrders: +3,
      lowStock: -2,
      refundRatePct: -0.3,
    },
  };
}

// ─── In-memory audit log ───────────────────────────────────────────────────────

type AuditEntry = {
  id: string;
  actor: string;
  action_type: string;
  entity_type: string;
  payload: { args?: Record<string, unknown>; affected?: Record<string, unknown> };
  created_at: string;
};

let _auditSeq = 99;

const _auditLog: AuditEntry[] = [
  {
    id: "97",
    actor: "demo-operator",
    action_type: "adjust_inventory",
    entity_type: "product",
    payload: {
      args: { product_id: 17, delta: 50, reason: "Restocked from supplier" },
      affected: { product_id: 17, delta: 50, new_qty: 73 },
    },
    created_at: new Date(Date.now() - 23 * 3600_000).toISOString(),
  },
  {
    id: "98",
    actor: "demo-operator",
    action_type: "create_refund",
    entity_type: "refund",
    payload: {
      args: { order_id: 89, amount: 247, reason: "Wrong item sent" },
      affected: { refund_id: 42, order_id: 89, amount: 247 },
    },
    created_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
  },
  {
    id: "99",
    actor: "demo-operator",
    action_type: "flag_orders",
    entity_type: "order",
    payload: {
      args: { order_ids: [12, 34], reason: "Late shipment — investigate carrier delay" },
      affected: { flagged: 2, requested: 2 },
    },
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
];

export function demoAuditLog(): AuditEntry[] {
  return [..._auditLog].reverse().slice(0, 25);
}

// ─── Mock act ─────────────────────────────────────────────────────────────────

const ENTITY_TYPE: Record<string, string> = {
  flag_orders: "order",
  create_refund: "refund",
  adjust_inventory: "product",
};

export function mockAct(name: string, args: Record<string, unknown>) {
  let affected: Record<string, unknown>;

  switch (name) {
    case "flag_orders": {
      const ids = (args.order_ids as number[]) ?? [];
      affected = { flagged: ids.length, requested: ids.length };
      break;
    }
    case "create_refund":
      affected = {
        refund_id: Math.floor(Math.random() * 900) + 100,
        order_id: args.order_id,
        amount: args.amount,
      };
      break;
    case "adjust_inventory":
      affected = {
        product_id: args.product_id,
        delta: args.delta,
        new_qty: Math.floor(Math.random() * 200) + 50,
      };
      break;
    default:
      affected = {};
  }

  const auditId = String(++_auditSeq);
  _auditLog.push({
    id: auditId,
    actor: "demo-operator",
    action_type: name,
    entity_type: ENTITY_TYPE[name] ?? "unknown",
    payload: { args, affected },
    created_at: new Date().toISOString(),
  });

  return { affected, auditId };
}

// ─── Mock ask ─────────────────────────────────────────────────────────────────

type QueryResp = {
  intent: "query";
  sql: string;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  latencyMs: number;
  chartSpec: { type: string; x?: string; y?: string };
  explanation: string;
  warnings: string[];
};

type ActionResp = {
  intent: "action";
  action: { name: string; args: Record<string, unknown> };
  explanation: string;
};

type RefuseResp = { intent: "refuse"; explanation: string; sql?: string };

export function mockAsk(question: string): QueryResp | ActionResp | RefuseResp {
  const q = question.toLowerCase();

  // ── Actions ──────────────────────────────────────────────────────────────
  if ((q.includes("flag") || q.includes("mark")) && (q.includes("stuck") || q.includes("order"))) {
    return {
      intent: "action",
      action: {
        name: "flag_orders",
        args: {
          order_ids: [12, 34, 56, 78, 91, 103, 145, 167, 189, 201, 234, 256, 278, 290, 311],
          reason: "Stuck in paid status without shipment — needs ops review",
        },
      },
      explanation:
        "Found 15 orders stuck in 'paid' status with no shipment after 5+ days. Proposing to flag all for ops review.",
    };
  }

  if (q.includes("refund") && (q.includes("create") || q.includes("issue") || q.includes("give"))) {
    const orderId = 124;
    return {
      intent: "action",
      action: {
        name: "create_refund",
        args: { order_id: orderId, amount: 189.5, reason: "Defective product — customer reported on delivery" },
      },
      explanation: `Creating a $189.50 refund on order #${orderId} for a defective item complaint.`,
    };
  }

  if (
    q.includes("restock") ||
    (q.includes("adjust") && q.includes("inventory")) ||
    (q.includes("add") && q.includes("stock"))
  ) {
    return {
      intent: "action",
      action: {
        name: "adjust_inventory",
        args: { product_id: 7, delta: 100, reason: "Emergency restock — shipment received from warehouse" },
      },
      explanation: "Adding 100 units to product #7 (Wireless Headphones Pro) based on warehouse receipt.",
    };
  }

  // ── Refusals ─────────────────────────────────────────────────────────────
  if (
    q.includes("delete") ||
    q.includes("drop") ||
    q.includes("truncate") ||
    q.includes("remove all") ||
    q.includes("wipe")
  ) {
    return {
      intent: "refuse",
      explanation:
        "Deleting or destroying data is not permitted through Pulse. Only safe SELECTs and three allowlisted writes (flag, refund, restock) are supported.",
    };
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  // Orders this week
  if ((q.includes("how many") || q.includes("count")) && q.includes("order")) {
    return {
      intent: "query",
      sql: `SELECT COUNT(*) AS order_count\nFROM orders\nWHERE created_at >= date_trunc('week', now())`,
      columns: ["order_count"],
      rows: [{ order_count: "47" }],
      rowCount: 1,
      latencyMs: 38,
      chartSpec: { type: "number", y: "order_count" },
      explanation: "47 orders placed since the start of this week (Monday).",
      warnings: [],
    };
  }

  // Revenue by category
  if (q.includes("revenue") && (q.includes("category") || q.includes("categori"))) {
    return {
      intent: "query",
      sql: `SELECT p.category,\n  ROUND(SUM(oi.qty * oi.unit_price)::numeric, 0) AS revenue\nFROM order_items oi\nJOIN products p ON p.id = oi.product_id\nJOIN orders o ON o.id = oi.order_id\nWHERE o.created_at >= now() - interval '30 days'\n  AND o.status NOT IN ('cancelled')\nGROUP BY p.category\nORDER BY revenue DESC`,
      columns: ["category", "revenue"],
      rows: [
        { category: "Electronics", revenue: "12450" },
        { category: "Apparel", revenue: "8932" },
        { category: "Home", revenue: "6140" },
        { category: "Beauty", revenue: "4210" },
        { category: "Outdoors", revenue: "2890" },
      ],
      rowCount: 5,
      latencyMs: 52,
      chartSpec: { type: "bar", x: "category", y: "revenue" },
      explanation: "Electronics leads with $12,450 in the last 30 days, followed by Apparel at $8,932.",
      warnings: [],
    };
  }

  // Revenue today
  if (q.includes("revenue") && (q.includes("today") || q.includes("daily"))) {
    return {
      intent: "query",
      sql: `SELECT COALESCE(SUM(total), 0)::numeric AS revenue_today\nFROM orders\nWHERE created_at >= date_trunc('day', now())\n  AND status NOT IN ('cancelled')`,
      columns: ["revenue_today"],
      rows: [{ revenue_today: "4832" }],
      rowCount: 1,
      latencyMs: 29,
      chartSpec: { type: "number", y: "revenue_today" },
      explanation: "Today's revenue is $4,832 from non-cancelled orders placed since midnight.",
      warnings: [],
    };
  }

  // Stuck orders
  if (q.includes("stuck")) {
    return {
      intent: "query",
      sql: `SELECT o.id, o.status, o.total::numeric AS total, o.created_at,\n  COALESCE(f.reason, 'No shipment after 5+ days') AS flag_reason\nFROM orders o\nLEFT JOIN order_flags f ON f.order_id = o.id\nWHERE o.status = 'stuck'\n   OR (o.status = 'paid'\n       AND NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id)\n       AND o.created_at < now() - interval '5 days')\nORDER BY o.created_at ASC\nLIMIT 20`,
      columns: ["id", "status", "total", "created_at", "flag_reason"],
      rows: [
        { id: "12",  status: "paid",  total: "142.50", created_at: "2026-06-20T08:14:00Z", flag_reason: "No shipment after 5+ days" },
        { id: "34",  status: "stuck", total: "89.00",  created_at: "2026-06-19T11:30:00Z", flag_reason: "Carrier pickup missed" },
        { id: "56",  status: "paid",  total: "234.75", created_at: "2026-06-18T15:42:00Z", flag_reason: "No shipment after 5+ days" },
        { id: "78",  status: "stuck", total: "67.25",  created_at: "2026-06-17T09:05:00Z", flag_reason: "Address validation failed" },
        { id: "91",  status: "paid",  total: "198.00", created_at: "2026-06-16T14:22:00Z", flag_reason: "No shipment after 5+ days" },
        { id: "103", status: "paid",  total: "312.50", created_at: "2026-06-15T10:18:00Z", flag_reason: "No shipment after 5+ days" },
        { id: "145", status: "stuck", total: "55.00",  created_at: "2026-06-14T16:55:00Z", flag_reason: "Payment hold" },
        { id: "167", status: "paid",  total: "178.25", created_at: "2026-06-13T08:30:00Z", flag_reason: "No shipment after 5+ days" },
        { id: "189", status: "paid",  total: "426.00", created_at: "2026-06-12T13:44:00Z", flag_reason: "No shipment after 5+ days" },
        { id: "201", status: "stuck", total: "93.75",  created_at: "2026-06-11T11:20:00Z", flag_reason: "Out of stock hold" },
        { id: "234", status: "paid",  total: "267.50", created_at: "2026-06-10T09:15:00Z", flag_reason: "No shipment after 5+ days" },
        { id: "256", status: "paid",  total: "134.00", created_at: "2026-06-09T14:38:00Z", flag_reason: "No shipment after 5+ days" },
        { id: "278", status: "stuck", total: "489.25", created_at: "2026-06-08T10:52:00Z", flag_reason: "International customs hold" },
        { id: "290", status: "paid",  total: "72.00",  created_at: "2026-06-07T15:30:00Z", flag_reason: "No shipment after 5+ days" },
        { id: "311", status: "paid",  total: "215.75", created_at: "2026-06-06T08:45:00Z", flag_reason: "No shipment after 5+ days" },
      ],
      rowCount: 15,
      latencyMs: 61,
      chartSpec: { type: "table" },
      explanation: "15 orders are stuck — 11 in 'paid' status with no shipment, 4 explicitly flagged 'stuck'.",
      warnings: [],
    };
  }

  // Refunds
  if (q.includes("refund")) {
    return {
      intent: "query",
      sql: `SELECT reason, COUNT(*) AS count,\n  ROUND(SUM(amount)::numeric, 0) AS total_amount\nFROM refunds\nWHERE created_at >= date_trunc('month', now())\n  AND amount > 200\nGROUP BY reason\nORDER BY total_amount DESC`,
      columns: ["reason", "count", "total_amount"],
      rows: [
        { reason: "defective",    count: "5", total_amount: "1842" },
        { reason: "wrong item",   count: "4", total_amount: "1203" },
        { reason: "late delivery",count: "3", total_amount: "947"  },
        { reason: "damaged",      count: "2", total_amount: "612"  },
        { reason: "changed mind", count: "1", total_amount: "247"  },
      ],
      rowCount: 5,
      latencyMs: 44,
      chartSpec: { type: "bar", x: "reason", y: "total_amount" },
      explanation: "Defective items account for the highest refund value this month at $1,842 across 5 orders.",
      warnings: [],
    };
  }

  // Stock / inventory
  if (q.includes("stock") || q.includes("inventory") || q.includes("reorder") || q.includes("low")) {
    return {
      intent: "query",
      sql: `SELECT sku, name, category,\n  inventory_qty, reorder_point,\n  (reorder_point - inventory_qty) AS units_needed\nFROM products\nWHERE inventory_qty <= reorder_point\nORDER BY (reorder_point - inventory_qty) DESC\nLIMIT 15`,
      columns: ["sku", "name", "category", "inventory_qty", "reorder_point", "units_needed"],
      rows: [
        { sku: "A7F3K2P9", name: "Wireless Headphones Pro", category: "Electronics", inventory_qty: "2",  reorder_point: "20", units_needed: "18" },
        { sku: "B1M8X5Q4", name: "Yoga Mat Premium",        category: "Outdoors",    inventory_qty: "4",  reorder_point: "15", units_needed: "11" },
        { sku: "C9D2L6R7", name: "Coffee Maker Deluxe",     category: "Home",        inventory_qty: "0",  reorder_point: "10", units_needed: "10" },
        { sku: "D4N0S3T8", name: "Face Serum Set",          category: "Beauty",      inventory_qty: "3",  reorder_point: "12", units_needed: "9"  },
        { sku: "E6H1V9W2", name: "Running Shoes Elite",     category: "Apparel",     inventory_qty: "7",  reorder_point: "15", units_needed: "8"  },
        { sku: "F2J5U8Y6", name: "Bluetooth Speaker",       category: "Electronics", inventory_qty: "5",  reorder_point: "12", units_needed: "7"  },
        { sku: "G8K3O7Z1", name: "Linen Shirt Classic",     category: "Apparel",     inventory_qty: "4",  reorder_point: "10", units_needed: "6"  },
        { sku: "H0P6A4C9", name: "Camping Lantern",         category: "Outdoors",    inventory_qty: "6",  reorder_point: "12", units_needed: "6"  },
        { sku: "I3Q9E1F5", name: "Hand Cream Luxury",       category: "Beauty",      inventory_qty: "8",  reorder_point: "13", units_needed: "5"  },
        { sku: "J7R2G8H4", name: "Smart Watch Band",        category: "Electronics", inventory_qty: "11", reorder_point: "15", units_needed: "4"  },
        { sku: "K5S0I6J3", name: "Throw Pillow Set",        category: "Home",        inventory_qty: "9",  reorder_point: "13", units_needed: "4"  },
        { sku: "L1T4K2M8", name: "Resistance Bands Kit",    category: "Outdoors",    inventory_qty: "12", reorder_point: "15", units_needed: "3"  },
      ],
      rowCount: 12,
      latencyMs: 35,
      chartSpec: { type: "table" },
      explanation: "12 SKUs at or below reorder point. Wireless Headphones Pro is most critical with only 2 units left.",
      warnings: [],
    };
  }

  // Top customers
  if (q.includes("customer") || q.includes("top buyer") || q.includes("ltv")) {
    return {
      intent: "query",
      sql: `SELECT c.name, c.email,\n  c.lifetime_value::numeric AS ltv,\n  COUNT(o.id) AS order_count\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nGROUP BY c.id, c.name, c.email, c.lifetime_value\nORDER BY ltv DESC\nLIMIT 10`,
      columns: ["name", "email", "ltv", "order_count"],
      rows: [
        { name: "Evelyn Chen",     email: "evelyn.chen@email.com",  ltv: "4892", order_count: "23" },
        { name: "Marcus Thompson", email: "m.thompson@email.com",   ltv: "4234", order_count: "18" },
        { name: "Priya Sharma",    email: "priya.s@email.com",      ltv: "3987", order_count: "21" },
        { name: "James O'Brien",   email: "jobrien@email.com",      ltv: "3621", order_count: "15" },
        { name: "Sofia Martinez",  email: "sofiamtz@email.com",     ltv: "3108", order_count: "19" },
        { name: "Liam Park",       email: "liam.park@email.com",    ltv: "2892", order_count: "14" },
        { name: "Amelia Brooks",   email: "abrooks@email.com",      ltv: "2756", order_count: "17" },
        { name: "Noah Williams",   email: "noah.w@email.com",       ltv: "2640", order_count: "12" },
        { name: "Isabella Kim",    email: "ikim@email.com",         ltv: "2445", order_count: "11" },
        { name: "Oliver Davis",    email: "oliver.d@email.com",     ltv: "2287", order_count: "9"  },
      ],
      rowCount: 10,
      latencyMs: 47,
      chartSpec: { type: "bar", x: "name", y: "ltv" },
      explanation: "Evelyn Chen is the top customer with $4,892 lifetime value across 23 orders.",
      warnings: [],
    };
  }

  // Default — order status breakdown
  return {
    intent: "query",
    sql: `SELECT status,\n  COUNT(*) AS count,\n  ROUND(AVG(total)::numeric, 2) AS avg_order_value\nFROM orders\nGROUP BY status\nORDER BY count DESC`,
    columns: ["status", "count", "avg_order_value"],
    rows: [
      { status: "delivered", count: "142", avg_order_value: "156.30" },
      { status: "shipped",   count: "67",  avg_order_value: "189.45" },
      { status: "paid",      count: "48",  avg_order_value: "143.20" },
      { status: "fulfilled", count: "23",  avg_order_value: "201.75" },
      { status: "pending",   count: "12",  avg_order_value: "98.60"  },
      { status: "stuck",     count: "15",  avg_order_value: "197.80" },
      { status: "cancelled", count: "5",   avg_order_value: "134.00" },
    ],
    rowCount: 7,
    latencyMs: 41,
    chartSpec: { type: "bar", x: "status", y: "count" },
    explanation: "Order status breakdown: 142 delivered, 67 in transit, 15 stuck requiring attention.",
    warnings: [],
  };
}
