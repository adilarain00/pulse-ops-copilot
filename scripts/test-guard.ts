/**
 * Standalone test for the SQL guard — runs with no database or API key:
 *   pnpm test:guard
 *
 * Verifies the safety-critical logic that protects the read path.
 */
import { guardSelect, UnsafeSqlError } from "../src/lib/sql-guard";

type Case = { name: string; sql: string; expect: "allow" | "reject" };

const cases: Case[] = [
  { name: "simple count", sql: "SELECT count(*) FROM orders", expect: "allow" },
  {
    name: "revenue by category (3-table join)",
    sql: `SELECT p.category, SUM(oi.qty * oi.unit_price) AS revenue
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          JOIN orders o ON o.id = oi.order_id
          WHERE o.created_at >= now() - interval '30 days'
          GROUP BY p.category ORDER BY revenue DESC`,
    expect: "allow",
  },
  {
    name: "stuck orders (LEFT JOIN + interval)",
    sql: `SELECT o.id, o.total FROM orders o
          LEFT JOIN shipments s ON s.order_id = o.id
          WHERE o.status='paid' AND s.id IS NULL
          AND o.created_at < now() - interval '5 days'`,
    expect: "allow",
  },
  { name: "WITH/CTE select", sql: "WITH x AS (SELECT id FROM orders) SELECT * FROM x", expect: "allow" },
  { name: "trailing semicolon ok", sql: "SELECT 1 FROM products;", expect: "allow" },

  { name: "DELETE blocked", sql: "DELETE FROM orders", expect: "reject" },
  { name: "DROP blocked", sql: "DROP TABLE orders", expect: "reject" },
  { name: "UPDATE blocked", sql: "UPDATE products SET price = 0", expect: "reject" },
  { name: "INSERT blocked", sql: "INSERT INTO orders (total) VALUES (1)", expect: "reject" },
  {
    name: "statement chaining blocked",
    sql: "SELECT 1 FROM orders; DROP TABLE orders",
    expect: "reject",
  },
  {
    name: "disallowed table blocked",
    sql: "SELECT * FROM pg_user",
    expect: "reject",
  },
  {
    name: "GRANT blocked",
    sql: "GRANT ALL ON orders TO public",
    expect: "reject",
  },
  {
    name: "forbidden keyword inside otherwise-select is blocked",
    sql: "SELECT 1 FROM orders WHERE 1=1; TRUNCATE orders",
    expect: "reject",
  },
  {
    name: "keyword inside a string literal does NOT false-trigger",
    sql: "SELECT id FROM refunds WHERE reason = 'customer wants to delete account'",
    expect: "allow",
  },
];

let pass = 0;
let fail = 0;

for (const c of cases) {
  let got: "allow" | "reject";
  let detail = "";
  try {
    const res = guardSelect(c.sql);
    got = "allow";
    detail = res.warnings.length ? `(warnings: ${res.warnings.join("; ")})` : "";
  } catch (e) {
    got = "reject";
    detail = e instanceof UnsafeSqlError ? `(${e.message})` : `(UNEXPECTED: ${String(e)})`;
  }
  const ok = got === c.expect;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "✅" : "❌"} ${c.name}: expected ${c.expect}, got ${got} ${detail}`);
}

console.log(`\n${pass}/${cases.length} passed${fail ? `, ${fail} FAILED` : ""}`);
process.exit(fail ? 1 : 0);
